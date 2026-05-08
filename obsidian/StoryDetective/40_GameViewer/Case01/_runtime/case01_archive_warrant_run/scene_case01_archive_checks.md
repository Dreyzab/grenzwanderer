---
id: scene_case01_archive_checks
type: vn_scene
status: active
background_url: /images/scenes/case01/bg_case01_archive_ledger_table.webp
---

# Fail-Forward Records

## Script

Three ledgers later, the archive gives way. The warehouse is no longer rumor. It
is an address, a delivery window, and a signature chain pointing back to
Galdermann's side of the case.

```vn-logic
choices:
  - id: CASE01_ARCHIVE_LOCK
    text: Lock the warrant package and move on the warehouse.
    next: scene_case01_archive_exit
```
