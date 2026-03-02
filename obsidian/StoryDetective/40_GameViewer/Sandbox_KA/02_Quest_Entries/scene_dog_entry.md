---
id: scene_dog_entry
type: vn_scene
phase: sandbox_dog
tags:
  - type/connector
  - direction/entry
---

# Entry Wrapper: Dog Case

## Trigger Source

- Entered from [[40_GameViewer/Sandbox_KA/01_Hubs/hub_rathaus|hub_rathaus]].
- Runtime map action: `loc_ka_rathaus -> start_vn('sandbox_dog_mayor')`.

## Preconditions

- `ka_intro_complete = true`
- `DOG_CASE_DONE = false`

## Designer View

- Setup scene in mayor office with public embarrassment and urgency.
- Objective: launch breadcrumb search through city service locations.

## Mechanics View

- Runtime chain:
  - `sandbox_dog_mayor`
  - `sandbox_dog_butcher`
  - `sandbox_dog_bakery`
  - `sandbox_dog_park`
- Soft-fail recovery exists in each lead check.

## State Delta

- Initial contract flags:
  - `TALKED_MAYOR = true`
  - `DOG_VENDOR_CLUE = true`
- unlock: `loc_ka_butcher`
- quest stage: `sandbox_dog -> client_met`

## Transitions

- Narrative chain reference:
  - [[40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_rathaus|scene_rathaus]]
  - [[40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_butcher|scene_butcher]]
  - [[40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_bakery|scene_bakery]]
  - [[40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_park_reunion|scene_park_reunion]]

## Validation

- Every lead scene must provide map return or next breadcrumb.
- Critical path must remain completable after one failed check.
