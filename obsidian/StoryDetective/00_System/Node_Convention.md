---
id: node_convention
tags:
  - type/system
  - domain/design
---

# Node Convention v1

## Frontmatter Schema

```yaml
---
id: [prefix]_[name]           # уникальный ID
node_type: vn_scene | map_hub | character | evidence | location | conditional
phase: onboarding | briefing | bank | leads | convergence | resolution
case: case01 | case02 | ...
status: draft | active | archived
---
```

## ID Prefixes

| Prefix  | Type        | Example                 |
| ------- | ----------- | ----------------------- |
| `node_` | VN Scene    | `node_hbf_arrival`      |
| `hub_`  | Map Hub     | `hub_first_choice`      |
| `char_` | Character   | `char_fritz_muller`     |
| `ev_`   | Evidence    | `ev_hartmann_newspaper` |
| `loc_`  | Location    | `loc_freiburg_bank`     |
| `cond_` | Conditional | `cond_leads_2of3`       |

## File Naming

```
[prefix]_[descriptive_name].md

Examples:
- node_hbf_arrival.md
- hub_lead_selection.md
- char_clara_altenburg.md
- ev_chemical_sender.md
```

## Folder Structure

```
Case01/
├── Plot/             ← narrative flow
│   ├── 01_Onboarding/
│   ├── 02_Briefing/
│   ├── 03_Bank/
│   ├── 04_Leads/
│   ├── 05_Convergence/
│   └── 06_Resolution/
├── _Characters/      ← entity index (char_*.md)
├── _Evidence/        ← entity index (ev_*.md)
├── _Locations/       ← entity index (loc_*.md)
└── MOC_Flow.md       ← master graph
```

## Linking Rules

1. **VN → Map**: сцена всегда ведёт к Map Hub
2. **Map → VN**: Map Hub содержит таблицу `Point → Scene`
3. **Entities**: линкуются из сцен, хранятся в `_*` папках
4. **Cross-case**: используйте полный путь `[[Case02/_Characters/char_xxx]]`
