---
id: narrative_gameplay_checklist
tags:
  - type/checklist
  - status/stable
  - domain/narrative
  - domain/game_design
aliases:
  - Narrative Gameplay Checklist
---

# Narrative + Gameplay Checklist

Use this before implementation and before final merge of any node chain.

## 1) Node Contract Completeness

- [ ] Node has all mandatory sections from `Narrative_Gameplay_Protocol`.
- [ ] `Preconditions` are explicit (`none` used where needed).
- [ ] `Mechanics View` includes player verb and mechanic type.
- [ ] `State Delta` is written by category, not as generic text.
- [ ] `Transitions` are explicit and point to real nodes/endpoints.

## 2) Branch and Recovery Safety

- [ ] No mandatory dead-end without recovery.
- [ ] At least one path preserves forward momentum after failure.
- [ ] Cancel/exit behavior is defined where applicable.
- [ ] Critical path is reachable without hidden assumptions.

## 3) Narrative Quality Gates

- [ ] Node has clear dramatic function (setup/complication/reveal/decision/consequence).
- [ ] Node delivers new information, pressure, or consequence.
- [ ] Emotional tone is intentional and consistent with previous node.
- [ ] Stakes are visible to the player (not only internal design note).

## 4) Gameplay Quality Gates

- [ ] Checks use canonical voice ids only.
- [ ] Difficulty and outcomes are defined for each check.
- [ ] Rewards/costs are tied to player action.
- [ ] Loop mapping is clear (investigation/social/conflict/exploration/economy/meta).

## 5) Data and Code Sync

- [ ] Code anchors exist and resolve to real files/functions.
- [ ] Test anchor exists (manual or automated).
- [ ] Runtime behavior and note intent are synchronized.
- [ ] Board note (`Gameplay_Story_Board`) includes updated chain links.

## 6) Global Consistency

- [ ] `Narrative_Consistency_Checklist` also passes.
- [ ] Naming/IDs follow project conventions.
- [ ] No duplicate markdown basename (except `READ_ME.md` policy exception).
- [ ] No duplicate frontmatter `id`.
