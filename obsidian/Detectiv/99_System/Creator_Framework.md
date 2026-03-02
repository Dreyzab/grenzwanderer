---
id: creator_framework
tags:
  - type/policy
  - status/stable
---

# Creator Framework

Obsidian in this project is a thinking workspace for the creator, not a passive documentation dump.

## Core role

- Use notes to think, decide, and design.
- Keep each note actionable: every note should move a decision, scenario, or system forward.
- Prefer clear intent over verbose text.

## Working loop

1. Capture intent: what are we trying to achieve?
2. Form a hypothesis: what should happen and why?
3. Define constraints: narrative, system, tech, production limits.
4. Make decision: what option we choose now.
5. Link to code anchors: files, ids, migrations, tests.
6. Record next step: what to do immediately after this note.

## Narrative Graph Method

Use narrative as a linked graph, not a linear document.

Core node types:

- `time_*`: time slot
- `loc_*`: location
- `evt_*`: world event
- `scene_*`: playable scene
- `char_*`: character
- `qst_*`: quest arc
- `evi_*`: evidence
- `flag_*`: world state

Minimum scene contract:

- exactly one `time_*`
- exactly one `loc_*`
- at least one `evt_*`
- at least one `char_*`
- explicit state change (`sets_flags` or `gives_evidence` or `next_scenes`)

## Spatial identity rule (for scalable writing)

- `loc_*` is the stable world anchor (bank, city hall, pharmacy). It should almost never be renamed.
- `map_point` is a presentation/interaction node and may change with UI or pacing.
- Scene links and objective links should target `loc_*` first, then attach to specific points/actions.
- This keeps scenario logic stable even when map content is rearranged.

## Fog of war writing rule

- Track discovery on `location` level: `unknown -> visible -> explored -> resolved`.
- Keep it separate from scene completion and quest completion.
- Allowed reveal sources: travel, evidence, NPC hint, faction unlock.
- Reference: [[Sys_FogOfWar]].

## Note quality rules

- One note = one thinking unit (scene, character, system, decision, issue).
- Always include canonical `id` and status tag.
- Store old names in frontmatter `aliases`, never in separate mapping notes.
- If a note has no next action, it is incomplete.
- If code and note diverge, resolve by `Source_of_Truth` policy.

## Decision hygiene

- Distinguish clearly:
- `Intent`: what we want.
- `Implementation`: what code currently does.
- `Gap`: what must be changed.
- Track uncertainty explicitly as open questions.

## Minimum block for every working note

- Goal
- Decision
- Constraints
- Open Questions
- Next Action
