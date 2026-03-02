---
id: scene_bank_intro_checks
type: passive_checks
case: sandbox_banker
tags:
  - type/checks
  - location/bank
---

# Passive Checks: Банк

- `logic >= 2`: замечаешь, что даты в ведомости "пропаж" записаны одной и той же рукой в конце недели.
  - Effect: `clue_CLUE_B06_LEDGER_MISMATCH = true`
- `perception >= 2`: на перчатке банкира след темного сургуча, совпадающий с печатью сейфа.
  - Effect: `clue_CLUE_B05_WAX_ON_GLOVE = true`
- `empathy >= 2`: страх Вагнера больше похож на страх разоблачения, чем на страх за сына.
