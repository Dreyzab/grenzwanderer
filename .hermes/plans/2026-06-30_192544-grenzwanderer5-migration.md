# Grenzwanderer5 Migration Plan

> **For Hermes:** This is a planning-only document. Do not execute migration steps until Andrey explicitly approves the migration mode. When implementing, use small verified batches and preserve the old project as an archive/quarry.

**Goal:** Create `F:/proje/grenzwanderer5` as a clean implementation spine for Freiburg 1900 / Case01 without carrying over generated artifacts, prototype drift, OpenViking caches, or duplicate canon layers from `F:/proje/grenzwanderer/Grenzwanderer`.

**Architecture:** Treat old `grenzwanderer/Grenzwanderer` as an active quarry/archive, not as trash. The new project starts from a minimal technical shell plus explicitly migrated canon/runtime files recorded in `MIGRATION_LEDGER.md`. Authority is locked early: machine-ledgers and runtime registries win over prose; StoryDetective is the VN runtime source; Detectiv remains design/reference unless promoted.

**Tech Stack:** Current source project uses React/Vite/TypeScript/Bun/Vitest, Tailwind, SpacetimeDB scripts, Obsidian content extraction, OpenViking indexing scripts. `grenzwanderer5` should initially keep only the subset needed for a playable Case01 vertical slice.

---

## 0. Current context from inspection

### Source paths

- Workspace wrapper: `F:/proje/grenzwanderer`
- Actual git repo: `F:/proje/grenzwanderer/Grenzwanderer`
- Proposed target: `F:/proje/grenzwanderer5`

### Important observed state

- `F:/proje/grenzwanderer` itself is not a git repository.
- `F:/proje/grenzwanderer/Grenzwanderer` is on branch `feature/localization-hardening`.
- Current working tree is dirty: `107` changed/untracked entries at inspection time.
- There are untracked canonical-looking files that must not be lost:
  - `data/currentCanon.ts`
  - `data/currentCanon.test.ts`
  - `docs/CURRENT_CANON.md`
  - `docs/adr/`
  - `docs/CASE01_CHARACTER_RELATIONSHIPS.md`
  - `docs/CHARACTER_REGISTRY_AUDIT.md`
  - `docs/CHARACTER_ROSTER.md`
  - `docs/JOURNALIST_ORIGIN_BIBLE.md`
  - `obsidian/Detectiv/00_Map_Room/qst_victoria_shadow_case.md`
  - `public/VN/start/journalist/`
  - `scripts/journalist-origin-wakeup.test.ts`
  - visual scene assets under `public/images/scenes/bureau-arrival/`

### Canon constraints that must survive migration

- `docs/CASE01_CANON_IDENTITY.md` fixes identity policy:
  - Matthias Adler = detective origin.
  - Arthur Vance = journalist origin, not detective alias.
  - Lotte Weber = `npc_weber_dispatcher`; `operator` is legacy role key.
  - Victoria Sterling replaces deprecated Clara planning shard unless future ADR separates Clara.
  - Bank is `Bankhaus J.A. Krebs`.
  - Culprit spelling is `Heinrich Galdermann`.
- `docs/CURRENT_CANON.md` + `data/currentCanon.ts` define a thin machine-ledger policy:
  - operational era is Freiburg `1900`.
  - `1905` is a retcon candidate only.
  - Inner Parliament runtime skill voices = 24.
  - method-display voices = 18.
  - compatibility voices = 6 transitional runtime debt.
  - motive factions = 8.
  - `attr_*` = method/how; `inner_*` = motive/why.
- `docs/adr/0001-freiburg-1900-operational-canon.md` is accepted and project-local:
  - supported Freiburg/Case01 uses 1900.
  - 1905 remains legacy/prototype/display drift until another ADR.
  - shared Earth↔Edem canon is not automatically changed by this project decision.
- `docs/OBSIDIAN_VN_CONTRACT.md` fixes content authority:
  - runtime narrative vault root is `obsidian/StoryDetective`.
  - design/planning docs live in `obsidian/Detectiv`.
  - only StoryDetective is parsed into canonical VN snapshots.
  - `content:extract` is the only command that should rewrite snapshot artifacts.
- `CONTEXT.md` fixes terminology:
  - Player, Character, Story, Fact, Knowledge, Evidence.
  - Avoid overloaded `Memory`; split into Knowledge, Disposition, episodic history.

---

## 1. Migration doctrine

### Core rule

`grenzwanderer5` is not a reboot of canon. It is the cleaned implementation spine of Freiburg 1900 / Case01.

### Source-of-truth hierarchy in the new project

1. Machine/runtime ledgers and registries.
2. ADRs.
3. Thin human canon docs.
4. StoryDetective runtime VN source.
5. Detectiv design/reference docs.
6. Generated snapshots and public build outputs.
7. OpenViking/index/search cache output.

### Hard quarantine rules

Do not migrate automatically:

- `node_modules/`
- `dist/`
- `.vite/`
- `.firebase/hosting.*.cache`
- `data/viking/default/resources/`
- `temp_openviking/`
- `tmp/` except specific reports explicitly cited in `MIGRATION_LEDGER.md`
- generated snapshots as source of truth:
  - `content/vn/pilot.snapshot.json`
  - `public/content/vn/pilot.snapshot.json`
  - `dist/content/vn/pilot.snapshot.json`
- generated static mirrors unless the generator is migrated and re-run:
  - `src/features/map/data/generated-static-points.ts`
  - `src/features/ai/knowledgeMatrix.generated.ts`
- old prototype folders unless explicitly promoted by ADR.

---

## 2. Target structure for `F:/proje/grenzwanderer5`

Create this target skeleton first:

```text
F:/proje/grenzwanderer5/
├── AGENTS.md
├── CONTEXT.md
├── MIGRATION_LEDGER.md
├── package.json
├── bun.lockb / bun.lock or package-manager lockfile
├── docs/
│   ├── CURRENT_CANON.md
│   ├── CASE01_CANON_IDENTITY.md
│   ├── OBSIDIAN_VN_CONTRACT.md
│   ├── CHARACTER_ROSTER.md
│   ├── CHARACTER_REGISTRY_AUDIT.md
│   ├── JOURNALIST_ORIGIN_BIBLE.md
│   └── adr/
│       ├── README.md
│       └── 0001-freiburg-1900-operational-canon.md
├── data/
│   ├── currentCanon.ts
│   ├── currentCanon.test.ts
│   ├── innerVoiceContract.ts
│   ├── parliamentModules.ts
│   ├── skillDefinitions.ts
│   └── ...minimal runtime registries required by tests
├── scripts/
│   ├── content-authoring-contract.ts
│   ├── extract-vn-content.ts
│   ├── content-case01-canon-report.ts
│   ├── content-character-bridge.ts
│   └── ...minimal scripts required by gates
├── obsidian/
│   ├── StoryDetective/
│   │   └── 40_GameViewer/Case01/
│   └── Detectiv/
│       └── ...design/reference only, reduced
├── src/
│   ├── features/vn/
│   ├── features/character/
│   ├── shared/game/
│   └── ...minimal app shell
├── public/
│   ├── VN/start/journalist/
│   └── images/scenes/bureau-arrival/   # only if needed for current vertical slice
└── tests or colocated *.test.ts
```

Do not create `data/viking`, `dist`, `node_modules`, or `temp_openviking` in the new project.

---

## 3. Phase-by-phase plan

### Phase 1: Freeze the source project before copying

**Objective:** Avoid losing the current dirty canon/code work before extraction.

**Files:** Source repo only: `F:/proje/grenzwanderer/Grenzwanderer`

**Steps:**

1. Run from `F:/proje/grenzwanderer/Grenzwanderer`:

   ```bash
   git status --short > ../grenzwanderer5-source-status-before-migration.txt
   git diff -- docs data scripts src obsidian content public > ../grenzwanderer5-source-diff-before-migration.patch
   ```

2. Review the generated patch paths for accidental secrets before storing or sharing.

3. If the patch is clean, either:
   - create a local WIP commit in the old repo, if Andrey approves commits; or
   - keep the patch as local backup only.

**Do not:** stash blindly. There are many untracked files; careless stashing or cleaning could hide canonical work.

**Verification:**

```bash
test -s ../grenzwanderer5-source-status-before-migration.txt
test -s ../grenzwanderer5-source-diff-before-migration.patch
```

Expected: both commands exit `0`.

---

### Phase 2: Create target repository shell

**Objective:** Establish `F:/proje/grenzwanderer5` as a separate project, not a nested copy.

**Files:**

- Create directory: `F:/proje/grenzwanderer5`
- Create: `F:/proje/grenzwanderer5/MIGRATION_LEDGER.md`
- Create: `F:/proje/grenzwanderer5/AGENTS.md`
- Create: `F:/proje/grenzwanderer5/CONTEXT.md`

**Steps:**

1. Create the directory:

   ```bash
   mkdir -p /f/proje/grenzwanderer5
   cd /f/proje/grenzwanderer5
   git init
   ```

2. Add a minimal `.gitignore` immediately:

   ```gitignore
   node_modules/
   dist/
   .vite/
   .firebase/
   tmp/
   temp_openviking/
   data/viking/
   *.local
   .env
   .env.*
   ```

3. Create `MIGRATION_LEDGER.md` with this initial rule:

   ```md
   # Grenzwanderer5 Migration Ledger

   `grenzwanderer5` is the clean implementation spine for Freiburg 1900 / Case01.
   Old `F:/proje/grenzwanderer/Grenzwanderer` remains archive/quarry.

   A file is authoritative in `grenzwanderer5` only if it is listed here or generated by a listed source command.

   | Old path | New path | Status | Authority | Reason | Verification |
   | -------- | -------- | ------ | --------- | ------ | ------------ |
   ```

4. Create `AGENTS.md` as a short project constitution, not a full lore encyclopedia. It must include:
   - source-of-truth hierarchy;
   - 1900/1905 policy;
   - StoryDetective vs Detectiv split;
   - generated-artifact quarantine;
   - no `grezwanderer3` mechanics in 1900 core;
   - no Edem-wide retcons from project-local ADRs.

**Verification:**

```bash
git status --short
```

Expected: only the new skeleton files appear as untracked.

---

### Phase 3: Migrate canon locks first

**Objective:** Move the decision layer before moving code or scenes.

**Files to copy/rewrite manually with ledger entries:**

| Old path                                           | New path                        | Status  | Authority         | Reason                                                        |
| -------------------------------------------------- | ------------------------------- | ------- | ----------------- | ------------------------------------------------------------- |
| `CONTEXT.md`                                       | `CONTEXT.md`                    | migrate | terminology canon | Prevent Player/Character/Story/Fact/Knowledge/Evidence drift. |
| `docs/CURRENT_CANON.md`                            | `docs/CURRENT_CANON.md`         | migrate | thin canon ledger | Explains machine-ledger authority.                            |
| `data/currentCanon.ts`                             | `data/currentCanon.ts`          | migrate | machine canon     | Runtime-derived parliament/era facts.                         |
| `data/currentCanon.test.ts`                        | `data/currentCanon.test.ts`     | migrate | test guard        | Prevents 24/18/6/8 and 1900/1905 drift.                       |
| `docs/CASE01_CANON_IDENTITY.md`                    | `docs/CASE01_CANON_IDENTITY.md` | migrate | identity canon    | Locks Matthias/Arthur/Lotte/Victoria/Galdermann.              |
| `docs/adr/README.md`                               | `docs/adr/README.md`            | migrate | decision index    | Keeps ADR scope project-local.                                |
| `docs/adr/0001-freiburg-1900-operational-canon.md` | same                            | migrate | accepted ADR      | Locks Freiburg 1900 operational canon.                        |
| `docs/OBSIDIAN_VN_CONTRACT.md`                     | `docs/OBSIDIAN_VN_CONTRACT.md`  | migrate | content authority | Keeps StoryDetective extraction authority.                    |

**Steps:**

1. Copy only these files.
2. For each copied file, add one row to `MIGRATION_LEDGER.md`.
3. Adjust internal links if target paths differ.
4. Do not migrate broad atmosphere/lore docs yet.

**Verification:**

Run in `F:/proje/grenzwanderer5` after dependencies exist:

```bash
bun test data/currentCanon.test.ts
```

Expected: current-canon tests pass. If dependencies are not installed yet, mark this verification as blocked in the ledger rather than pretending it passed.

---

### Phase 4: Build a minimal technical shell

**Objective:** Make `grenzwanderer5` runnable before importing large content.

**Candidate approach:** Start from a minimal Vite React TS shell, then port only required modules from the old app.

**Files likely needed from source:**

- `package.json` — rewrite, do not copy wholesale.
- `tsconfig*.json` — copy only if still valid.
- `vite.config.*` — copy only minimal config.
- `eslint.config.*` / Prettier config — copy only if used by new quality gate.
- `src/main.tsx`, `src/App.tsx`, routing shell — minimize.
- `src/features/vn/**` — only VN runtime components required for Case01 vertical slice.
- `src/features/character/originProfiles.ts` — because Matthias/Arthur identity split is active.
- `src/shared/game/witchRules.ts` — only if Witch prologue/Eleonora mechanics are in the first vertical slice.

**Do not initially port:**

- full map system;
- full AI worker;
- Firebase deployment;
- full SpacetimeDB backend;
- Karlsruhe release profile;
- all smoke scripts;
- all visual asset scaffolding.

**Minimal scripts in new `package.json`:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "test": "vitest run",
    "content:extract": "bun run scripts/extract-vn-content.ts",
    "content:case01:canon:check": "bun run scripts/content-case01-canon-report.ts --check",
    "content:character:bridge:check": "bun run scripts/content-character-bridge.ts --check"
  }
}
```

Only add a script if its implementation is migrated and verified.

**Verification:**

```bash
bun install
bun run test
bun run lint
bun run build
```

Expected: all pass before importing more content.

---

### Phase 5: Migrate Case01 runtime content, not the whole Obsidian vault

**Objective:** Preserve the playable Case01 spine without importing all design duplication.

**Primary authority:** `obsidian/StoryDetective`, not `obsidian/Detectiv`.

**Initial runtime migration candidates:**

- `obsidian/StoryDetective/40_GameViewer/Case01/CASE01_CANON_LEDGER.md`
- `obsidian/StoryDetective/40_GameViewer/Case01/_runtime/case01_bank_investigation/scene_case01_bank_arrival.md`
- `obsidian/StoryDetective/40_GameViewer/Case01/_runtime/case01_bank_investigation/scene_case01_bank_manager.md`
- `obsidian/StoryDetective/40_GameViewer/Case01/Plot/03_Bank/scene_bank_conclusion.md`
- `_scenario.md` files required by `OBSIDIAN_VN_CONTRACT.md`
- directly referenced `_Characters/` and `_Evidence/` files only.

**Design/reference migration candidates:**

- `obsidian/Detectiv/00_Map_Room/qst_victoria_shadow_case.md`
- `obsidian/Detectiv/30_World_Intel/Characters/char_lotte_weber.md`
- `obsidian/Detectiv/30_World_Intel/Families/family_adlersheim_sterling.md`
- `obsidian/Detectiv/30_World_Intel/Characters/char_assistant.md`
- `obsidian/Detectiv/30_World_Intel/Characters/char_inspector.md`

Each Detectiv file must be marked in the ledger as `design/reference`, not runtime authority.

**Steps:**

1. Start with one scene chain: arrival → manager → conclusion.
2. Copy required `_scenario.md` and frontmatter dependencies.
3. Run content extraction.
4. Add missing dependencies only when extraction fails with a concrete missing path/id.
5. Record every promoted file in `MIGRATION_LEDGER.md`.

**Verification:**

```bash
bun run content:extract
bun run content:case01:canon:check
bun run content:character:bridge:check
```

Expected: extraction succeeds; canon check passes; bridge check reports no errors. Warnings may remain only if they are documented in `MIGRATION_LEDGER.md` as transitional debt.

---

### Phase 6: Migrate identity and protagonist support

**Objective:** Keep Matthias and Arthur separated from day one.

**Files likely needed:**

- `src/features/character/originProfiles.ts`
- `scripts/data/vn-packs/pack_journalist_origin.ts` if journalist route remains active.
- `scripts/journalist-origin-wakeup.test.ts`
- `public/VN/start/journalist/` if used by current journalist startup path.
- `docs/JOURNALIST_ORIGIN_BIBLE.md`

**Rules:**

- Matthias Adler remains detective.
- Arthur Vance remains journalist.
- Do not use Arthur to patch old detective scenes.
- If a scene is not yet migrated for Arthur, mark it absent rather than aliasing him into Matthias content.

**Verification:**

```bash
bun test scripts/journalist-origin-wakeup.test.ts
bun run smoke:origin-entry   # only if this smoke script and dependencies are migrated
```

If `smoke:origin-entry` is not migrated, create a smaller test rather than pulling in the entire old smoke framework.

---

### Phase 7: Re-generate artifacts in the new project

**Objective:** Ensure generated files come from new sources, not copied old outputs.

**Do not copy as authoritative source:**

- `content/case-build/case01.build.json`
- `content/vn/pilot.snapshot.json`
- `public/content/vn/pilot.snapshot.json`
- `content/vn/releases.manifest.json`
- `src/features/ai/knowledgeMatrix.generated.ts`
- `src/features/map/data/generated-static-points.ts`

**Steps:**

1. Migrate generators first.
2. Run the generator command in `grenzwanderer5`.
3. Commit generated output only if the new repo policy says generated artifacts are versioned.
4. Add a ledger row marking the output as `generated`, with the command that creates it.

**Verification:**

```bash
bun run content:extract
bun run content:case-build:check   # only after script is migrated
bun run content:drift:verify       # only after script is migrated
```

Expected: generated artifacts match new source content.

---

### Phase 8: Decide what to do with visual assets

**Objective:** Avoid importing a giant asset dump before the first playable slice needs it.

**Current untracked candidates:**

- `public/images/scenes/bureau-arrival/*.webp`
- `public/images/scenes/bureau-arrival/*.meta.json`
- `content/visual-assets/bureau-vn-scenes.visual-brief.md`

**Decision options:**

1. **Minimal:** migrate only the one background needed by the first scene.
2. **Scene-pack:** migrate the full `bureau-arrival` scene pack with its visual brief.
3. **Archive-only:** leave the pack in old project until the VN scene references are stable.

**Recommendation:** choose option 1 unless the immediate goal is visual production.

**Verification:**

```bash
bun run assets:visual:check   # only if the visual asset checker is migrated
bun run build
```

---

### Phase 9: Add OpenViking later, not at project birth

**Objective:** Prevent semantic-index debris from becoming source material.

**Do not migrate:**

- `data/viking/default/resources/`
- `temp_openviking/`
- old `.overview.md` generated index summaries.

**Later migration path:**

1. Migrate OpenViking scripts only:
   - `scripts/openviking/*`
2. Re-index `grenzwanderer5` from clean source.
3. Store generated index output under ignored/cache paths unless there is a strong reason to version it.

**Verification:**

```bash
bun run openviking:index:core
bun run openviking:smoke:case01
```

Only run after the new repo has a stable core.

---

### Phase 10: Establish quality gates

**Objective:** Stop new project rot immediately.

**Minimum release gate for `grenzwanderer5`:**

```bash
bun run test
bun run lint
bun run build
bun run content:case01:canon:check
bun run content:character:bridge:check
```

**Optional later gates:**

- `bun run content:gate:local`
- `bun run smoke:case01-entry`
- `bun run smoke:case01-mainline`
- `bun run smoke:case01-branches`
- `bun run smoke:witch-one-shot`
- SpacetimeDB build/publish checks.

Do not add optional gates until their dependencies are intentionally migrated.

---

## 4. Initial migration ledger seed

When implementation starts, seed `MIGRATION_LEDGER.md` with rows like this:

```md
| Old path                                                                                | New path                                           | Status  | Authority         | Reason                                                         | Verification                          |
| --------------------------------------------------------------------------------------- | -------------------------------------------------- | ------- | ----------------- | -------------------------------------------------------------- | ------------------------------------- |
| `F:/proje/grenzwanderer/Grenzwanderer/CONTEXT.md`                                       | `CONTEXT.md`                                       | migrate | terminology canon | Locks Player/Character/Story/Fact/Knowledge/Evidence language. | Readback + link check.                |
| `F:/proje/grenzwanderer/Grenzwanderer/docs/CASE01_CANON_IDENTITY.md`                    | `docs/CASE01_CANON_IDENTITY.md`                    | migrate | identity canon    | Locks Matthias/Arthur/Lotte/Victoria/Galdermann identities.    | Grep for forbidden alias promotions.  |
| `F:/proje/grenzwanderer/Grenzwanderer/docs/CURRENT_CANON.md`                            | `docs/CURRENT_CANON.md`                            | migrate | thin canon ledger | Human explanation of machine-ledger authority.                 | `bun test data/currentCanon.test.ts`. |
| `F:/proje/grenzwanderer/Grenzwanderer/data/currentCanon.ts`                             | `data/currentCanon.ts`                             | migrate | machine canon     | Derived 24/18/6/8 + 1900 policy.                               | `bun test data/currentCanon.test.ts`. |
| `F:/proje/grenzwanderer/Grenzwanderer/data/currentCanon.test.ts`                        | `data/currentCanon.test.ts`                        | migrate | canon guard       | Prevents parliament and era drift.                             | Test passes.                          |
| `F:/proje/grenzwanderer/Grenzwanderer/docs/adr/0001-freiburg-1900-operational-canon.md` | `docs/adr/0001-freiburg-1900-operational-canon.md` | migrate | accepted ADR      | 1900 operational canon; 1905 legacy until ADR.                 | ADR index links.                      |
| `F:/proje/grenzwanderer/Grenzwanderer/docs/OBSIDIAN_VN_CONTRACT.md`                     | `docs/OBSIDIAN_VN_CONTRACT.md`                     | migrate | content authority | StoryDetective runtime vs Detectiv design split.               | Extraction roots match scripts.       |
```

---

## 5. Conflict and drift checks to run during migration

### Identity grep checks

Run after migrating docs/scenes:

```bash
grep -R "Arthur Vance" docs obsidian src data scripts || true
grep -R "Lotte Fischer\|operator" docs obsidian src data scripts || true
grep -R "Clara Altenburg\|Clara von Altenburg\|Клара" docs obsidian src data scripts || true
grep -R "1905" docs obsidian src data scripts content public || true
```

Interpretation:

- Hits are not automatically errors.
- Each hit must be classified as canonical, legacy alias, design/reference, localization, or drift.
- Runtime scenes must not promote deprecated aliases unless an ADR says so.

### StoryDetective authority check

Confirm migrated extractor paths still point to StoryDetective:

```bash
grep -R "obsidian/StoryDetective" scripts docs src data || true
grep -R "obsidian/Detectiv" scripts docs src data || true
```

Expected:

- StoryDetective appears in extraction/runtime scripts.
- Detectiv appears only in design/reference/audit contexts unless explicitly intentional.

---

## 6. Recommended first playable vertical slice

Do not try to migrate the whole game. First target:

1. App boots.
2. Player can start as Matthias Adler.
3. One Case01 scene chain renders:
   - arrival or bureau entry;
   - bank manager interaction;
   - one evidence acquisition;
   - one choice with skill/check information;
   - one Inner Parliament motive hint (`supports` / `opposes`) if the code already supports it.
4. Canon checks pass.
5. Build passes.

Only after this slice works should the project expand to:

- Arthur Vance journalist opening;
- Victoria/Lotte shadow case;
- map layer;
- Witch prologue;
- SpacetimeDB/live backend;
- AI worker;
- OpenViking reindex.

---

## 7. Risks and mitigations

### Risk: `grenzwanderer5` becomes another dumping ground

**Mitigation:** every migrated file requires a `MIGRATION_LEDGER.md` row and authority label.

### Risk: untracked old files are lost

**Mitigation:** Phase 1 patch/status backup before any copy/clean operation.

### Risk: generated snapshots are mistaken for canon

**Mitigation:** migrate generators, not generated outputs; regenerate inside target.

### Risk: Detectiv design notes override StoryDetective runtime

**Mitigation:** AGENTS.md and ledger mark Detectiv as `design/reference` unless promoted.

### Risk: 1905 returns through visual briefs or old labels

**Mitigation:** grep `1905`; classify every hit; only ADR can promote it.

### Risk: Arthur Vance contaminates detective scenes again

**Mitigation:** `CASE01_CANON_IDENTITY.md` and tests/greps enforce Arthur as journalist origin only.

### Risk: too much backend/tooling is migrated too early

**Mitigation:** defer SpacetimeDB/Firebase/OpenViking/AI worker until the VN/content slice is stable.

---

## 8. Open decisions for Andrey

1. Should `grenzwanderer5` be a new independent git repo or a branch/worktree from the old repo?
   - Recommendation: independent repo at `F:/proje/grenzwanderer5`.
2. Should the old dirty state be committed before migration?
   - Recommendation: make a local WIP commit or at least save a patch before copying.
3. Should `grenzwanderer5` initially support only Matthias, or Matthias + Arthur?
   - Recommendation: Matthias first; Arthur second, but migrate Arthur canon locks immediately.
4. Should visual bureau assets be part of the first slice?
   - Recommendation: one required background only, not full pack.
5. Should SpacetimeDB remain in v5 from day one?
   - Recommendation: no, unless the first playable loop requires live backend behavior.

---

## 9. Suggested execution order summary

1. Backup old dirty state.
2. Create `F:/proje/grenzwanderer5` skeleton.
3. Add `.gitignore`, `AGENTS.md`, `MIGRATION_LEDGER.md`, `CONTEXT.md`.
4. Migrate canon locks and ADRs.
5. Migrate `currentCanon` machine-ledger and tests.
6. Create minimal Vite/React/TS shell.
7. Migrate only required VN runtime modules.
8. Migrate one Case01 scene chain from StoryDetective.
9. Re-run extraction to generate snapshots inside v5.
10. Add only necessary assets.
11. Run minimum quality gate.
12. Commit v5 baseline.
13. Only then expand toward Arthur, Victoria/Lotte, map, Witch, backend, OpenViking.

---

## 10. Stop condition for the first migration milestone

The first milestone is complete only when this is true inside `F:/proje/grenzwanderer5`:

```bash
bun run test
bun run lint
bun run build
bun run content:case01:canon:check
```

And:

- `MIGRATION_LEDGER.md` lists every authoritative migrated file.
- `AGENTS.md` states source-of-truth hierarchy and quarantine rules.
- No copied `node_modules`, `dist`, `data/viking`, or `temp_openviking` exist.
- The app has one playable/renderable Case01 path or a documented blocker.
- Every remaining `1905`, Arthur-as-detective, Lotte-Fischer/operator, and Clara/Victoria hit is classified.
