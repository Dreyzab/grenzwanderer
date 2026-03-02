---
id: node_start_game_new_investigation
aliases:
  - Node: Start Game - New Investigation
tags:
  - type/node
  - status/active
  - layer/ui
  - phase/start
---

# Node: Start Game - New Investigation

## Trigger Source

- Route: `/`
- UI element text: `New Investigation`
- Input type: `button click`
- React component: `HomePage`
- Code anchors:
  - `apps/web/src/pages/HomePage.tsx` (`handleNewGame`)
  - `apps/web/src/pages/HomePage.tsx` (`onClick={handleNewGame}`)
- DOM anchor:
  - `div#root > ... > button ...`
  - element: `<button ...>New Investigation</button>`
  - position snapshot: `top=574, left=54, width=277, height=48`

## Preconditions

- Required flags: none.
- Required evidence/items: none.
- Required quest stage: none.
- Fallback if missing requirements: keep player on HomePage and allow retry.

## Designer View

- Player intent: start a fresh run and commit to a new investigation.
- Narrative function: hard reset of previous timeline and re-entry into origin setup.
- Emotional tone: commitment, clean slate, risk acceptance.
- Stakes: all previous progress is deleted.

## Mechanics View

- Mechanics used:
  - confirmation dialog gate;
  - full progression reset;
  - scenario boot (`intro_char_creation`);
  - route transition to VN.
- Skill checks: none.
- Resources: all runtime progression state.
- Rewards: clean consistent start state.

## State Delta

- On confirm:
  - `useInventoryStore.resetAll()`
  - `useDossierStore.resetDossier()`
  - `useQuestStore.resetQuests()`
  - `useVNStore.endScenario()`
  - `useVNStore.startScenario('intro_char_creation')`
  - `navigate('/vn/intro_char_creation')`
- On cancel:
  - no state change.

## Transitions

- Confirm -> [[10_Narrative/Scenes/node_intro_char_creation|Intro Character Creation]]
- Cancel -> stay on `HomePage`

## Ownership

- Narrative: Intro/Origin track.
- Gameplay: Entry loop initialization.
- Related board: [[00_Map_Room/Gameplay_Story_Board|Gameplay Story Board]]

## Validation

- Test anchor:
  - click `New Investigation` -> confirm -> URL is `/vn/intro_char_creation`
  - stores are reset before scene starts
  - cancel keeps user on home without state mutation
- Done criteria:
  - node reproducible from UI and traceable to code + scenario id.

## Branch Diagram

```mermaid
graph TD
  A[HomePage] --> B{New Investigation}
  B -->|Cancel| A
  B -->|Confirm| C[Reset progression stores]
  C --> D[/vn/intro_char_creation]
  C -->|Error| E[Soft fail + retry]
```
