# VN Scene Format

Canonical runtime scenes live next to `_scenario.md` and are the source of truth
for VN graph logic.

## Files

- `_scenario.md` stores scenario metadata and `scene_order`.
- `scene_id.md` is the canonical scene file with runtime logic.
- `scene_id.<locale>.md` stores localized `title/body` only.

## Canonical Scene Contract

- Frontmatter must include `id`, `type: vn_scene`, `status`.
- Scene text lives under `## Script`.
- Runtime logic lives in a fenced `vn-logic` block.
- `next` and `choices` stay inside the scene file. Do not centralize scene
  logic in a shared `_vn-logic.md`.

## Locale Contract

- Locale files must keep the same `id`.
- Locale files may contain `# Title` and `## Script`.
- Locale files must not define `vn-logic`, choices, effects, or runtime-only
  frontmatter.

## Example

```md
---
id: scene_example_intro
type: vn_scene
status: active
---

# Scene: Example Intro

## Script

An inspector arrives before sunrise.

```vn-logic
choices:
  - id: EXAMPLE_CONTINUE
    text: Continue
    next: scene_example_next
```
```
