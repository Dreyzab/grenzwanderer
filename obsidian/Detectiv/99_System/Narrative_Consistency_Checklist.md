---
id: narrative_consistency_checklist
tags:
  - type/checklist
  - status/stable
---

# Narrative Consistency Checklist

Use before implementation.

## Graph integrity

- [ ] Every `scene_*` links to one `time_*`.
- [ ] Every `scene_*` links to one `loc_*`.
- [ ] Every `scene_*` links to at least one `evt_*`.
- [ ] Every `scene_*` links to at least one `char_*`.
- [ ] Every `evt_*` has `caused_by` or is marked as root.
- [ ] Every `evt_*` has `leads_to` or is marked as terminal.

## Quest integrity

- [ ] Every `qst_*` has `start_event` and `end_event`.
- [ ] Quest critical path scenes exist.
- [ ] Quest blockers are explicit (`requires_flags`).

## Gameplay integrity

- [ ] Each scene has explicit state impact (`sets_flags` / `gives_evidence` / `next_scenes`).
- [ ] Evidence has a clear origin scene/event.
- [ ] No mandatory branch ends without recovery path.

## Production integrity

- [ ] IDs follow naming convention (`scn/scene/evt/time/loc/qst/char`).
- [ ] Legacy names are in `aliases`.
- [ ] Code anchors are added for affected systems.
