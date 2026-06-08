---
id: char_case01_hotel_maid
node_type: character
case: case01
phase: investigation
status: active
runtime_character_id: npc_hotel_maid
npc_identity: npc_hotel_maid
tags:
  - type/character
  - origin/witch
  - faction/city_network
---

# Hotel Maid

![Portrait](/images/characters/hotel_maid/hotel_maid.webp)

**Runtime id**: `npc_hotel_maid`
**Role**: Morning maid at Zum Goldenen Adler
**Affiliation**: City Network — Adler hotel staff
**Roster tier**: functional

## Profile

- Knocks on Eleonora's door the morning after the alley. Reads the room for
  the price of discretion before she reads the dress for evidence.
- Bribing her destroys the bloodied dress in exchange for trust and a quiet
  back-channel through hotel staff; deception failure leaks rumor instead.
- Sorcery cleansing skips her entirely and leaves a copper-smell tell that
  Felix may pick up later.

## Service

- `svc_hotel_discretion` — quiet hotel-side cover (vanished laundry, room
  staff staying silent) unlocked after a successful maid bribe.

## Appearances

- `scene_case01_hotel_morning_witch` — Утро после...

## Player Dossier

- (reveal: met_hotel_maid_intro) **The Morning Maid**: She knocks the morning after the alley and reads the room for the price of discretion before she reads the dress for evidence.
