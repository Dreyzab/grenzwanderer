---
id: scene_case_missing_courier_station
type: vn_scene
status: active
---

# Scene: Station Yard

## Script

Steam rolls low over the coach stand while porters trade rumors for cigarettes. A
waybill with municipal markings places the courier on a cart that never cleared the
official rail manifest. The driver remembers a second rider; the yard foreman denies
any passenger transfer happened.
You can either secure the record first or chase the contradiction while it is warm.

```vn-logic
passive_checks:
  - id: check_station_stamp_alignment
    voice_id: attr_intellect
    difficulty: 12
    show_chance_percent: true
    karma_sensitive: true
    outcome_model: binary
    on_success:
      effects:
        - set_flag(courier_waybill_stamp_copy_confirmed,true)
    on_fail:
      effects:
        - add_tension(1)
choices:
  - id: CASE_MISSING_COURIER_STATION_WAYBILL
    text: Register the forged waybill and requisition transport witness signatures.
    next: scene_case_missing_courier_storehouse
    effects:
      - set_flag(courier_waybill_forged,true)
      - add_var(case_missing_courier_evidence,1)
  - id: CASE_MISSING_COURIER_STATION_SHORTCUT
    text: Ignore rail jurisdiction and detain the driver on the spot.
    next: scene_case_missing_courier_storehouse
    effects:
      - set_flag(case_missing_courier_jurisdiction_breach,true)
      - add_tension(1)
  - id: CASE_MISSING_COURIER_STATION_SECOND_RIDER
    text: Build a second-rider profile from porter timelines before moving on.
    next: scene_case_missing_courier_storehouse
    visible_if_all:
      - flag_equals(courier_waybill_stamp_copy_confirmed,true)
    effects:
      - set_flag(courier_second_rider_profiled,true)
      - add_var(case_missing_courier_evidence,1)
```
