---
id: gameviewer_moc
aliases:
  - GameViewer MOC
  - VN Scene Graph MOC
tags:
  - type/moc
  - perspective/gameviewer
  - status/active
---

# GameViewer Perspective

## Purpose

Папка для Visual Novel-ориентированного графа: сцены, переходы, персонажи и улики с точки зрения игрока.

## Architecture

```
VN Scene → Map Hub → VN Scene (next)
```

## Case Graphs

- [[40_GameViewer/Case01/Case01_Flow.canvas|Case 01: Flow Graph (Canvas)]]
- [[40_GameViewer/Sandbox_KA/Sandbox_KA_Flow|Karlsruhe Sandbox: Flow & Code Map]]

## Templates

- [[99_System/Templates/Template_GameViewer_Scene|Scene Entry Template]]
- [[99_System/Templates/Template_Evidence|Evidence Template]]

## Rules

1. Каждая VN Scene ведёт к Map Hub
2. Map Hub содержит доступные точки карты
3. Клик по точке триггерит следующую VN Scene
4. Персонажи и улики линкуются из `30_World_Intel/`
