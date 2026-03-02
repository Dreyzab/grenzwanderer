# Game Design

Hybrid structure for design docs in Obsidian:

- Option C as the main navigation axis (thematic handbook).
- Option A as the cross-cutting analysis axis (game loops).

## Main entry points

- `[[20_Game_Design/MOC_Game_Design|MOC_Game_Design]]` - central hub for all game design docs.
- `[[90_Game_Loops/MOC_Game_Loops|MOC Game Loops]]` - loop-first balancing view.

## Detective's Handbook (primary axis)

- `01_Mind/` - skills, Mind Palace, sanity, progression.
- `02_Investigation/` - clues, deduction, evidence flow.
- `03_Interaction/` - dialogue, conflict, economy/trade.
- `04_World/` - map, time, random events, world state.

## Existing source folders (kept as-is)

- `Systems/` - implementation-oriented system intent notes.
- `Voices/` - Inner Parliament catalog and voice cards.
- `Balance/` - formulas, tables, progression curves.
- `UI_UX/` - UI requirements and references.

## Working rule

For each new mechanic note:

- assign a primary handbook domain (`01..04`);
- link at least one loop in `90_Game_Loops`;
- add code anchors if implementation already exists.
- if runtime behavior changes, sync [[99_System/Runtime_Orchestrator_v2|Runtime Orchestrator v2]] and [[99_System/API_Engine_Contract|API Engine Contract]] in the same cycle.
