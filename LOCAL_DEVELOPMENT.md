# Local Development Guide

This guide explains how to develop and test the Grenzwanderer project locally, especially when switching between the **Freiburg (Default)** and **Karlsruhe (Event)** release profiles.

## Prerequisites

- **Bun**: `1.3.3`
- **SpacetimeDB CLI**: `2.0.1`
- **Git**

## Quick Start (Freiburg)

To work on the main project (Freiburg):

```bash
bun run dev:freiburg
```

This will:
1. Prepare the default release configuration.
2. Start the Vite development server.

## Quick Start (Karlsruhe Event)

To work on the Karlsruhe event:

```bash
bun run dev:karlsruhe
```

This will:
1. Set `VITE_RELEASE_PROFILE=karlsruhe_event`.
2. Prepare the Karlsruhe-specific configuration (injecting the correct tokens and host fallbacks).
3. Start the Vite development server.

## SpacetimeDB Integration

### Local Database
By default, the app expects a local SpacetimeDB instance on `127.0.0.1:3000`.

1. Start SpacetimeDB:
   ```bash
   spacetime start
   ```
2. In a separate terminal, publish the module:
   ```bash
   bun run spacetime:publish:local:clear
   ```

### Connecting to Maincloud (Production)
If you need to connect your local frontend to the production database for debugging:

1. Create or edit `.env.local`.
2. Add the following line:
   ```env
   VITE_SPACETIMEDB_HOST=https://maincloud.spacetimedb.com
   ```
3. Restart the dev server.

## Automation Details

We have automated the "baking" of configurations via the `release:config:prepare` script. This script runs automatically every time you run `bun run dev`.

### Key Environment Variables
- `VITE_RELEASE_PROFILE`: `default` or `karlsruhe_event`.
- `VITE_SPACETIMEDB_HOST`: URL of the SpacetimeDB server.
- `VITE_SPACETIMEDB_DB_NAME`: Name of the database/module.

## Troubleshooting

### Connection Error (WebSocket failed)
If you see `WebSocket connection to ws://localhost:3000/... failed`:
- Ensure `spacetime start` is running locally.
- OR ensure you have set `VITE_SPACETIMEDB_HOST` in `.env.local` if you intend to use the cloud.

### Stale Config
If the UI seems to show the wrong city/profile:
- Stop the dev server and run `bun run dev` again (it will re-generate the config).
- Clear browser localStorage/Cache if necessary.
