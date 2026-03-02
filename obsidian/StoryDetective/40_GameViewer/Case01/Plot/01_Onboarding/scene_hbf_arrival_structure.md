---
id: scene_hbf_arrival_structure
parent: scene_hbf_arrival
type: vn_structure
status: draft
tags:
  - type/vn_structure
  - case/case01
  - phase/onboarding
---

# HBF Arrival Structure (Two Bridges)

## Goal

Remove the Officer Encounter inconsistency by splitting the first Fritz contact into two explicit bridges that merge into one mission briefing.

## Canonical Flow

1. `beat1_atmosphere`: train arrives at HBF.
2. `beat1_spot_fritz`: player notices the officer group.
3. Passive check: `Perception (DC 7)`.
   Success: early recognition of Fritz.
   Failure: the player must identify him through action.
4. Choice:

- A) `Walk to him` -> [[scene_hbf_arrival_ch1]]
- B) `Look around` -> [[scene_hbf_arrival_ch2]]

## Branch A (Direct)

1. [[scene_hbf_arrival_ch1]] -> [[scene_meet_fritz_direct]]
2. Fritz steps forward and introduces himself as Schutzmann Fritz Muller.
3. Merge -> [[choice_set_priority]]

## Branch B (Indirect)

1. [[scene_hbf_arrival_ch2]] -> [[action_investigate_station]]
2. Paperboy interaction:

- `Buy newspaper` -> continue station pass -> [[scene_meet_fritz_indirect]]
- `Glance headline` -> [[scene_paperboy_theft]] -> [[choice_paperboy_fate]]
- `Move on` -> [[scene_meet_fritz_indirect]]

3. Merge -> [[choice_set_priority]]

## Paperboy Fate Rules

- Mercy:
  `rel_paperboy +1`, `rel_underground +5`
- Report to Fritz:
  `rel_paperboy -1`, `rel_fritz +1`
- Both options return to the same mission briefing merge point.

## Runtime Mapping

- `scene_meet_fritz_direct` -> `beat_fritz_intro_direct`
- `scene_meet_fritz_indirect` -> `beat_fritz_intro_indirect`
- `scene_paperboy_theft` -> `beat_paperboy_theft`
- `choice_paperboy_fate` -> `choice_paperboy_fate`
- `choice_set_priority` -> `beat_fritz_mission`
