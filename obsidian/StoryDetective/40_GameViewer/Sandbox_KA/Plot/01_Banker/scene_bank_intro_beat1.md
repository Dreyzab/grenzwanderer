---
id: scene_bank_intro_beat1
parent: scene_bank_intro
type: vn_beat
order: 1
tags:
  - type/vn_beat
  - case/sandbox_banker
  - location/bank
---

# Beat 1: Просьба о тишине

## VN Script

**Нарратор:**
Солнечный луч ложится на дверцу сейфа. Замок открыт, но внутри пустые ячейки для наличных.

**Господин Вагнер:**
Благодарю, что пришли без лишних вопросов. Мой сын, Фридрих, уже месяц исчезает по ночам.

**Господин Вагнер:**
Из моего частного сейфа пропали деньги. Не хочу полиции. Один слух в прессе, и вкладчики решат, что мы тонем.

**Детектив:**
Вы уверены, что сын имел доступ к сейфу?

**Господин Вагнер:**
У него был старый ключ. Я... не успел заменить личный замок.

## Evidence Inline

| Word/Phrase    | Clue ID                           | Category   |
| -------------- | --------------------------------- | ---------- |
| старый ключ    | `CLUE_B01_DEBT_NOTE` (seed)       | Testimony  |
| страх скандала | `CLUE_B06_LEDGER_MISMATCH` (seed) | Behavioral |

## Next

[[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_intro_beat2|scene_bank_intro_beat2]]
