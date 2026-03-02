---
id: sys_combat_dialogue_duel
tags:
  - mechanic
  - system
---

# Combat: Dialogue Duels

Source of truth: `packages/shared/data/battle.ts`

## Resolve and AP Baseline

| Variable             | Default           | Notes                          |
| -------------------- | ----------------- | ------------------------------ |
| Player Resolve       | 25-30 by scenario | Loss condition at 0            |
| Opponent Resolve     | 20-35 by scenario | Win condition at 0             |
| AP per turn          | 3                 | Reset each player turn         |
| Cards drawn per turn | 2                 | From deck with discard recycle |

## Battle Card Catalog (Starter Set)

| Card ID                    | Group     | Cost | Core Effect                            |
| -------------------------- | --------- | ---- | -------------------------------------- |
| `card_logical_argument`    | intellect | 1    | Damage 4                               |
| `card_analyze_weakness`    | intellect | 2    | Damage 2 + Draw 1                      |
| `card_deduction`           | intellect | 3    | Damage 8 (logic scaling)               |
| `card_empathic_appeal`     | psyche    | 1    | Heal 3                                 |
| `card_gut_feeling`         | psyche    | 1    | Block 4                                |
| `card_read_intent`         | psyche    | 2    | Block 6 + Draw 1                       |
| `card_assertive_stance`    | social    | 1    | Damage 3 + Block 2                     |
| `card_silver_tongue`       | social    | 2    | Damage 5 (charisma scaling)            |
| `card_commanding_presence` | social    | 3    | Damage 6 + Block 3 (authority scaling) |
| `card_steady_nerves`       | physical  | 1    | Block 5                                |
| `card_relentless`          | physical  | 2    | Damage 4 + Gain AP 1                   |
| `card_misdirection`        | shadow    | 1    | Opponent discard 1                     |
| `card_veiled_threat`       | shadow    | 2    | Damage 6 (deception scaling)           |
| `card_appeal_to_tradition` | spirit    | 1    | Heal 2 + Block 3                       |
| `card_poetic_strike`       | spirit    | 2    | Damage 7 (gambling scaling)            |

## NPC Strategy Patterns

- **Suspicious Merchant** (`detective_skirmish`): low-cost pressure + occasional defense.
- **Heinrich Krebs** (`detective_boss_krebs`): social burst turns with shadow finisher windows.
- Pattern rule: expose enemy intent one turn ahead to preserve tactical planning.

## Balancing Heuristics

- 1 AP cards should define baseline tempo, not spike value.
- 3 AP cards should produce swing moments and be telegraphed by deck context.
- Resolve damage plus draw/AP gain in the same card must remain tightly constrained.
