---
id: moc_voice_matrix
tags:
  - type/moc
  - domain/game_design
  - domain/narrative
  - status/active
aliases:
  - Voice Matrix
---

# MOC Voice Matrix

## Purpose

Operational cross-link matrix for Case 01: voice profiles, node hooks, and character hooks.

## Voice -> case01_node_hooks

```dataview
TABLE without id
  file.link as "Voice",
  case01_node_hooks as "Nodes"
FROM "20_Game_Design/Voices"
WHERE startswith(file.name, "Voice_")
SORT voice_id ASC
```

## Voice -> case01_character_hooks

```dataview
TABLE without id
  file.link as "Voice",
  case01_character_hooks as "Characters"
FROM "20_Game_Design/Voices"
WHERE startswith(file.name, "Voice_")
SORT voice_id ASC
```

## Contract

- `case01_node_hooks` values must reference real `node_*.md` files in `10_Narrative/Scenes`.
- `case01_character_hooks` values must reference canonical `char_*.md` notes in `30_World_Intel/Characters`.
- Profile fields stay in sync with runtime export via `apps/server/src/scripts/obsidian-sync.ts`.
