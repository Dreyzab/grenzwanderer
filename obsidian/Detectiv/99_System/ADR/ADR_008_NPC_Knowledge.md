---
id: adr_008
date: 2026-06-21
status: accepted
---

# ADR_008_NPC_Knowledge

## Context

Dialogue must vary by what an NPC knows, per phase and per player action ("Sasha knows Eleonora's symptoms, not the curse"). Today this lives only as prose in `char_*.md` and is invisible to the engine, so lines cannot gate on it and drift goes uncaught.

## Decision

NPC Knowledge is **derived, not stored**. A Fact is an ID (clue-shaped Facts reuse Evidence `ev_*` IDs; a few social Facts get new IDs). `knows(npc, fact)` resolves an authored condition over existing primitives — phase + flags + vars — with no per-NPC×Fact storage and no automatic NPC→NPC propagation. The matrix is authored as a `knows:` block in `char_*.md` frontmatter and compiled by the existing `content-character-bridge` validator, which also lints lines against it under `--check`. Condition grammar is minimal — `always`, `never`, `phase >= <phase>`, `flag:<KEY>` — extended only when a scene needs more. Clue-shaped Facts reuse the `ev_*` Evidence namespace; non-clue atoms use `fact_*`. Leverage Facts carry a `stakeholders` list so threat/disposition effects fan out beyond the subject; entries are type-prefixed (`npc:`, `faction:`) over existing runtime ids and must resolve. A leverage Fact also names a `holder` — the party that can cash it — encoded on the holder's note as a `knows: … always` entry, so the matrix is the single source of "who holds this over whom."

## Consequences

Pros: zero new runtime storage; "different NPCs know different things per phase" falls out for free; one source of truth (the character doc); the bridge becomes a drift/consistency gate (an NPC can't say what it can't know). Cons: dynamic facts that cross NPCs must be hand-authored as flag effects; each gated node must be tagged with the Facts it uses.

## Alternatives Considered

A gossip/propagation engine (facts auto-spread along relationship links) was rejected for combinatorial QA surface and unpredictable knowledge leaks. Pure phase-static knowledge was rejected for ignoring player actions within a phase. A standalone `knowledge.json` was rejected for splitting Knowledge away from both canon prose and the conditions it depends on.

## Worked Example

`char_case01_sasha_hartmann_servant` (StoryDetective vault) is the first slice: four atoms (`fact_konigsberg_household`, `ev_sasha_russian_exile`, `ev_sasha_narodnaya_volya`, `ev_sasha_war_service`), all `always` for Sasha, none for the Player at start. `ev_sasha_narodnaya_volya` exercises `stakeholders: [npc:npc_sasha_hartmann_servant, faction:house_of_pledges]` and an unresolved holder — no in-world party can cash it yet (worldbuilding TODO).
