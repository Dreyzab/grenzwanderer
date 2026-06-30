---
id: scene_case01_bank_arrival
type: vn_scene
status: active
background_url: /images/locations/loc_freiburg_bank/bank_hall_1905.webp
character_id: victoria_sterling
---

# Bankhaus J.A. Krebs

## Script

Cold air clings to the marble steps of Bankhaus J.A. Krebs. A closed postal car
sits crooked near the entrance, its rear door not quite latched. Victoria
Sterling is already beside it, not touching the handle, counting the knots in
the black-yellow postal twine as if each one has sworn a separate oath.

Inside, clerks sit on lobby benches with wet cloths pressed to their faces. The
gas is almost gone, visible only where daylight catches the marble dust and dull
brass. Someone has already decided which version of the daylight robbery the
room should survive. With Victoria beside you, the room has to recalculate who
is allowed to notice the chemistry.

```vn-logic
choices:
  - id: CASE01_BANK_WITH_VICTORIA
    text: Bring Victoria inside and watch who recalculates around the gas story.
    next: scene_case01_bank_manager
    effects:
      - set_flag(victoria_introduced,true)
      - set_flag(victoria_seen_in_bank,true)
      - change_relationship(victoria_sterling,1)
  - id: CASE01_BANK_SOLO
    text: Enter first and make Victoria hold the postal car outside.
    next: scene_case01_bank_manager
```

## Dramatic Function

Victoria enters as pressure, not a navigator. The gas gives the bank an official
explanation for confusion, while Matthias notices that rehearsed panic is still
rehearsed.
