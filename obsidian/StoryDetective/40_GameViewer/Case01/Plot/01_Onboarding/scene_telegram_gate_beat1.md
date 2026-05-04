---
id: scene_telegram_gate_beat1
parent: scene_telegram_gate
type: vn_beat
order: 1
tags:
  - type/vn_beat
  - case/case01
---

# 📖 Beat 1: Reading the Telegram

## VN Script

**[Narrator]**:
"Телеграмма лежит на столе. [[ev_telegram_paper|Жёлтая бумага]] с
[[ev_official_stamp|официальным штампом]] полицейского управления Бадена.

Текст краток, как и положено:"

---

**[Telegram Text]**:

> "СРОЧНО ТЧК ОГРАБЛЕНИЕ ИМПЕРСКОГО БАНКА ВО ФРАЙБУРГЕ ТЧК
> ТРЕБУЕТСЯ СПЕЦИАЛИСТ ТЧК ПРИБЫТЬ НЕМЕДЛЕННО ТЧК
> ПОДПИСАНО: КОМИССАР ВЕБЕР"

---

**[Narrator]**:
"[[loc_freiburg_city|Фрайбург]]. Университетский город на границе с Швейцарией.
И — судя по всему — твоё следующее дело."

## Evidence Inline

| Word/Phrase         | Evidence              | Category    |
| ------------------- | --------------------- | ----------- |
| Жёлтая бумага       | [[ev_telegram_paper]] | Observation |
| официальным штампом | [[ev_official_stamp]] | Fact        |

## → Next

[[scene_intro_journey]]
