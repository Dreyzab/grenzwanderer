---
id: scene_son_house_checks
type: passive_checks
case: sandbox_banker
tags:
  - type/checks
  - location/son_house
---

# Passive Checks: Дом Фридриха

- `perception >= 2`: под ковром найден тайник с остатком долговой расписки.
  - Effect: усиливает `CLUE_B01_DEBT_NOTE`
- `logic >= 2`: по датам квитанций видно, что залоги делались до заявленных краж из сейфа.
  - Effect: косвенно подтверждает `CLUE_B06_LEDGER_MISMATCH`
- `empathy >= 2`: в письме матери Фридрих просит время "исправить ошибку", а не "выиграть еще".
