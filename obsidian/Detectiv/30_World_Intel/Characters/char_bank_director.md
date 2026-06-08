---
id: char_bank_director
tags: [character, functional]
tier: functional
runtime_character_id: kessler_banker
npc_identity: npc_kessler_banker
faction: masters_union
aliases: ["Johann Kessler", "Bankdirektor Kessler", "Herr Direktor"]
---

# Johann Kessler

## Dossier

- **Role**: **Bankdirektor** (Director) of Bankhaus J.A. Krebs — the institution's public head and the face the city sees after the robbery.
- **Age / Appearance**: Early 60s, silver side-whiskers, frock coat, the unhurried gravity of a man long addressed as "Herr Direktor."
- **Archetype**: The Institutional Figurehead
- **Origin**: Freiburg's merchant-banking establishment; a Director of reputation more than operations.

## Era Note

- In a German bank of this period the **Direktor** holds public authority and represents the house, while a **Prokurist** (Galdermann) wields the day-to-day signing power under Prokura. Kessler chairs; Galdermann signs — which is precisely how the cover-up stays at arm's length from the Director's desk.

## Secrets

- **Surface**: Cooperative and gravely concerned; wants the robbery "resolved quietly, for the depositors' sake."
- **Hidden**: More invested in the bank's reputation than in the truth; steers the inquiry toward a clean public narrative.
- **Core**: Whether he is complicit in Galdermann's cover-up or merely a willing fool turns on how hard the detective presses the ledger discrepancies.

## Relationships

- [[30_World_Intel/Characters/char_bank_manager|char_bank_manager]] - his Prokurist, Heinrich Galdermann, who runs operations (and the cover-up) beneath him.
- [[30_World_Intel/Characters/char_inspector|char_inspector]] - the detective he receives in the director's office.
- Factions: [[00_Map_Room/MOC_Factions|MOC_Factions]]

## Scenes & Quests

- Appears in: [[40_GameViewer/Case01/Plot/03_Bank/scene_bank_arrival|Bank arrival (runtime scene)]]
- Linked quest: [[00_Map_Room/qst_main_case_01|qst_main_case_01]]

## Runtime Contract

- **Runtime cast id**: `npc_kessler_banker` (location cast — bank scene NPC, not a recurring journal contact).
- **Distinct from**: `bank_manager` / Heinrich Galdermann (the culprit-Prokurist).
