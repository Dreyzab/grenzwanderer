# Loop Economy

Cycle:

1. Obtain items, money, and tradeable evidence.
2. Spend resources on tools/consumables.
3. Unlock safer or richer options in next encounters.

## Main domains

- [[20_Game_Design/03_Interaction/READ_ME|03 Interaction]]
- [[20_Game_Design/04_World/READ_ME|04 World]]

## System anchors

- [[20_Game_Design/Systems/Inventory_Merchant|Inventory and Merchant]]
- [[20_Game_Design/Systems/Combat|Combat Notes]]

## Balancing checks

- average income vs mandatory costs;
- merchant stock relevance by case phase;
- consumable usefulness in both investigation and conflict.
- economy choices must produce visible dossier consequences (alignment/secrets/evolution signals).

## Merchant variants (Phase 2)

- `the_fence` (`pawnbroker`): contraband and high-value clue conversion.
- `apothecary_shop` (`apothecary`): sustain/recovery consumables.
- `tailor_shop` (`tailor`): social leverage items for dialogue pressure.
- `pub_keeper` (`innkeeper`): low-cost food + rumor conversion.

## Access and role gates

- `the_fence` unlock: `underworld_contact` flag or `fct_underworld >= 2`.
- all merchants mapped to explicit location nodes and character roles.

## Economy multipliers

- each merchant has independent buy/sell coefficients (not a single 100/50 rule).
- intended loop: acquire clues/resources -> sell where favorable -> buy role-specific tools for next route.

## Dossier feedback loop (Psyche Profile)

- faction-linked trade and route choices feed `fct_*` reputation trends and alter alignment readouts in dossier UX.
- gate-breaking economy decisions (underworld access, rumor purchases, district pass routes) surface as knowledge/evolution pressure.
- economy is therefore both resource optimization and narrative identity formation.
