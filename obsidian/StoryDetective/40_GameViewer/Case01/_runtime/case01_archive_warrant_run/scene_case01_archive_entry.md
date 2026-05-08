---
id: scene_case01_archive_entry
type: vn_scene
status: active
character_id: npc_archivist_otto
---

# Archive Warrant Run

## Script

The archive keeper does not resist the warrant. He resists the pace. Every
registry you ask for creates another way to lose the night, unless you can chain
the documents together faster than the bank can move its own answer into the
file.

```vn-logic
choices:
  - id: CASE01_ARCHIVE_SORT
    text: Chain the warrants and force the archive to answer as one system.
    next: scene_case01_archive_checks
    skill_check:
      id: check_case01_archive_logic
      voice_id: attr_logic
      difficulty: 11
      show_chance_percent: true
      on_success:
        next: scene_case01_archive_checks
        effects:
          - grant_xp(10)
      on_fail:
        next: scene_case01_archive_checks
        effects:
          - add_tension(1)
```
