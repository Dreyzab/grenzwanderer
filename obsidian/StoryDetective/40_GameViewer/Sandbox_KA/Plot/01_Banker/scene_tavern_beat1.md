---
id: scene_tavern_beat1
parent: scene_tavern
type: vn_beat
order: 1
tags:
  - type/vn_beat
  - case/sandbox_banker
  - location/tavern
---

# Beat 1: Грязные деньги любят тишину

## VN Script

**Бармен Ханс:**
Фридрих? Он не самый шумный игрок здесь. Ставки у него безумные, но радости от победы в глазах нет.

**Партнер:**
Тратит не на себя?

**Бармен Ханс:**
Иногда после победы он даже не забирает фишки. Подходит человек в сером пальто, с инициалом `W` на булавке.

**Детектив:**
Значит, это не мальчишеский бунт. Это долговой поводок.

## Evidence Inline

| Word/Phrase        | Clue ID                     | Category   |
| ------------------ | --------------------------- | ---------- |
| человек с `W`      | `CLUE_B04_CROUPIER_LEDGER`  | Testimony  |
| играет без радости | `CLUE_B03_TAVERN_TESTIMONY` | Behavioral |

## Next

- [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_tavern_ch1|scene_tavern_ch1]]
- [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_tavern_ch2|scene_tavern_ch2]]
