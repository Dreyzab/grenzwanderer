---
id: world_loc_freiburg_bank
tags:
  - location
  - world
  - fribourg-1905
runtime_location_id: loc_freiburg_bank
---

# Bankhaus J.A. Krebs

> **ID**: `loc_freiburg_bank`
> **District**: Altstadt (Münsterplatz)
> **Runtime Type**: `CRIME_SCENE`
> **Vibe**: _Institutional prestige under forensic pressure_

![Exterior](file:///C:/Users/lol/.gemini/antigravity/brain/023ef4ac-9c35-4e66-b765-9642a676aeff/loc_freiburg_bank_investigation_exterior_1778172916135.png)

## Atmosphere (Sensory)

- **Sight**: Baroque facade at Münsterplatz, fresh renovation scaffolds, polished counters.
- **Sound**: Muted clerk chatter, stamp hits, vault metal resonance.
- **Smell**: Ink, brass polish, cold stone, and the acrid lingering scent of military-grade thermite.
- **Light**: Filtered daylight through high windows; flickering gas lamps in the corridors.
- **Mood**: Controlled panic and professional silence.

![Lobby](file:///C:/Users/lol/.gemini/antigravity/brain/023ef4ac-9c35-4e66-b765-9642a676aeff/loc_freiburg_bank_lobby_investigation_1778173047925.png)

## The Postal Lead (Mute Witness)

 Parked near the side entrance is a standard yellow postal carriage. To the casual observer, it’s just logistics. To a detective, it’s a story:
- **Rear door**: Not fully latched, swinging slightly with the wind.
- **Interior**: A torn route list lies on the floorboards, stamped with a "Freiburg Central" seal that looks... freshly applied.
- **Wheel**: One rear wheel is caked in heavy, grey river-clay mud—clashing with the clean cobblestones of Münsterplatz.
- **Traces**: A single, clean boot print near the step, as if someone swapped footwear before entering the bank.

## The Vault Breach (Box 412)

![Vault Breach](file:///C:/Users/lol/.gemini/antigravity/brain/023ef4ac-9c35-4e66-b765-9642a676aeff/loc_freiburg_bank_vault_razlom_wound_1778173073077.png)

- **Mechanism**: The heavy steel door of Box 412 has been cut with terrifying precision. A "Razlom" (Rift) wound—molten steel frozen in mid-drip, smelling of magnesium and ozone.
- **Motive**: The "Razlom" grimoire was stored here. Its absence leaves a void that echoes with occult significance.

## Phase Variations

| Phase   | Description                                               | Available NPCs                 |
| ------- | --------------------------------------------------------- | ------------------------------ |
| morning | Bank opens; discovery of the breach.                      | bank_manager, clerk, inspector |
| day     | Peak investigation; postal deliveries mask the exit.      | bank_manager, clerk, inspector |
| evening | Public floor closes; Galdermann is in his office.         | bank_manager, inspector        |

![Galdermann Office](file:///C:/Users/lol/.gemini/antigravity/brain/023ef4ac-9c35-4e66-b765-9642a676aeff/loc_freiburg_bank_office_investigation_1778173061198.png)

## POI Sync (case_01_points.ts)

- **locationId**: `loc_freiburg_bank`
- **Bindings**: `bank_enter`, `bank_vault_investigation`, `postal_lead_check`

## Investigation Hooks

- Primary narrative node: [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- Related MOC: [[00_Map_Room/MOC_Locations|MOC_Locations]]
