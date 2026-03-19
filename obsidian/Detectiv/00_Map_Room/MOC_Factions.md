---
id: moc_factions
tags:
  - type/moc
  - domain/world
---

# MOC Factions

Freiburg is intentionally framed as a city with a warm daily surface, a pressure-heavy political middle, and a shadow layer underneath. Runtime and lore should use the same canonical registry.

## Public Psyche Layers

### Daylight
- [[fct_city_chancellery]] — `runtime_id: city_chancellery`
- [[fct_masters_union]] — `runtime_id: masters_union`
- [[fct_college_of_reason]] — `runtime_id: college_of_reason`
- [[fct_chapter_of_mercy]] — `runtime_id: chapter_of_mercy`

### Political
- [[fct_house_of_pledges]] — `runtime_id: house_of_pledges`

### Shadow
- [[fct_city_network]] — `runtime_id: city_network`
- [[fct_free_yards]] — `runtime_id: free_yards`

## Hidden Runtime Faction
- [[fct_the_returned]] — `runtime_id: the_returned`, `visibility: hidden`

## Runtime Notes
- Canonical gameplay registry: 8 factions.
- Public Character/Psyche alignment: `daylight | political | shadow | contested | unaligned`.
- Migration-only compatibility inputs: `civic_order`, `financial_bloc`, `underworld`, plus legacy `rep_*`.
- `the_returned` remains stored in runtime state but is hidden from the normal Character/Psyche view.
