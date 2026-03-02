---
id: moc_characters
tags:
  - type/moc
  - domain/world
---

# MOC Characters

## Priority Major

- [[30_World_Intel/Characters/char_inspector|char_inspector]]
- [[30_World_Intel/Characters/char_gendarm|char_gendarm]]
- [[30_World_Intel/Characters/char_bank_manager|char_bank_manager]]
- [[30_World_Intel/Characters/char_journalist|char_journalist]]
- [[30_World_Intel/Characters/char_academic|char_academic]]
- [[30_World_Intel/Characters/char_noble|char_noble]]
- [[30_World_Intel/Characters/char_pawnbroker|char_pawnbroker]]
- [[30_World_Intel/Characters/char_apothecary|char_apothecary]]
- [[30_World_Intel/Characters/char_tailor_master|char_tailor_master]]
- [[30_World_Intel/Characters/char_pub_owner|char_pub_owner]]

## Priority Functional

- [[30_World_Intel/Characters/char_bank_teller|char_bank_teller]]
- [[30_World_Intel/Characters/char_archive_keeper|char_archive_keeper]]
- [[30_World_Intel/Characters/char_warehouse_guard|char_warehouse_guard]]
- [[30_World_Intel/Characters/char_dock_worker|char_dock_worker]]
- [[30_World_Intel/Characters/char_student_leader|char_student_leader]]
- [[30_World_Intel/Characters/char_fortune_teller|char_fortune_teller]]

## Runtime Coverage Stubs

- [[30_World_Intel/Characters/char_butler|char_butler]]
- [[30_World_Intel/Characters/char_client|char_client]]
- [[30_World_Intel/Characters/char_faction_underground|char_faction_underground]]
- [[30_World_Intel/Characters/char_gardener|char_gardener]]
- [[30_World_Intel/Characters/char_narrator|char_narrator]]
- [[30_World_Intel/Characters/char_neighbor|char_neighbor]]
- [[30_World_Intel/Characters/char_official|char_official]]
- [[30_World_Intel/Characters/char_paperboy|char_paperboy]]
- [[30_World_Intel/Characters/char_partner|char_partner]]

## Runtime Canonical Set

```dataview
TABLE without id
  runtime_character_id as "RuntimeId",
  tier as "Tier",
  file.link as "Note"
FROM "30_World_Intel/Characters"
SORT runtime_character_id ASC
```
