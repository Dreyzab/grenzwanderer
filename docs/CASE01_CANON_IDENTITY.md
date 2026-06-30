# Case01 Canon Identity

This document fixes the current Case01 naming and alias policy across runtime,
StoryDetective authoring, Detectiv design notes, and OpenViking indexing.

## Rule

- Runtime/display canon wins when names differ across layers.
- A playable origin identity is not an alias pool. If a name belongs to a
  different origin, it cannot be reused to patch another protagonist.
- Freiburg social runtime IDs beat older generic speaker keys.
- Detectiv-only alternate names remain available as reference aliases, not as
  separate live runtime entities.
- OpenViking audits should treat alias documents as `design/reference`, not as
  competing runtime truth.

## Current Canon

### Matthias Adler — detective origin

- Runtime-canonical display name: `Matthias Adler`
- Playable origin id: `detective`
- Runtime detective speaker/id compatibility: `inspector`
- Not an alias: `Arthur Vance`
- Rule: supported detective-origin runtime content must preserve Matthias Adler as
  the player identity. New depth is added through player-choice alternatives,
  not by replacing the base character with Arthur or another persona.
- Baseline tone: professional, observant, restrained, and willing to apply
  procedural pressure without becoming a different character.

### Arthur Vance — journalist origin

- Runtime-canonical display name: `Arthur Vance`
- Playable origin id: `journalist`
- Origin flag: `origin_journalist`
- Rule: Arthur is a separate playable protagonist for the journalist route. Old
  material that used Arthur as a detective alias is legacy reference only and
  must not be promoted into supported detective-origin scenes.

### Lotte Weber

- Runtime-canonical display name: `Lotte Weber`
- Freiburg social runtime id: `npc_weber_dispatcher`
- Legacy speaker/role key: `operator`
- Design/reference alias: `Lotte Fischer`
- Rule: supported Case01 and Freiburg social runtime content must display and
  index `Lotte Weber` through `npc_weber_dispatcher`. Detectiv material may
  preserve `Lotte Fischer` / `operator` only as legacy reference metadata.

### Victoria Sterling

- Runtime-canonical display name: `Victoria Sterling`
- Runtime character id: `victoria_sterling`
- Legacy planning aliases: `Clara von Altenburg`, `Clara Altenburg`
- Rule: supported Case01 scientific-companion / shadow-case content uses
  Victoria Sterling. Clara is a deprecated planning shard unless a future ADR
  promotes a separate Clara identity.

### Baroness Elise von Altenburg

- Runtime-canonical display name: `Baroness Elise von Altenburg`
- Runtime character id: `npc_baroness_elise`
- Legacy drift aliases: `Baroness Klara von Altenburg`, `Баронесса Клара`,
  `Клара фон Альтенбург`
- Rule: supported Witch-prologue estate runtime uses Baroness Elise. Klara
  variants are legacy drift, not an alternate supported display name.

### Fritz

- Runtime-canonical display name: `Fritz Muller`
- Runtime character id: `gendarm`
- Design/reference transliteration alias: `Fritz Mueller`
- Reserved locale alias: `Fritz Müller`
- Rule: supported runtime content uses `Fritz Muller`; Detectiv and audit
  material may retain `Mueller` or `Müller` only as aliases/localization.

### Case01 institution / spelling guards

- Runtime-canonical bank display: `Bankhaus J.A. Krebs`
- Legacy bank aliases: `Kaiserbank`, `Bankhaus Krebs`
- Runtime-canonical culprit spelling: `Heinrich Galdermann`
- Legacy spelling aliases: `Heinrich Haldermann`, `Galderman`

## Audit Expectations

- Case01 runtime docs and snapshot-backed content should resolve to one
  canonical name per runtime character id.
- Arthur Vance must be reserved for the journalist origin and must not appear as
  a Matthias/detective replacement.
- Lotte Weber must resolve to `npc_weber_dispatcher`; `operator` is not the live
  social NPC id.
- Detectiv alias files should declare that they are `design/reference`.
- OpenViking grep and semantic audit flows should surface runtime canon and
  design aliases in separate scopes.
