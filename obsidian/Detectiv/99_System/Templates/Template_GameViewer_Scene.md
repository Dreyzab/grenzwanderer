---
id: template_gameviewer_scene
tags:
  - type/template
  - domain/narrative
---

# Template: GameViewer Scene Entry

Use this template to add new scenes to [[00_Map_Room/GameViewer_Case01_Scenes|GameViewer Perspective]].

## Format

```markdown
#### Scene: [Scene Title]

- **VN Node**: [[10_Narrative/Scenes/node_xxx|node_xxx]]
- **Characters**:
  - [[30_World_Intel/Characters/char_xxx|Character Name]]
- **Evidence**:
  - [[30_World_Intel/Items/clue_xxx|clue_xxx]] (условие получения)
- **→ Map Hub**: [[#Map: Hub Name]]
```

## Fields

| Field          | Description                                  |
| -------------- | -------------------------------------------- |
| **VN Node**    | Ссылка на node-файл в `10_Narrative/Scenes/` |
| **Characters** | Персонажи, присутствующие в сцене            |
| **Evidence**   | Улики/предметы, доступные в сцене            |
| **→ Map Hub**  | Следующий Map decision point                 |

## Map Hub Format

```markdown
#### Map: [Hub Name]

- **Layer**: `/map`
- **Trigger**: after [node_xxx]
- **Available Points**:
  | Point | Label | VN Trigger |
  |-------|-------|------------|
  | `loc_xxx` | Название | `node_xxx` |
```

## Rules

1. VN → Map → VN: каждая VN сцена ведёт к Map Hub
2. Map Hub показывает доступные точки и триггеры
3. Улики линкуются на файлы в `30_World_Intel/Items/`
4. Персонажи линкуются на файлы в `30_World_Intel/Characters/`
