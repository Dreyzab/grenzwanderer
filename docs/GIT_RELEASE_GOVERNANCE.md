# Git And Release Governance

## Scope

This document defines the enforced git, PR, and release process for the Grenzwanderer private repository.

## Repo Root

- Authoritative repo root: `f:\proje\grenzwanderer\Grenzwanderer`

## Branching Model

- Default branch: `main`
- Working model: trunk-based development
- Short-lived branch prefixes:
  - `feat/`
  - `fix/`
  - `chore/`
  - `docs/`
  - `refactor/`
  - `test/`
  - `ci/`

## PR Rules

- All changes land through pull requests.
- `main` is protected.
- GitHub merge method: squash only.
- Head branches auto-delete after merge.
- Required review count: 1.
- Required status checks:
  - `quality`
  - `validate-title`

## PR Title Contract

Accepted prefixes:

- `feat`
- `fix`
- `chore`
- `docs`
- `refactor`
- `test`
- `ci`
- `build`

Format:

```text
type(scope): summary
```

Examples:

- `feat(character): add origin profile cards`
- `fix(vn): block replay after completion route`
- `ci(workflows): pin bun and spacetime versions`

Breaking changes use `!` or a `BREAKING CHANGE:` footer.

## Required GitHub Settings

Configure these manually in the GitHub UI after the remote exists:

1. Enable GitHub Actions.
2. Enable squash merges.
3. Disable direct pushes to `main`.
4. Enable auto-delete for merged branches.
5. Protect `main` with:
   - pull requests required;
   - 1 approval minimum;
   - stale review dismissal;
   - up-to-date branch requirement;
   - conversation resolution requirement;
   - force-push disabled;
   - branch deletion disabled;
   - required checks `quality` and `validate-title`.

## App Release Automation

- Release automation tool: `Release Please`
- Workflow: `.github/workflows/release-please.yml`
- Config:
  - `.release-please-config.json`
  - `.release-please-manifest.json`
- Source of truth for app version: `package.json`
- Git tag format: `app-vX.Y.Z`

Release flow:

1. Merge releasable PRs into `main`.
2. Release Please opens or updates the release PR.
3. Merge the release PR.
4. GitHub Release and `app-vX.Y.Z` tag are created automatically.

## App Baseline Bootstrap

For a new GitHub remote, create the initial governed tag manually once this governance setup has been pushed:

```bash
git tag -a app-v0.2.0 -m "Governed release baseline 0.2.0"
git push origin app-v0.2.0
```

This establishes the first stable release point before future automated bumps.

## Content Release Git Discipline

Content publishing remains manual and CLI-driven.

Required sequence:

```bash
bun run content:release -- --version X.Y.Z --server local --db grezwandererdata
bun run content:tag -- --version X.Y.Z
git push origin content-vX.Y.Z+checksum8
```

The `content:tag` helper reads the latest matching entry from `content/vn/releases.manifest.json` and creates an annotated git tag with checksum metadata.

## Staging Model

- No permanent staging URL in this phase.
- PRs receive a build artifact from `.github/workflows/preview-artifact.yml`.
- Preview artifacts are for engineering review only and use safe local/staging defaults.

## Non-Goals

- No GitHub Pages deployment.
- No production hosting rollout.
- No CODEOWNERS enforcement in this phase.
- No automated content publish from GitHub Actions.
