---
id: color_scheme
tags:
  - type/system
  - domain/design
---

# Color Scheme v1 — Noir Detective Palette

## Node Type Colors

| Type        | Name      | Hex       | CSS Class     | Usage               |
| ----------- | --------- | --------- | ------------- | ------------------- |
| VN Scene    | Ink Grey  | `#2D3748` | `.node-vn`    | Диалоги, VN сцены   |
| Map Hub     | Deep Blue | `#1E40AF` | `.node-map`   | Map decision points |
| Character   | Sepia     | `#92400E` | `.node-char`  | Персонажи           |
| Evidence    | Amber     | `#B45309` | `.node-ev`    | Улики, предметы     |
| Location    | Olive     | `#365314` | `.node-loc`   | Локации             |
| Conditional | Crimson   | `#7F1D1D` | `.node-cond`  | Условные триггеры   |
| Start       | Green     | `#15803D` | `.node-start` | Точки входа         |
| End         | Forest    | `#166534` | `.node-end`   | Точки выхода        |

## Mermaid Palette

```css
classDef vn fill:#2D3748,stroke:#e2e8f0,color:#e2e8f0
classDef map fill:#1E40AF,stroke:#bee3f8,color:#fff
classDef char fill:#92400E,stroke:#fcd34d,color:#fff
classDef ev fill:#B45309,stroke:#fcd34d,color:#fff
classDef loc fill:#365314,stroke:#86efac,color:#fff
classDef cond fill:#7F1D1D,stroke:#fca5a5,color:#fff
classDef start fill:#15803D,stroke:#86efac,color:#fff
classDef end fill:#166534,stroke:#86efac,color:#fff
```

## Graph View CSS Snippet

```css
/* .obsidian/snippets/story-detective-colors.css */
.graph-view.color-fill-tag[data-tag="type/vn_scene"] {
  color: #2d3748;
}
.graph-view.color-fill-tag[data-tag="type/map_hub"] {
  color: #1e40af;
}
.graph-view.color-fill-tag[data-tag="type/character"] {
  color: #92400e;
}
.graph-view.color-fill-tag[data-tag="type/evidence"] {
  color: #b45309;
}
.graph-view.color-fill-tag[data-tag="type/location"] {
  color: #365314;
}
.graph-view.color-fill-tag[data-tag="type/conditional"] {
  color: #7f1d1d;
}
```

## Usage Notes

- Use `classDef` в Mermaid для визуализации
- Tag files для Graph View coloring
- Избегаем пурпурных/фиолетовых оттенков (Purple Ban)
