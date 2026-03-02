---
id: mechanics_rollout_case01
aliases:
  - Mechanics Rollout Case 01
  - Case 01 Progressive Mechanics Plan
tags:
  - type/plan
  - domain/game_design
  - domain/narrative
  - status/active
---

# Mechanics Rollout: Case 01 (Progressive Introduction)

## Purpose

Practical rollout plan for next production slices after the current state:

- done: opening, bank, three leads;
- skeletons: archive, warehouse, finale;
- side quests available: Victoria, Lotte, Inspector;
- core systems already available: VN, skill checks (18 voices), dossier/evidence flags, quest stages.

## Options (A-D)

### Option A: Archive Investigation + Lotte Interlude

- Scope:
  - archive scene expansion (`03_archive`);
  - Lotte phone interlude as surveillance warning;
  - companion role formalization: Lotte as active informant.
- Voices focus:
  - `encyclopedia`, `perception`, `tradition`.
- Pros:
  - natural continuation after leads;
  - reinforces clue-to-record loop;
  - introduces companion utility without overloading systems.
- Risks:
  - archive can feel static without interaction density;
  - needs archive background polish.
- Effort:
  - medium.

### Option B: Poetry Duel (Victoria) as Dialogue Mini-Game

- Scope:
  - side quest `quest_victoria_poetry`;
  - duel scoring loop over chained skill checks.
- Voices focus:
  - `charisma`, `encyclopedia`, `empathy`.
- Pros:
  - introduces reusable social duel layer;
  - deepens companion characterization.
- Risks:
  - can distract from main-case momentum if scheduled too early;
  - balancing cost is non-trivial.
- Effort:
  - medium-high.

### Option C: Warehouse Confrontation + Battle System

- Scope:
  - move directly into warehouse/finale pressure;
  - formal battle onboarding via existing battle route.
- Pros:
  - strong dramatic payoff;
  - unlocks combat pipeline for future cases.
- Risks:
  - skips archive maturation;
  - too large jump in system complexity for current pacing.
- Effort:
  - high.

### Option D: Map Events + Random Encounters

- Scope:
  - map travel events and witness micro-encounters;
  - small checks while moving between points.
- Voices focus:
  - `stealth`, `perception` (+ optional social checks).
- Pros:
  - stronger immersion and replayability;
  - low-medium effort with clear world texture gains.
- Risks:
  - can become padding if not tied to progression flags.
- Effort:
  - low-medium.

## Recommended Rollout (Gradual)

1. Option A (mainline reliability first)
2. Option D (light systemic enrichment during travel)
3. Option B (contained mini-game once pacing is stable)
4. Option C (battle pressure as capstone, not midpoint)

Rationale:

- preserves case momentum;
- introduces mechanics in low-risk layers first;
- delays high-cost battle integration until clue/map loops are mature.

## Sprintable Slices

### Slice 1: A (Archive + Lotte)

- Status:
  - implemented in runtime as current progression slice.
- Deliverables:
  - expanded archive node content and checks;
  - Lotte interlude trigger and follow-up flags;
  - hook into forward arc nodes:
    - [[10_Narrative/Scenes/node_case1_archive_warrant_run|Node: Case 1 Archive Warrant Run]]
    - [[10_Narrative/Scenes/node_case1_lotte_interlude_warning|Node: Case 1 Lotte Interlude Warning]]
- Exit criteria:
  - archive path sets actionable warehouse prep flags;
  - Lotte interlude introduces surveillance pressure without dead-end.
- Runtime anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/03_archive/case1_archive.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/03_archive/case1_archive.en.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/side_quests/lotte_wires/interlude_lotte.logic.ts`
  - `apps/server/src/scripts/data/case_01_points.ts`

### Slice 2: D (Map Events)

- Deliverables:
  - 2-3 deterministic event templates bound to travel;
  - one witness event that modifies lead confidence flags.
- Exit criteria:
  - events produce at least one usable clue or pressure token;
  - no event blocks critical path.

### Slice 3: B (Poetry Duel)

- Deliverables:
  - duel scoring contract for side quest;
  - tuning table for three difficulty tiers.
- Exit criteria:
  - duel has fail-forward outcomes;
  - side quest gives companion progression, not mandatory mainline gate.

### Slice 4: C (Warehouse + Battle)

- Deliverables:
  - battle onboarding inside warehouse branch;
  - lawful/covert entry state affects battle opener.
- Exit criteria:
  - battle loss still resolves via soft-fail route;
  - case resolution always reachable.

## Quality Gates

- Follow: [[99_System/Narrative_Gameplay_Protocol|Narrative Gameplay Protocol]]
- Validate: [[99_System/Narrative_Gameplay_Checklist|Narrative Gameplay Checklist]]
- Track chain: [[00_Map_Room/Gameplay_Story_Board|Gameplay Story Board]]
- Graph context: [[00_Map_Room/Story_Graph_Case01_Forward_Arc|Story Graph Case 01 Forward Arc]]
