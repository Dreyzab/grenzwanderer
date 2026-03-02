---
id: legacy_id_audit
tags:
  - type/audit
  - status/developing
---

# Legacy ID Audit

This note tracks `scenarioId` values that exist in map seed data but are not found in current VN logic files.

## Missing in VN logic (from `apps/server/src/scripts/data/case_01_points.ts`)

- `detective_case1_archive_search`
- `detective_case1_bank_hidden_clue`
- `detective_case1_blood_analysis`
- `detective_case1_corps_interview`
- `detective_case1_pub_gossip`
- `detective_case1_socialist_talk`

## Additional missing IDs (from `supabase_seed.sql`)

- `detective_case1_briefing`
- `detective_case1_pub_rumors`
- `detective_case1_warehouse_finale`
- `detective_skirmish`
- `intro_arrival`

## Migration plan

- Decide canonical `scn_*` IDs.
- Add frontmatter aliases in scenario notes for legacy IDs.
- Update map seed and event codes to canonical IDs.
