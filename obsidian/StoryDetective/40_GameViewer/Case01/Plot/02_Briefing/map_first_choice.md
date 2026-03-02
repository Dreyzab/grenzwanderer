---
id: map_first_choice_gv
aliases:
  - Map: First Choice
tags:
  - type/map_hub
  - layer/map
  - case/case01
  - phase/briefing
---

# 🗺️ Map: First Choice

## 🖥️ Map Interface

**Active Region**: Old Town (Altstadt)
**Time**: 08:30 AM (Morning)

### 📍 Points of Interest

| Status        | Location       | Description                            |
| ------------- | -------------- | -------------------------------------- |
| 🟢 **Active** | **Kaiserbank** | Место преступления. Оцеплено полицией. |
| 🟢 **Active** | **Rathaus**    | Мэрия. Ожидается официальный визит.    |
| 🔒 **Locked** | _Tailor Shop_  | Требуется зацепка из Банка             |
| 🔒 **Locked** | _Pharmacy_     | Требуется химический анализ            |

### 🎒 UI Elements

- **Journal**: Обновлена запись "Case 01 Started"
- **Inventory**: Доступен (содержит Newspaper, Badge)
- **Mind Palace**: Недоступен (откроется после первого осмотра)

## Design Note

Первый стратегический выбор игрока — куда идти сначала:

- **Bank first**: встреча с Clara на месте преступления
- **Mayor first**: формальный брифинг с политическим контекстом

## → Navigation Choices

[[40_GameViewer/Case01/Plot/03_Bank/scene_bank_arrival|🏦 Go to Kaiserbank]]
[[40_GameViewer/Case01/Plot/02_Briefing/scene_mayor_briefing|🏛️ Go to Rathaus]]
