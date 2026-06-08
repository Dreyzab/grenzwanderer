---
id: scene_case01_sapper_flashback
type: vn_scene
status: active
case: case01
characterId: npc_albrecht_stoll
---

# Scene: The Clean Cut (Sapper Flashback)

> Runtime beat. Visual contract per `CASE01_BANK_VISUAL_PLAN.md`: reveal hands,
> shoulders, and shadow before the face.

## Script

The memory comes to you the way evidence does — out of order, from the metal up.

A gloved hand. Heavy, chemical-resistant, not the soft cotton a postman would
wear. It sets a packed charge against the throat of a private deposit box with
the unhurried care of a man laying a fuse on a bridge pier. Magnesium and iron
oxide, measured the night before by lamplight, weighed twice.

The light, when it comes, is wrong for a bank. It is the white of a field
demolition — a sun that should not be indoors. The velvet lining of the box
curls and blackens. Slag runs down the steel and pools, and the air fills with
the smell you will later catalogue from the floor: hot magnesium, a thread of
ozone, scorched cloth.

A military tunic shows under a postman's coat that does not fit the shoulders.
An army seam, an old burn-dark cuff. He does not hurry. He does not gloat. He
checks his watch against a timetable folded into a forged dispatch, the way an
officer checks a schedule he himself signed.

He lifts the grimoire out of the ruined box, ties the spent canister with black-
and-yellow postal twine out of pure habit, and is gone before the lobby's gas
has even finished settling. One box. The room left standing. A clean cut.

The face never turns toward you. Not yet.

```vn-logic
on_enter:
  - set_flag(case01_sapper_profiled,true)
  - set_flag(false_trail_post_route_refuted,true)
choices:
  - id: CASE01_SAPPER_FLASHBACK_LOGIC
    text: (Logic) A daytime breach on that timetable needs a trained demolition hand.
    next: scene_case01_warehouse_sapper
  - id: CASE01_SAPPER_FLASHBACK_PERCEPTION
    text: (Perception) The slag ratio and the burned cuffs are the same signature.
    next: scene_case01_warehouse_sapper
```
