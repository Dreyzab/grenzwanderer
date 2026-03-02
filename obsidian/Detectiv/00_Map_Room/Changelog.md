---
id: map_room_changelog
tags:
  - type/changelog
  - domain/project
---

# Changelog (Obsidian)

Source mirror: `update.md`

## 2026-02-07 - Phase 3 Kickoff (Persistence Slices)

### Feature

- Added server snapshot modules for inventory, quests, dossier.
- Added client hydration/sync pipelines for these slices.
- Added migrations `0004`, `0005`, `0006`.

### Fix

- Normalized snapshot payload handling and startup hydration order.

### Refactor

- API client typed expansion and store-level sync architecture updates.

### Content

- Linked systems notes: [[20_Game_Design/Systems/Inventory_Merchant|Inventory_Merchant]], [[99_System/API_Engine_Contract|API_Engine_Contract]].

## 2026-02-07 - Localization and Narrative Governance

### Feature

- `react-i18next` migration with EN/DE/RU namespaces.
- Narrative + gameplay protocol/checklist formalized.

### Refactor

- VN/UI text moved to namespace keys and language switcher integration.

### Content

- Related notes: [[99_System/Narrative_Gameplay_Protocol|Narrative_Gameplay_Protocol]], [[99_System/Narrative_Gameplay_Checklist|Narrative_Gameplay_Checklist]].

## 2026-02-07 - Engine Foundation

### Feature

- Engine endpoints for world snapshot, time tick, travel, case advance, progression apply, evidence discover.

### Fix

- Case gating soft-fail alternatives for night bank access.

### Refactor

- Shared DTO contract extraction in `packages/shared/lib/detective_engine_types.ts`.

### Content

- Related notes: [[99_System/API_Engine_Contract|API_Engine_Contract]], [[00_Map_Room/Tech_Supabase_Schema|Tech_Supabase_Schema]].

## 2026-02-06 - Test Debt Closure (Map Integration)

### Fix

- Closed outdated map test blockers and aligned integration coverage.

### Refactor

- Stabilized map resolver contract usage across modules.

## 2026-01-26 to 2026-02-05 - Core Detective Stack Buildout

### Feature

- Parliament, battle, notebook, quest framework, map v2, localization 2.0.

### Content

- See linked MOCs: [[20_Game_Design/Voices/MOC_Parliament|MOC_Parliament]], [[00_Map_Room/MOC_Quests|MOC_Quests]], [[00_Map_Room/MOC_Characters|MOC_Characters]].
