---
id: char_partner
type: mechanic
role: guide
tags:
  - type/mechanic
  - layer/map
  - case/sandbox_ka
---

# Partner: Clara

## Trigger Source

- Visible from [[40_GameViewer/Sandbox_KA/00_Global/map_karlsruhe_main|map_karlsruhe_main]].

## Preconditions

- `ka_intro_complete = true`.

## Designer View

- UI icon in the lower-right map corner.
- First mandatory hint line:
  - "Нужно поговорить с 3 заказчиками."

## Mechanics View

- Context hints are driven by runtime flags:
  - `TALKED_BANKER = false` -> remind about the bank.
  - `TALKED_MAYOR = false` -> remind about Rathaus.
  - `ESTATE_INVESTIGATED = false` and `GHOST_CASE_DONE = false` -> remind about the estate.
- Secondary hint examples:
  - `TAVERN_GOSSIP = true` and `SON_DUEL_DONE = false` -> nudge toward casino.
  - `DOG_BUTCHER_CLUE = true` and `DOG_BAKERY_CLUE = false` -> nudge toward bakery.

## State Delta

- No hard state changes; this is guidance-only in the current cycle.

## Transitions

- Returns focus to [[40_GameViewer/Sandbox_KA/00_Global/map_karlsruhe_main|map_karlsruhe_main]].

## Validation

- Hint text must not block player input.
- Partner should reinforce next actionable node, not expose hidden outcomes.
