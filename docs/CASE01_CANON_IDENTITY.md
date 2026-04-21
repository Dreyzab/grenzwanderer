# Case01 Canon Identity

This document fixes the current Case01 naming and alias policy across runtime,
StoryDetective authoring, Detectiv design notes, and OpenViking indexing.

## Rule

- Runtime/display canon wins when names differ across layers.
- Detectiv-only alternate names remain available as reference aliases, not as
  separate live runtime entities.
- OpenViking audits should treat alias documents as `design/reference`, not as
  competing runtime truth.

## Current Canon

### Lotte

- Runtime-canonical display name: `Lotte Weber`
- Runtime character id: `operator`
- Design/reference alias: `Lotte Fischer`
- Rule: Detectiv material may mention `Lotte Fischer`, but supported Case01 and
  Freiburg social runtime content must display and index `Lotte Weber`.

### Fritz

- Runtime-canonical display name: `Fritz Muller`
- Runtime character id: `gendarm`
- Design/reference transliteration alias: `Fritz Mueller`
- Reserved locale alias: `Fritz Müller`
- Rule: supported runtime content uses `Fritz Muller`; Detectiv and audit
  material may retain `Mueller` or `Müller` only as aliases.

## Audit Expectations

- Case01 runtime docs and snapshot-backed content should resolve to one
  canonical name per runtime character id.
- Detectiv alias files should declare that they are `design/reference`.
- OpenViking grep and semantic audit flows should surface runtime canon and
  design aliases in separate scopes.
