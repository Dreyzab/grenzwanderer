---
id: action_investigate_station
type: vn_action
phase: onboarding
status: active
tags:
  - type/vn_action
  - layer/vn
  - case/case01
---

# Action: Investigate Station

## Narrative

You delay contact with Fritz and test the platform for weak points. A paperboy
passes too close, and the station reveals three immediate options.

## Choices

1. Buy the newspaper.
   - Sets `flag_bought_newspaper` = true
   - Next: [[scene_meet_fritz_indirect]]
2. Glance at the headline without paying.
   - Sets `flag_paperboy_encounter` = true
   - Next: [[scene_paperboy_theft]]
3. Move on and skip the kiosk.
   - Next: [[scene_meet_fritz_indirect]]
