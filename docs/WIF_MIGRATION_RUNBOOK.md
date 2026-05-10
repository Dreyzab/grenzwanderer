# Workload Identity Federation (WIF) Migration Runbook

## Scope

Replace the long-lived `GCP_CREDENTIALS` JSON service-account key used by
`deploy-prod.yml` and `deploy-karlsruhe.yml` with short-lived GitHub OIDC
credentials through Google Cloud Workload Identity Federation.

After this migration:

- GitHub Actions no longer stores a long-lived GCP key.
- Deploy jobs receive short-lived credentials only from this repository.
- Freiburg and Karlsruhe deploy permissions are separated by service account.
- Branch-level impersonation is restricted in IAM.

## Pre-flight

You need a GCP user with these project roles on `detective-prod-8f6f0`:

- `roles/iam.workloadIdentityPoolAdmin`
- `roles/iam.serviceAccountAdmin`
- `roles/resourcemanager.projectIamAdmin`
- `roles/serviceusage.serviceUsageAdmin`

Run all `gcloud` commands from your local machine after `gcloud auth login`.

## One-time GCP setup

```bash
# Variables
export PROJECT_ID="detective-prod-8f6f0"
export PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" \
  --format='value(projectNumber)')
export POOL_NAME="github-actions"
export PROVIDER_NAME="github"
export GH_REPO="Dreyzab/grenzwanderer"
export GH_OWNER="Dreyzab"

export FREIBURG_SA_NAME="grenzwanderer-freiburg-deployer"
export FREIBURG_SA_EMAIL="${FREIBURG_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
export KARLSRUHE_SA_NAME="grenzwanderer-karlsruhe-deployer"
export KARLSRUHE_SA_EMAIL="${KARLSRUHE_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# If the Cloud Run service already exists, use its runtime service account.
# If it does not exist yet, the deploy will use the Compute default SA unless
# the workflow is changed to pass an explicit --service-account flag.
export KARLSRUHE_RUNTIME_SA=$(gcloud run services describe karlsruhe-scene-gen \
  --project="$PROJECT_ID" \
  --region="europe-west3" \
  --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null || true)
if [ -z "$KARLSRUHE_RUNTIME_SA" ]; then
  export KARLSRUHE_RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
fi

# 1. Enable APIs
gcloud services enable \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  cloudresourcemanager.googleapis.com \
  --project="$PROJECT_ID"

# 2. Create Workload Identity Pool
gcloud iam workload-identity-pools create "$POOL_NAME" \
  --project="$PROJECT_ID" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# 3. Create OIDC Provider
# The provider accepts tokens only from this repository. Branch separation is
# enforced on each service account binding below via attribute.repository_ref.
gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_NAME" \
  --project="$PROJECT_ID" \
  --location="global" \
  --workload-identity-pool="$POOL_NAME" \
  --display-name="GitHub OIDC" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner,attribute.ref=assertion.ref,attribute.repository_ref=assertion.repository + ':' + assertion.ref" \
  --attribute-condition="assertion.repository == '${GH_REPO}' && assertion.repository_owner == '${GH_OWNER}'"

# 4. Create deployer service accounts
gcloud iam service-accounts create "$FREIBURG_SA_NAME" \
  --project="$PROJECT_ID" \
  --display-name="Grenzwanderer Freiburg GitHub Deployer"

gcloud iam service-accounts create "$KARLSRUHE_SA_NAME" \
  --project="$PROJECT_ID" \
  --display-name="Grenzwanderer Karlsruhe GitHub Deployer"

# 5. Grant Freiburg only the Hosting permission it needs
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${FREIBURG_SA_EMAIL}" \
  --role="roles/firebasehosting.admin" \
  --condition=None

# 6. Grant Karlsruhe Hosting, Cloud Run, and Artifact Registry permissions
for role in \
  roles/firebasehosting.admin \
  roles/run.admin
do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${KARLSRUHE_SA_EMAIL}" \
    --role="$role" \
    --condition=None
done

gcloud artifacts repositories add-iam-policy-binding grenzwanderer \
  --project="$PROJECT_ID" \
  --location="europe-west3" \
  --member="serviceAccount:${KARLSRUHE_SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

# Cloud Run deploys need iam.serviceAccounts.actAs on the runtime SA. Keep this
# binding on the runtime service account itself, not project-wide.
gcloud iam service-accounts add-iam-policy-binding "$KARLSRUHE_RUNTIME_SA" \
  --project="$PROJECT_ID" \
  --member="serviceAccount:${KARLSRUHE_SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

# 7. Allow each GitHub branch to impersonate only its deployer SA
gcloud iam service-accounts add-iam-policy-binding "$FREIBURG_SA_EMAIL" \
  --project="$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/attribute.repository_ref/${GH_REPO}:refs/heads/main"

gcloud iam service-accounts add-iam-policy-binding "$KARLSRUHE_SA_EMAIL" \
  --project="$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/attribute.repository_ref/${GH_REPO}:refs/heads/release/karlsruhe"

# 8. Print the values you need for GitHub secrets
echo "WIF_PROVIDER=projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/providers/${PROVIDER_NAME}"
echo "WIF_FREIBURG_SERVICE_ACCOUNT=${FREIBURG_SA_EMAIL}"
echo "WIF_KARLSRUHE_SERVICE_ACCOUNT=${KARLSRUHE_SA_EMAIL}"
```

## GitHub repo setup

In `Settings -> Secrets and variables -> Actions`:

1. Add these new secrets:
   - `WIF_PROVIDER`
   - `WIF_FREIBURG_SERVICE_ACCOUNT`
   - `WIF_KARLSRUHE_SERVICE_ACCOUNT`
2. Keep `GCP_CREDENTIALS` for now. Delete it only after both deploy workflows
   have passed with WIF.
3. Keep `GCP_PROJECT_ID`, `STDB_OPERATOR_TOKEN`, `VITE_MAPBOX_TOKEN`,
   `GEMINI_API_KEY`, and `KARLSRUHE_ENTRY_TOKEN` unchanged.

## Workflow diffs to apply

Apply these diffs after the GCP setup and after adding the new GitHub secrets.
Applying them earlier will break deploys.

### `.github/workflows/deploy-prod.yml`

```diff
 jobs:
   deploy:
     name: Build and Deploy
     runs-on: ubuntu-latest
+    permissions:
+      contents: read
+      id-token: write
     env:
       STDB_VERSION: "2.0.1"
       STDB_UPDATER_SHA256: "1ec25f3b7060e651887b04492e38257f6ee81e35daf73e52d682d20d50475fbd"
     steps:
       ...
       - name: Google Auth
         uses: google-github-actions/auth@7b53cdc2a387814ed14eec026287aac689ae8c9b # v2.1.9
         with:
-          credentials_json: ${{ secrets.GCP_CREDENTIALS }}
+          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
+          service_account: ${{ secrets.WIF_FREIBURG_SERVICE_ACCOUNT }}
+          project_id: ${{ secrets.GCP_PROJECT_ID || 'detective-prod-8f6f0' }}
```

### `.github/workflows/deploy-karlsruhe.yml`

```diff
     steps:
       - name: Checkout
         uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1

-      - name: Verify GCP Secrets
+      - name: Verify WIF Secrets
         run: |
-          if [ -z "${{ secrets.GCP_CREDENTIALS }}" ]; then
-            echo "::error::GCP_CREDENTIALS secret is empty!"
+          if [ -z "${{ secrets.WIF_PROVIDER }}" ] || [ -z "${{ secrets.WIF_KARLSRUHE_SERVICE_ACCOUNT }}" ]; then
+            echo "::error::WIF_PROVIDER or WIF_KARLSRUHE_SERVICE_ACCOUNT secret is empty!"
             exit 1
           fi

       - name: Google Auth
         uses: google-github-actions/auth@7b53cdc2a387814ed14eec026287aac689ae8c9b # v2.1.9
         with:
-          credentials_json: ${{ secrets.GCP_CREDENTIALS }}
+          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
+          service_account: ${{ secrets.WIF_KARLSRUHE_SERVICE_ACCOUNT }}
+          project_id: ${{ env.PROJECT_ID }}
       ...
       - name: Deploy to Firebase (Manual)
         run: |
-          trap 'rm -f gcp-key.json' EXIT
-          echo '${{ secrets.GCP_CREDENTIALS }}' > gcp-key.json
-          GOOGLE_APPLICATION_CREDENTIALS=gcp-key.json bun x --no-install -p firebase-tools firebase deploy --only hosting:karlsruhe-event --project "${PROJECT_ID}" --non-interactive
+          # google-github-actions/auth@v2 exports GOOGLE_APPLICATION_CREDENTIALS
+          # to a short-lived WIF credential file. firebase-tools uses ADC.
+          bun x --no-install -p firebase-tools firebase deploy --only hosting:karlsruhe-event --project "${PROJECT_ID}" --non-interactive
```

`firebase-tools` is pinned in `package.json` and `bun.lock`; `bun x
--no-install -p firebase-tools firebase` fails instead of downloading a new
deploy-time CLI from npm.

## Verification

1. Push a no-op change to a feature branch and open a PR. Confirm `ci.yml` is
   unaffected because CI does not need GCP access.
2. Merge to `main` and watch `deploy-prod.yml` for:
   - `Successfully authenticated using "workload_identity_provider"`
   - Firebase Hosting deploy success.
3. Push to `release/karlsruhe` and confirm:
   - Docker push to Artifact Registry succeeds.
   - Cloud Run deploy succeeds.
   - Firebase Hosting deploy succeeds using ADC, with no `gcp-key.json` file.

If IAM was just created, wait at least five minutes before treating a WIF error
as real; Workload Identity Pool and IAM propagation is not instant.

## Cleanup after both deploys pass

1. Delete the `GCP_CREDENTIALS` GitHub Actions secret.
2. Delete the underlying service account key in GCP:
   ```bash
   gcloud iam service-accounts keys list --iam-account=<old-sa-email>
   gcloud iam service-accounts keys delete <KEY_ID> --iam-account=<old-sa-email>
   ```
3. Rotate any adjacent secrets that may have been copied or logged alongside the
   JSON key.

## Rollback plan

If deploys break and you need to revert immediately:

1. Restore the previous workflow files with `git revert <commit>`.
2. Re-add `GCP_CREDENTIALS` if you already deleted it.
3. Keep the WIF pool/provider/service accounts in place while investigating.
   They do not interfere with the legacy JSON-key path.

To remove the WIF resources later:

```bash
gcloud iam workload-identity-pools providers delete "$PROVIDER_NAME" \
  --project="$PROJECT_ID" \
  --location=global \
  --workload-identity-pool="$POOL_NAME"

gcloud iam workload-identity-pools delete "$POOL_NAME" \
  --project="$PROJECT_ID" \
  --location=global

gcloud iam service-accounts delete "$FREIBURG_SA_EMAIL" --project="$PROJECT_ID"
gcloud iam service-accounts delete "$KARLSRUHE_SA_EMAIL" --project="$PROJECT_ID"
```

## References

- https://github.com/google-github-actions/auth#setting-up-workload-identity-federation
- https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines
- https://firebase.google.com/docs/cli#use_the_cli_with_ci_systems
