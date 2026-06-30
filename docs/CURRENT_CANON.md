# CURRENT CANON — Inner Parliament Identity Ledger

Status: `[MACHINE-ANCHORED / THIN HUMAN LEDGER]`  
Project: `grenzwanderer/Grenzwanderer`  
Operational detective era: **1900**. `1905` is a retcon candidate only and requires a separate ADR before it becomes runtime canon.

This document is intentionally thin. The machine-readable source of truth is:

- [`../data/currentCanon.ts`](../data/currentCanon.ts)
- guarded by [`../data/currentCanon.test.ts`](../data/currentCanon.test.ts)

If this prose conflicts with runtime registries, the code wins.

---

## 1. Voice-count resolution

The Inner Parliament count dispute is resolved as a derived runtime fact:

| Layer                            | Count | Source                                              | Meaning                                                                        |
| -------------------------------- | ----: | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Runtime skill voices             |    24 | `SKILL_VOICE_IDS`                                   | Full `attr_*` registry used by content, storage, checks, and patron influence. |
| Method display voices            |    18 | `SKILL_DEFINITIONS[*].progressionRole === "method"` | Player-facing method subset. This is the “18 method voices” layer.             |
| Compatibility / aggregate voices |     6 | `progressionRole === "compatibility"`               | Core/aggregate compatibility debt retained in the 24 runtime registry.         |
| Motive factions                  |     8 | `INNER_VOICE_IDS`                                   | `inner_*` motive parliament: why a choice is attractive or repulsive.          |

Rule: **do not migrate runtime from 24 to 18**. The 18 are derived from the 24.

---

## 2. Current machine contract

`CURRENT_CANON` derives:

- `runtimeSkillVoices` from `SKILL_VOICE_IDS`;
- `methodVoiceDisplayIds` from `SKILL_DEFINITIONS.progressionRole === "method"`;
- `compatibilityVoiceIds` from `progressionRole === "compatibility"`;
- `motiveFactions` from `INNER_VOICE_IDS`;
- `patronTriples` from `SKILL_IDS_BY_PATRON_VOICE`;
- `originPresets` from `PARLIAMENT_MODULES`;
- `era` as `{ value: 1900, status: "operational-canon", retconCandidate: 1905 }`.

The test asserts:

- 24 runtime skill voices;
- 18 method-display voices;
- 6 compatibility voices;
- 8 motive factions;
- every patron faction owns exactly 3 `attr_*` voices;
- patron triples cover all 24 runtime skill voices without duplicates;
- origin presets are derived from `PARLIAMENT_MODULES`;
- 1905 is not promoted without an ADR.

---

## 3. Layer policy

| Runtime prefix | Layer  | Question answered                                  | Canon rule                                                              |
| -------------- | ------ | -------------------------------------------------- | ----------------------------------------------------------------------- |
| `attr_*`       | Method | **How** can the character act?                     | Skill/check/progression layer. Never treat it as a motive speaker pool. |
| `inner_*`      | Motive | **Why** does the character want or resist the act? | Parliament/faction layer. Never mix it with `attr_*` speakers.          |

Patron mapping (`attr_* → inner_*`) is **influence/progression**, not identity merge. A skill may make a motive louder; it does not become that motive.

---

## 4. Transitional rows

Current transitional debt:

- The 6 `compatibility` `attr_*` voices remain in the runtime registry but should not be counted as the 18 method-display voices.
- `inner_analyst` remains the runtime id. A possible future rename to `inner_witness` is blocked by var migration and requires an ADR.
- Legacy voice aliases remain in `data/voiceBridge.ts`; orphan `checkVoice` mapping is a separate Phase 3 task, not solved by this ledger.

---

## 5. Explicit non-goals

This Phase 0 file does **not** implement:

- moral hard-lock migration (`visibleIf*` → locked-visible `requireAll` / enablement);
- origin `startingPsyche`;
- write-time clamp of psyche axes / inner ranks;
- D&D alignment removal from the player-facing psyche tab;
- `doctrines.axisShift` adoption effects;
- AI determinism contract expansion;
- neuro runtime fields.

Per the v2 consilium, neurobiology remains writer-bible / DM-substrate for now. Do not add `neuroAxis`, `brainSystem`, or `neuroDrive` runtime fields without a concrete player-facing consumer and a separate decision.
