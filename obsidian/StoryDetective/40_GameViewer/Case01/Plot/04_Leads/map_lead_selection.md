---
id: map_lead_selection_gv2
aliases:
  - Map: Lead Selection
tags:
  - type/map_hub
  - layer/map
  - case/case01
  - phase/lead_selection
---

# 🗺️ Map: Lead Selection

## Trigger

После [[40_GameViewer/Case01/Plot/03_Bank/scene_bank_arrival|Bank Scene]]

## Available Points

| Point ID         | Label             | → VN Scene                                                | Trail             |
| ---------------- | ----------------- | --------------------------------------------------------- | ----------------- | --------- |
| `loc_tailor`     | 👔 Ателье Кляйна  | [[40_GameViewer/Case01/Plot/04_Leads/hub_leads_tailor     | HUB: Tailor]]     | Identity  |
| `loc_apothecary` | ⚗️ Аптека Кильани | [[40_GameViewer/Case01/Plot/04_Leads/hub_leads_apothecary | HUB: Apothecary]] | Chemical  |
| `loc_pub`        | 🍺 Медный Дракон  | [[40_GameViewer/Case01/Plot/04_Leads/hub_leads_pub        | HUB: Pub]]        | Logistics |

## Conditional Points

| Point           | Condition              | → VN Scene                                                         |
| --------------- | ---------------------- | ------------------------------------------------------------------ | ----------------- |
| `loc_telephone` | `leads_completed >= 2` | [[40_GameViewer/Case01/Plot/04_LeadSelection/scene_lotte_interlude | Lotte Interlude]] |

## Clue Payoff

Улики из Bank Investigation открывают опции в leads.
