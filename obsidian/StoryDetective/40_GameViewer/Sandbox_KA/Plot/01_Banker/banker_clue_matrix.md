---
id: banker_clue_matrix
type: clue_matrix
case: sandbox_banker
status: active
tags:
  - type/design
  - case/sandbox_banker
---

# Clue Matrix: Сын банкира

## Clue Contract v1

| clue_id                     | source_scene       | discovery_method                           | reliability | points_to                                                      | payoff_scene              |
| --------------------------- | ------------------ | ------------------------------------------ | ----------- | -------------------------------------------------------------- | ------------------------- |
| `CLUE_B01_DEBT_NOTE`        | `scene_son_house`  | Осмотр письменного стола                   | High        | Фридрих должен посреднику с инициалом `W`                      | `scene_casino_duel`       |
| `CLUE_B02_PAWN_RECEIPT`     | `scene_son_house`  | Проверка гардероба и коробки с квитанциями | High        | Фридрих закладывал личные вещи, а не только тратил деньги отца | `scene_casino_duel_beat2` |
| `CLUE_B03_TAVERN_TESTIMONY` | `scene_tavern`     | Разговор с барменом (подкуп или давление)  | Medium      | Фридрих играл агрессивно из-за внешнего долга                  | `scene_bank_leads`        |
| `CLUE_B04_CROUPIER_LEDGER`  | `scene_tavern`     | Показания о передаче фишек человеку `W`    | Medium      | Выигрыши уходили третьей стороне                               | `scene_casino_duel`       |
| `CLUE_B05_WAX_ON_GLOVE`     | `scene_bank_intro` | Вопрос о сейфе + наблюдательность          | Medium      | Банкир касался сейфа после заявленного времени кражи           | `scene_casino_duel_beat2` |
| `CLUE_B06_LEDGER_MISMATCH`  | `scene_bank_intro` | Логика/финансы: сверка дат в ведомости     | High        | Хронология "краж" не совпадает с банковскими журналами         | `scene_casino_duel_beat2` |

## Mandatory Set

- Минимум 3 улики для уверенного выхода на финал:
  - `CLUE_B01_DEBT_NOTE`
  - `CLUE_B03_TAVERN_TESTIMONY`
  - `CLUE_B06_LEDGER_MISMATCH`

## Fair-Core Guarantees

- Любой критичный вывод подтверждается не менее чем двумя источниками:
  - Внешний долг сына: `CLUE_B01` + `CLUE_B03`
  - Передача денег посреднику: `CLUE_B03` + `CLUE_B04`
  - Подозрительное поведение банкира: `CLUE_B05` + `CLUE_B06`

## Optional Flavor Clues

- `CLUE_B02_PAWN_RECEIPT` усиливает эмпатию к Фридриху и открывает мягкую развязку.
