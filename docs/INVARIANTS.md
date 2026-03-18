# Design Invariants

Four architectural laws that must hold across all content, reducers, and AI contracts.

## Invariant 1: Deterministic Outcomes

All checks, item grants, flag mutations, quest transitions, and state deltas are computed server-side and reproduce identically for the same input state.

**Enforcement:**

- SpacetimeDB reducers are the only mutation path. Every transaction is atomic and totally ordered.
- `perform_skill_check` stores roll, voiceLevel, difficulty, passed, and breakdownJson — no re-roll, no client-side computation.
- `record_choice` validates conditions server-side before advancing nodeId.

**Violation examples:**

- Client-side dice roll influencing outcome → violates invariant.
- AI response setting a flag without going through a reducer → violates invariant.
- Content node with random outcome not seeded by `ctx.timestamp + ctx.sender + checkId` → violates invariant.

---

## Invariant 2: Fail-Forward (No Dead-Ends on Critical Path)

Every skill check failure, every denied choice, and every closed branch must leave the player with a forward path. Failure adds cost, delay, or risk — never a permanent wall.

**Enforcement:**

- Every `VnSkillCheck` must define both `onSuccess` and `onFail` branches (or the parent node must have an unconditional fallback choice).
- Content extraction CI (`content:drift:check`) should flag any terminal node reachable only through a single gated choice with no alternative.
- Tiered outcomes (`onSuccessWithCost`) formalize the "price of failure" as explicit effects rather than silent dead-ends.

**Violation examples:**

- Node with a single choice gated by `has_evidence` and no fallback → dead-end if evidence missed.
- Skill check with `onFail: {}` (empty object, no nextNodeId) on a non-terminal node with no other choices → soft dead-end.

---

## Invariant 3: Core / Presentation Separation

Every node has two layers: **what the system does** (state delta, conditions, transitions) and **how the player experiences it** (narrative text, AI commentary, voice tone). These layers are authored and validated independently.

**Enforcement:**

- Reducer logic (`vn.ts`, `map.ts`) never reads AI-generated text to make decisions.
- AI payloads (`GenerateDialoguePayload`, `SceneResultEnvelope`) receive only computed facts (outcome grade, breakdown, flags) — they never receive raw player input that could prompt-inject decisions.
- Content protocol requires both a "Mechanics View" (effects, conditions) and a "Designer View" (dramatic function, tone) for each node.
- Async AI output is additive: node logic must remain valid if AI responses are delayed, dropped, or empty.

**Violation examples:**

- Reducer parsing `responseJson` from AI to decide next nodeId → violates separation.
- Node whose only body text comes from AI generation with no static fallback → fragile presentation.

---

## Invariant 4: AI Without Agency

AI never applies effects, sets flags, advances quests, or mutates any server table. AI may suggest (`suggestedEffects`), but application requires explicit reducer logic or designer confirmation.

**Enforcement:**

- `deliver_thought` reducer accepts responses only from allowlisted worker identities.
- `SuggestedEffect` types are limited to `mood_shift | trust_delta | clue_hint | hypothesis_focus` — none of which auto-apply to game state.
- AI request queue (`aiRequest` table) stores responses as opaque JSON; client renders them but never calls reducers based on AI content.
- MindPalace explicitly excludes AI-thought generation from its responsibility boundary.

**Violation examples:**

- Worker calling `upsertFlag` based on LLM output → AI has agency over state.
- Client auto-applying `suggestedEffects[].trust_delta` to `playerRelationship` without user/system gate → excessive autonomy.
- Prompt allowing LLM to output `"action": "grant_evidence"` in a format the client would parse and execute → prompt injection risk.

---

## Compliance Checklist (PR Gate)

Before merging any PR that touches reducers, content nodes, or AI contracts:

- [ ] Does every new skill check have both success and failure paths?
- [ ] Are all state mutations inside reducers (no client-side flag writes)?
- [ ] Does the AI contract receive only computed facts, never raw user input?
- [ ] Are `suggestedEffects` treated as display-only on the client?
- [ ] Does the content node have a static fallback if AI is unavailable?
- [ ] Does `bun run test` pass?
- [ ] Does `bun run content:drift:check` pass?
