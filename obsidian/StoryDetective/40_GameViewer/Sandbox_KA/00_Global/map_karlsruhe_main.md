---
id: map_karlsruhe_main
type: map_root
phase: sandbox_hub
status: active
tags:
  - type/map_root
  - layer/map
  - case/sandbox_ka
  - location/karlsruhe
---

# Map: Karlsruhe Main

## Trigger Source

- Entry from [[40_GameViewer/Sandbox_KA/00_Entry/scene_map_intro|scene_map_intro]].

## Preconditions

- `ka_intro_complete = true`.

## Designer View

- Main sandbox board with free ordering between three client cases.
- Player sees map points and the partner icon in the lower corner.

## Mechanics View

- Active case id: `sandbox_karlsruhe`.
- Runtime map points:
  - Banker chain: `loc_ka_bank`, `loc_ka_son_house`, `loc_ka_tavern`, `loc_ka_casino`
  - Dog chain: `loc_ka_rathaus`, `loc_ka_butcher`, `loc_ka_bakery`, `loc_ka_park`
  - Ghost chain: `loc_ka_estate`, `loc_ka_guild`
- Each point uses `start_vn(sandbox_*)` bindings.

## State Delta

- No mandatory state mutation on map open.
- Availability is controlled by quest flags and point unlock actions.

## Transitions

- [[40_GameViewer/Sandbox_KA/01_Hubs/hub_bank|hub_bank]]
- [[40_GameViewer/Sandbox_KA/01_Hubs/hub_rathaus|hub_rathaus]]
- [[40_GameViewer/Sandbox_KA/01_Hubs/hub_estate|hub_estate]]
- [[40_GameViewer/Sandbox_KA/01_Hubs/hub_agency|hub_agency]]
- [[40_GameViewer/Sandbox_KA/00_Global/char_partner|char_partner]] (hint node)

## Validation

- Any completed quest branch must return to this node.
- Map must keep at least one available action until all three clients are resolved.
