# Karlsruhe Firebase Deploy Runbook

## Scope

This runbook deploys the Karlsruhe event SPA to Firebase Hosting and proxies `/api/**`
to the dedicated Cloud Run scene-generation service.

## Required placeholders

Replace these placeholders before the first deploy:

- `__FIREBASE_PROJECT_ID__`
- `__KARLSRUHE_HOSTING_SITE_ID__`
- `__KARLSRUHE_SCENE_GEN_SERVICE__`

## Expected environment

Frontend build:

- `VITE_RELEASE_PROFILE=karlsruhe_event`
- `VITE_SPACETIMEDB_DB_NAME=grezwandererdata-karlsruhe`
- `VITE_SCENE_GEN_BASE_URL=/api`
- `VITE_KARLSRUHE_ENTRY_TOKEN=<opaque event token>`

Cloud Run scene generation:

- `SCENE_GEN_RELEASE_PROFILE=karlsruhe_event`
- `SCENE_GEN_PROMPT_VERSION=karlsruhe-v1`

## First-time setup

1. Create or confirm the dedicated Karlsruhe Hosting site inside the existing Firebase project.
2. Replace the placeholders in `.firebaserc` and `firebase.json`.
3. Deploy the Cloud Run service from `cloud_run/scene_gen`.
4. Allow unauthenticated invocation for the Cloud Run service used by the Hosting rewrite.
5. Keep the Cloud Run response time below Hosting's rewrite timeout budget.

## Release steps

1. Run `bun run content:extract:karlsruhe`.
2. Run `bun run build:karlsruhe`.
3. Run `bun run smoke:karlsruhe:all`.
4. Run `bun run deploy:firebase:karlsruhe`.
5. Verify:
   - `/` renders the QR gate.
   - `/karlsruhe?entry=<valid>` opens the arrival flow.
   - `/api/scene/generate` returns `200` through Hosting.

## Notes

- The rewrite must stay pinned to the Karlsruhe Cloud Run service; do not route Karlsruhe traffic through the Freiburg backend path.
- Firebase Hosting rewrites to Cloud Run require the Cloud Run service to allow invocation from Hosting, and Hosting rewrites have a 60 second response window.
- Reference docs:
  - https://firebase.google.com/docs/hosting/cloud-run
  - https://firebase.google.com/docs/hosting/full-config
