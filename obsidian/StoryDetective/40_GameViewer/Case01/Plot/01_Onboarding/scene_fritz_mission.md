---
id: scene_fritz_mission
parent: scene_hbf_arrival
type: scene
characters: [gendarm]
location: loc_hbf
status: active
tags:
  - case/case01
  - phase/briefing
  - logic/merge_point
---

# Fritz Mission Briefing (Merge Point)

## Narrative Context

This is the convergence point for all HBF Arrival branches.
Officer Fritz Muller formally briefs the player on the situation regardless of how they met.

## Transitions

**From:**

- [[scene_meet_fritz_direct]] (Direct Approach)
- [[scene_meet_fritz_indirect]] (Indirect Approach)
- [[choice_paperboy_fate]] (Theft Side-Quest)

## Logic & State

- **Character**: Fritz Muller (`gendarm`)
- **Tone**: Urgent, professional, stressed.
- **Reactivity**:
  - His opening line varies based on entry path (handled in previous nodes).
  - This scene focuses on the _Choice_.

## Choices

1. **"Secure the Crime Scene."** (Priority: Bank)
   - Sets `priority_bank_first = true`
   - Unlocks [[loc_freiburg_bank]]
   - Next: [[hbf_finalize]]

2. **"Manage the Politics."** (Priority: Mayor)
   - Sets `priority_mayor_first = true`
   - Unlocks [[loc_rathaus]]
   - Next: [[hbf_finalize]]

## Outcomes

- **Quest Start**: `case01_started`
- **Resources**: Map Unlocked, Dossier Access.
