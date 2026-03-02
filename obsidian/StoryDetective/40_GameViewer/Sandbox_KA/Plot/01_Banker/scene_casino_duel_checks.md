---
id: scene_casino_duel_checks
type: passive_checks
case: sandbox_banker
tags:
  - type/checks
  - location/casino
---

# Passive Checks: Казино

- `logic >= 3` + `clue_CLUE_B06_LEDGER_MISMATCH = true`: можно уверенно связать подлог дат и версию о кражах.
- `perception >= 2` + `clue_CLUE_B04_CROUPIER_LEDGER = true`: замечаешь того самого посредника с инициалом `W` в зале.
- `empathy >= 2` + `clue_CLUE_B02_PAWN_RECEIPT = true`: Фридрих реагирует на тему отцовского долга, а не на обвинение в воровстве.
