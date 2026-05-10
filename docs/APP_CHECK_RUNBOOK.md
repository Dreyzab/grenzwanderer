# Cloud Run App Check Rollout Runbook

## Scope

`karlsruhe-scene-gen` is currently `--allow-unauthenticated`. This runbook
adds Firebase App Check verification to the service so only browser sessions
that hold a valid attestation token can call `/api/scene/generate`. Smoke
scripts and other non-browser callers use a shared bypass secret.

The server-side change has already shipped behind a feature flag
(`APP_CHECK_ENFORCE`, default `false`). Until the flag is flipped to `true`,
verification runs in log-only mode: failures emit a Sentry warning but the
request still succeeds. This lets the frontend wiring catch up before any
traffic is rejected.

## Pre-flight

You need a GCP user with these project roles on `detective-prod-8f6f0`:

- `roles/firebase.admin` (Firebase project admin)
- `roles/serviceusage.serviceUsageAdmin` (to enable APIs)
- `roles/secretmanager.admin` (to create and grant access to the bypass secret)
- Permission to create GitHub Actions secrets and variables

Run all `gcloud` commands from your local machine after `gcloud auth login`.

## One-time GCP / Firebase setup

### 1. Enable required APIs

```bash
export PROJECT_ID="detective-prod-8f6f0"

gcloud services enable \
  firebaseappcheck.googleapis.com \
  recaptchaenterprise.googleapis.com \
  --project="$PROJECT_ID"
```

### 2. Capture the project number

```bash
export PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" \
  --format='value(projectNumber)')
echo "PROJECT_NUMBER=$PROJECT_NUMBER"
```

This value goes into the `APP_CHECK_PROJECT_NUMBER` GitHub secret below.

### 3. Register the Karlsruhe Hosting site as a Firebase Web App

App Check requires a registered Firebase Web App per origin. If
`karlsruhe-event-prod.web.app` is not yet a registered Web App:

1. Open https://console.firebase.google.com/project/detective-prod-8f6f0/settings/general
2. **Your apps → Add app → Web** (`</>`)
3. App nickname: `karlsruhe-event-web`. Skip Firebase Hosting connect (already
   wired via `firebase.json`).
4. Note the resulting **App ID** (looks like `1:1234567890:web:abcdef...`).
   You will not need it on the server, but keep it for the frontend wiring
   step in Phase 2.

### 4. Create a reCAPTCHA Enterprise site key

```bash
gcloud recaptcha keys create \
  --display-name="karlsruhe-event-appcheck" \
  --web \
  --domains=karlsruhe-event-prod.web.app \
  --integration-type=score \
  --project="$PROJECT_ID"
```

The output prints the **site key** (e.g. `6Lc...`). Note it for Phase 2 — the
frontend bundles it as `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` to obtain App
Check tokens.

### 5. Bind the reCAPTCHA key to App Check

In the Firebase console:

1. https://console.firebase.google.com/project/detective-prod-8f6f0/appcheck
2. Pick the `karlsruhe-event-web` app.
3. **reCAPTCHA Enterprise → Configure**, paste the site key from step 4.
4. Set token TTL to 1 hour (default).
5. Leave enforcement **off** for now (we ship server changes in monitoring
   mode first).

### 6. Store a bypass secret for smoke / migration callers

```bash
# 32-byte URL-safe random secret. Keep it out of logs.
export APP_CHECK_BYPASS_SECRET="$(python -c "import secrets; print(secrets.token_urlsafe(32))")"
export APP_CHECK_BYPASS_SECRET_NAME="karlsruhe-scene-gen-app-check-bypass"

printf "%s" "$APP_CHECK_BYPASS_SECRET" | gcloud secrets create "$APP_CHECK_BYPASS_SECRET_NAME" \
  --project="$PROJECT_ID" \
  --replication-policy="automatic" \
  --data-file=-
```

Treat the generated value as a credential. It rotates only when revoked.

Grant the Cloud Run runtime service account access to the secret:

```bash
export REGION="europe-west3"
export SERVICE="karlsruhe-scene-gen"
export RUNTIME_SA="$(gcloud run services describe "$SERVICE" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --format='value(spec.template.spec.serviceAccountName)')"

if [ -z "$RUNTIME_SA" ]; then
  RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
fi

gcloud secrets add-iam-policy-binding "$APP_CHECK_BYPASS_SECRET_NAME" \
  --project="$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/secretmanager.secretAccessor"
```

If the deployer service account is already narrowed for WIF, grant it read
metadata permission for deploy-time validation if Cloud Run deploy reports a
secret permission error:

```bash
gcloud secrets add-iam-policy-binding "$APP_CHECK_BYPASS_SECRET_NAME" \
  --project="$PROJECT_ID" \
  --member="serviceAccount:grenzwanderer-karlsruhe-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.viewer"
```

## GitHub repo setup

Add these to **Settings → Secrets and variables → Actions**:

| Name                          | Type     | Value                                                    |
| ----------------------------- | -------- | -------------------------------------------------------- |
| `APP_CHECK_PROJECT_NUMBER`    | Secret   | `$PROJECT_NUMBER` from step 2                            |
| `APP_CHECK_BYPASS_SECRET_REF` | Variable | `karlsruhe-scene-gen-app-check-bypass:latest`            |
| `APP_CHECK_ENFORCE`           | Variable | `false` initially. Flip to `true` after Phase 2 rollout. |

Re-running `release/karlsruhe` deploys the Cloud Run revision with the new
env vars and mounts the bypass value from Secret Manager as the
`APP_CHECK_BYPASS_SECRET` environment variable. If `APP_CHECK_BYPASS_SECRET_REF`
is not set yet, the workflow uses the non-secret deploy step so current deploys
continue to work during rollout.

The existing `--allow-unauthenticated` flag stays — the server now gates access
internally. Removing the Cloud Run-level flag is a separate follow-up once App
Check enforcement is verified stable.

## Frontend wiring (Phase 2 — separate change)

The frontend code path is controlled by `VITE_APP_CHECK_ENABLED`. Keep the
GitHub variable `APP_CHECK_FRONTEND_ENABLED=false` until the Firebase Web App
and reCAPTCHA Enterprise key are registered.

Add these public Firebase Web config values to **Settings → Secrets and
variables → Actions → Variables**:

| Name                                      | Value                                      |
| ----------------------------------------- | ------------------------------------------ |
| `APP_CHECK_FRONTEND_ENABLED`              | `false` initially, then `true` for Phase 2 |
| `KARLSRUHE_FIREBASE_API_KEY`              | Firebase Web App `apiKey`                  |
| `KARLSRUHE_FIREBASE_APP_ID`               | Firebase Web App `appId`                   |
| `KARLSRUHE_RECAPTCHA_ENTERPRISE_SITE_KEY` | reCAPTCHA Enterprise site key from step 4  |

These values are bundled into the browser app and are not credentials. The
private bypass credential stays in Secret Manager.

```ts
// src/shared/appCheck.ts initializes App Check lazily and only when all
// VITE_* values above are present. sceneGeneration.ts attaches
// X-Firebase-AppCheck to /api/scene/generate when a token is available.
```

## Rollout plan

1. **Today (server side, log-only).** Merge the server changes with
   `APP_CHECK_ENFORCE=false`. Deploy. Watch Sentry for events tagged
   `app_check.*` — these tell you which callers are missing tokens.
2. **Phase 2 (frontend wiring).** Set `APP_CHECK_FRONTEND_ENABLED=true`,
   deploy frontend, and confirm in Sentry that legitimate browser traffic is
   now sending valid tokens (Sentry `app_check.invalid_token` and
   `app_check.missing_token` rates drop towards zero).
3. **Smoke scripts.** Set `APP_CHECK_BYPASS_SECRET` in the smoke environment.
   `scripts/smoke-karlsruhe-scene-gen.ts` automatically passes
   `X-AppCheck-Bypass` when that env var is present.
4. **Flip enforcement.** Set the `APP_CHECK_ENFORCE` GitHub Actions
   _variable_ to `true`. Re-deploy `release/karlsruhe`. Cloud Run now returns
   401 for unauthenticated scene-gen calls.
5. **Drop `--allow-unauthenticated` (optional, later).** With App Check
   enforced at the application layer, the Cloud Run invoker remains public
   but the service rejects unauthenticated requests itself. Removing
   `--allow-unauthenticated` is a stricter posture but couples to whichever
   service account Firebase Hosting uses for rewrites — leave for a later
   pass.

## Verification

After step 1 (log-only deploy):

```bash
# Without token → expect 200 in log-only mode + Sentry warning
curl -fsSL -X POST https://karlsruhe-event-prod.web.app/api/scene/generate \
  -H 'content-type: application/json' \
  -d '{"caseId":"smoke","pointId":"smoke","scenarioId":"karlsruhe_event_arrival","mode":"prompt_only"}'

# With bypass → expect 200 + no Sentry warning
curl -fsSL -X POST https://karlsruhe-event-prod.web.app/api/scene/generate \
  -H 'content-type: application/json' \
  -H "X-AppCheck-Bypass: $APP_CHECK_BYPASS_SECRET" \
  -d '{"caseId":"smoke","pointId":"smoke","scenarioId":"karlsruhe_event_arrival","mode":"prompt_only"}'

# /healthz → unchanged, no auth required
curl -fsSL https://karlsruhe-event-prod.web.app/api/healthz
```

After step 4 (enforcement on):

```bash
# Without token → expect 401
curl -i -X POST https://karlsruhe-event-prod.web.app/api/scene/generate \
  -H 'content-type: application/json' \
  -d '{"caseId":"smoke","pointId":"smoke","scenarioId":"karlsruhe_event_arrival","mode":"prompt_only"}'
# HTTP/2 401
```

## Rollback plan

If enforcement causes legitimate traffic to drop:

1. Set the `APP_CHECK_ENFORCE` GitHub Actions variable back to `false`.
2. Re-run the `release/karlsruhe` deploy. Cloud Run revision returns to
   log-only behavior immediately.

If the entire App Check stack misbehaves and even log-only is noisy:

3. Set `APP_CHECK_ENFORCE=false`.
4. If you also want to silence log-only App Check warnings entirely, unset both
   `APP_CHECK_PROJECT_NUMBER` and `APP_CHECK_BYPASS_SECRET_REF`, then redeploy.
   With both unset, the server bypasses the verifier path entirely (no Firebase
   Admin SDK calls) — same as the old `--allow-unauthenticated` behavior.

## References

- https://firebase.google.com/docs/app-check
- https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider
- https://firebase.google.com/docs/app-check/cloud-run
- https://cloud.google.com/recaptcha/docs/create-key-website
