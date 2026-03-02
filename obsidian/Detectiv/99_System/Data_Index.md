---
id: system_data_index
tags:
  - type/index
  - type/dashboard
  - status/active
---

# Data Index

Operational index for design and runtime synchronization.

## System Contracts

- [[99_System/API_Engine_Contract|API Engine Contract]]
- [[99_System/Runtime_Orchestrator_v2|Runtime Orchestrator v2]]
- [[99_System/MOC_Engines|MOC Engines]]
- [[99_System/Source_of_Truth|Source of Truth]]
- [[99_System/Narrative_Gameplay_Protocol|Narrative Gameplay Protocol]]
- [[20_Game_Design/Voices/MOC_Parliament|MOC Parliament]]
- [[20_Game_Design/Voices/MOC_Voice_Matrix|MOC Voice Matrix]]

## Active Investigations (Quests)

```dataview
TABLE status, priority
FROM "10_Narrative/Quests"
WHERE status != "Complete"
SORT priority DESC
```

## Story Nodes Missing Validation

```dataview
TABLE file.link AS Node, validation_status
FROM "10_Narrative"
WHERE startswith(file.name, "node_") AND !validation_status
SORT file.name ASC
```

## Voice Notes by Department

```dataview
TABLE department, voice_id
FROM "20_Game_Design/Voices"
WHERE startswith(file.name, "Voice_")
SORT department ASC, voice_id ASC
```

## Runtime Notes Recently Updated

```dataview
TABLE file.mtime AS Updated
FROM "99_System"
WHERE contains(file.name, "Runtime") OR contains(file.name, "Contract") OR contains(file.name, "Protocol")
SORT file.mtime DESC
```

## Maintenance Rule

- Keep this index linked from critical hubs.
- Add new runtime notes here in the same cycle they are created.
