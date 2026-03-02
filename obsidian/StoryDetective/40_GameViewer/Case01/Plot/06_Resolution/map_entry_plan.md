---
id: map_entry_plan
aliases:
  - Map: Entry Plan
tags:
  - type/map_hub
  - layer/map
  - case/case01
  - phase/resolution
---

# 🗺️ Map: Entry Plan

## Trigger

После [[40_GameViewer/Case01/Plot/05_Convergence/scene_rathaus_hearing|Rathaus Hearing]] или [[40_GameViewer/Case01/Plot/05_Convergence/scene_workers_backchannel|Workers Backchannel]]

## Available Points

| Point ID                             | Label        | → VN Scene                                                                         | Gate                      |
| ------------------------------------ | ------------ | ---------------------------------------------------------------------------------- | ------------------------- |
| `loc_freiburg_archive`               | 📚 Архив     | [[40_GameViewer/Case01/Plot/06_Resolution/scene_archive_warrant_run\|Archive]]     | `warrant_ready=true`      |
| `loc_hbf` → `loc_freiburg_warehouse` | 🚃 Rail Yard | [[40_GameViewer/Case01/Plot/06_Resolution/scene_rail_yard_shadow_tail\|Rail Yard]] | `covert_entry_ready=true` |

## Gate Rules

- Archive requires official path
- Rail Yard requires covert path
- Both lead to Warehouse Finale
