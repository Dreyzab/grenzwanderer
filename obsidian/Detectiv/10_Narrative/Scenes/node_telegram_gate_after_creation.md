---
id: node_telegram_gate_after_creation
aliases:
  - Node: Telegram Gate After Creation
tags:
  - type/node
  - status/active
  - layer/system
  - phase/start
---

# Node: Telegram Gate After Creation

## Trigger Source

- Trigger event: END of `intro_char_creation`.
- Code anchors:
  - `apps/web/src/pages/VisualNovelPage/VisualNovelPage.tsx` (`handleEndScenario`, `handleTelegramComplete`)

## Preconditions

- Required flags: `char_creation_complete=true`.
- Required evidence/items: none.
- Required quest stage: onboarding handoff.
- Fallback if missing requirements: reopen `node_intro_char_creation`.

## Designer View

- Player intent: acknowledge entry telegram and continue investigation.
- Narrative function: bridge identity setup -> first mission briefing.
- Emotional tone: urgency, authority summons.
- Stakes: if declined, flow can stall or diverge.

## Mechanics View

- Player verb: acknowledge telegram and continue.
- Node type: decision.
- Mechanics used:
  - onboarding modal gate;
  - naming input;
  - scenario routing handoff.

## Canonical Continuation (Implemented)

- Telegram modal is shown in `VisualNovelPage` after `intro_char_creation`.
- On complete:
  - set player name;
  - route to `/vn/detective_case1_alt_briefing`.

## Legacy Note

- HomePage-based continuation to `intro_journalist` is deprecated for main start flow.
- `intro_journalist` can remain as optional legacy/origin content, but not canonical onboarding.

## State Delta

- Flags set:
  - `telegram_acknowledged=true` (runtime equivalent via completion path).
- Flags unset:
  - none.
- Evidence gained:
  - none.
- Evidence lost:
  - none.
- Quest stage changes:
  - onboarding chain advances to briefing.
- Map unlock/visibility changes:
  - none at this node.
- Resources (xp/money/items):
  - none.
- Relationship deltas:
  - none.

## Transitions

- Continue → [[10_Narrative/Scenes/node_case1_hbf_arrival|Case 1 HBF Arrival]] (игрок прибывает на вокзал, карта открывается впервые)
- Legacy direct → [[10_Narrative/Scenes/node_case1_alt_briefing_entry|Case 1 Alt Briefing Entry]] (для тестирования без карты)
- Legacy optional → [[10_Narrative/Scenes/node_intro_journalist_origin|Intro Journalist Origin]]

## Validation

- Test anchor:
  - complete char creation and confirm continuation to `/vn/detective_case1_alt_briefing`.
- Done criteria:
  - canonical continuation is single and documented.

## Branch Diagram

```mermaid
graph TD
  A[Char creation END] --> B{char_creation_complete}
  B -->|No| C[Recovery: reopen char creation]
  B -->|Yes| D[Telegram modal]
  D --> E[node_case1_hbf_arrival]
  E --> F[Map loads → HBF → Briefing → Exploration]
  D -->|Legacy/test| G[/vn/detective_case1_alt_briefing]
```
