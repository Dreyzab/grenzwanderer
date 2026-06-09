# Witch Volition and Veto Spec (Eleonora)

Design spec for Eleonora Hartmann's volition economy: how she holds her Façade,
suppresses the Blood Curse, and spends agency against her own nature. This
builds **on top of** existing systems — it adds almost no new state.

## Reading order / source of truth

This doc is a design layer. The authority for runtime behavior is:

- [`src/shared/game/witchRules.ts`](../src/shared/game/witchRules.ts) — curse pressure, tiers, blood absorption, alcohol, veil focus.
- [`data/innerVoiceContract.ts`](../data/innerVoiceContract.ts) — 8 `inner_*` factions, 24 `attr_*` skills, psyche axes, resonance.
- [`data/skillDefinitions.ts`](../data/skillDefinitions.ts) — `SKILL_IDS_BY_PATRON_VOICE`: which skills sit under which patron faction.
- [`docs/INNER_PARLIAMENT_CONSTITUTION.md`](./INNER_PARLIAMENT_CONSTITUTION.md) — the hard two-layer rule (methods vs motives).
- [`docs/WITCH_TABLETOP_DM_RULES.md`](./WITCH_TABLETOP_DM_RULES.md) — one-shot DM rules and Eleonora's start state.

If anything here contradicts the code, the code wins and this doc is stale.

## Design decision: no new "Volition" meter (Variant 2)

The internal-parliament source document proposed a dedicated **PFC Load / Voля**
reservoir (0–100) that holds two lids at once — the Façade and the thirst — and
funds every Veto. **We are not building that.**

Rationale:

- The _function_ of Volition already exists, split across two mechanics:
  - **Façade holding** is an `attr_composure` check. On success it raises curse
    pressure and stamps a fatigue flag — see the canon precedent in
    [`case01_canon_runtime.ts`](../scripts/data/case01_canon_runtime.ts#L4344-L4349)
    (`+20 witch_blood_curse_pressure` + `flag_witch_somatic_exhaustion`).
  - **Delayed cost of control** is already carried by `witch_alcohol_aftertaste`
    and `witch_blood_debt`.
- A second 0–100 meter parallel to `witch_blood_curse_pressure` would duplicate
  the same drive/brake loop and double the tuning surface.

So **Volition is a derived quantity, not a stored one**: "how expensive is it for
Eleonora to hold herself right now" = a function of current `pressure`. The
brake (PFC) getting more expensive as the drive (hunger) climbs is both cheaper
in code and truer to the Sapolsky framing the project is using as a lens.

One stored resource does fund the _dramatic_ exceptions: `resource_fate_token`.

## Voice skins: map onto the hierarchy, not a flat list

Eleonora's named voices are **skins over existing runtime ids**, and they split
across both constitutional layers. Do not put them in one list. Per
`SKILL_IDS_BY_PATRON_VOICE`, skills already have patron factions, so a skin must
target the correct layer.

| Eleonora voice                  | Layer            | Runtime id          | Patron faction  | Notes                                                            |
| ------------------------------- | ---------------- | ------------------- | --------------- | ---------------------------------------------------------------- |
| `[ФАСАД]`                       | method (skill)   | `attr_composure`    | `inner_leader`  | "хладнокровие и скрытие эмоций в стрессе" — literal Façade       |
| `[ГРАЦИЯ]`                      | method (skill)   | `attr_agility`      | `inner_adapter` | motor poise replaces animal reflexes                             |
| Veil Sight / эфирное чутьё      | method (skill)   | `attr_spirit`       | `inner_exile`   | occult thirst-sense; patron is "no one is coming, survive first" |
| `[МАКИАВЕЛЛИСТ]`                | motive (faction) | `inner_manipulator` | —               | homePoint `{x:40, y:-70, approach:70}` already sits here         |
| `[СНОБИЗМ]` / `[ЦИНИЗМ]`        | motive (faction) | `inner_cynic`       | —               | status scanner / devaluation defense                             |
| `[АВТОРИТЕТ]` / `[КРОВНЫЕ УЗЫ]` | motive (faction) | `inner_leader`      | —               | command + blood-loyalty share one patron                         |

**Thematic payoff (free from the data):** her mask (`attr_composure`), her
command (`attr_authority`), and her blood-loyalty all flow from one patron —
`inner_leader`. The voice that protects the House is the same source as the face
that hides the monster. Meanwhile her occult hunger-sense (`attr_spirit`) is
patronized by `inner_exile`. Author skins along these patron lines; never author
a check on an `inner_*` id or a dilemma on an `attr_*` id (Constitution §Hard
Boundaries).

## The volition economy

All deltas below bind to existing `witchRules.ts` functions unless marked **NEW**.

| Action                                                           | Cost / effect                                                                                       | Binding                                                                             |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Routine Façade hold under social pressure                        | `attr_composure` check; on success `+5…8 pressure`                                                  | extend existing pattern (light stake; the `+20` precedent is for high-stakes beats) |
| Hold Façade in a high-stakes beat                                | `attr_composure` check; success `+20 pressure` + `flag_*_somatic_exhaustion`                        | already authored (case01 L4344)                                                     |
| Suppress thirst near a Rift (green gaslight)                     | `+15 pressure` tick                                                                                 | `applySpiritualVeilFocus`                                                           |
| **Warm Veto** (non-instrumental mercy)                           | `−1 resource_volition_token`; does **not** touch pressure                                           | **NEW** var + authoring rule                                                        |
| **Restraining Veto** (kill a thirst surge at a catastrophe beat) | `−1 resource_volition_token` **or** `attr_composure` at high DC with a large `+pressure` on success | **NEW** var + authoring rule                                                        |
| Feeding (fast relief)                                            | `relief` + `bloodPower` now, `+bloodDebt`, step toward Tier 3                                       | `applyBloodAbsorption`                                                              |
| Alcohol/laudanum relief                                          | `−relief pressure`, `+alcoholAftertaste`                                                            | `applyAlcoholRelief`                                                                |
| Ritual tea in a Safe zone                                        | slow `−pressure`, **no** debt                                                                       | **NEW** `applyRitualRelief` (see below)                                             |

### Veto-token discipline — and why it must NOT reuse `resource_fate_token`

**The Veto spends its own resource, `resource_volition_token` — not
`resource_fate_token`.** This is a deliberate correction. `resource_fate_token`
is already claimed: [`WITCH_TABLETOP_DM_RULES.md`](./WITCH_TABLETOP_DM_RULES.md#L66-L72)
states fate "opens authorial DM intervention and can create session-canon
proposals," and is "separate from Providence, Fortune, and Karma." If the Veto
also drew from fate, three things break:

1. **The Warm Veto's signal leaks.** Its whole meaning is "greyed because she has
   spent her humanity." If the player burned fate on a DM intervention three
   scenes earlier, the Warm Veto greys for an unrelated reason — "кем она могла бы
   быть" becomes "кем она могла бы быть, если бы ты не купил услугу у рассказчика."
2. **Mercy competes with DM help.** Spending on kindness denies DM intervention
   and vice versa, turning an emotional choice into cold resource optimization —
   the opposite of intent.
3. **No regen + two consumers = dry-out.** Fate has no defined refill; one pool
   for two queues survives a one-shot but breaks a campaign.

`resource_volition_token` is **not** a fifth meter (it is not a 0–100 drive/brake
bar, which is what Variant 2 rejected). It is a discrete counter of discrete
will-acts, orthogonal to `pressure`. Discipline:

- **Only the two Vetoes spend `resource_volition_token`.** Routine Façade holding
  stays on `attr_composure` checks; `resource_fate_token` stays untouched for DM
  intervention.
- Starting value is seeded in `WITCH_ORIGIN_DEFAULTS` as **`resource_volition_token: 3`**
  (first-pass; **tuning flag** — raise for a longer campaign, keep low so each
  Veto is a felt choice). No regen within an arc until regen rules are defined.
- The **Warm Veto** is the only thing that proves she is still a person; it is
  the mechanical hook for any future redemption arc and should be visibly
  offered even when she "can't afford" it (greyed, showing who she could be).

> If a future decision insists on a single token, the correct move is the
> _inverse_ split: move DM intervention onto `resource_providence` and give fate
> entirely to Vetoes. Do **not** leave the two functions sharing one variable.

### Façade DC as a function of pressure

Façade difficulty should rise with hunger, so the spiral is self-tightening:

```
facadeDC(base, pressure) = base + floor(pressure / 20)
```

- `base` is the scene's social difficulty (e.g. 9 in a calm parlour, 13 under
  hostile scrutiny).
- At `pressure 35` (start) the modifier is `+1`; at `pressure 80` it is `+4`.
- This is the only "Volition meter" the player needs to feel — expressed through
  rising DC, not a separate bar.

Tuning constants (`20` divisor, `5…8` routine pressure gain) are first-pass and
belong in a single config block when implemented, not scattered in scenes.

### NEW: `applyRitualRelief`

The only honest discharge — slow, debt-free, Safe-zone only. Shape mirrors
`applyAlcoholRelief` but adds no aftertaste:

```ts
// proposed addition to witchRules.ts
export const applyRitualRelief = (
  state: WitchBloodCurseState,
  relief = 8,
): WitchRuleResult => {
  const normalized = normalizeWitchBloodCurseState(state);
  return {
    state: normalizeWitchBloodCurseState({
      ...normalized,
      pressure: normalized.pressure - Math.max(0, Math.trunc(relief)),
    }),
    overflow: "none",
  };
};
```

Smaller `relief` than alcohol (12) by design: the clean path is slower than the
tempting one. Safe-zone tags are already defined in the DM rules (Bureau,
tavern/lodging, train).

## Authoring the Vetoes (scene-contract convention)

Both Vetoes are authored as `VnChoice` entries. The contract already gives us
everything; the convention is which fields to use. Two gating fields matter and
they are **not** the same (see `vnContent.ts`):

- `visibleIfAll` / `visibleIfAny` → `isChoiceVisible`: whether the option appears.
- `requireAll` / `requireAny` → `isChoiceEnabled`: whether it is selectable;
  when false the option renders **visible but locked** (`isLocked`).

### Warm Veto — always visible, locked when unaffordable

The point of the Warm Veto is that the player _sees who she could be_ even when
she cannot pay. So gate it with `requireAll` (locks, not hides), never
`visibleIfAll`. Spend the token in `effects` via `add_var … -1`.

```ts
{
  id: "WITCH_<scene>_WARM_VETO",
  text: "Помочь без расчёта — просто потому, что он напуган.",
  nextNodeId: "scene_<...>_mercy",
  choiceType: "action",
  // requireAll → stays on screen, greys out at 0 tokens ("кем она могла бы быть")
  requireAll: [
    { type: "var_gte", key: "resource_volition_token", value: 1 },
  ],
  effects: [
    { type: "add_var", key: "resource_volition_token", value: -1 },
    // Warm Veto does NOT touch pressure; it drifts psyche toward altruism.
    // TUNING FLAG: +5 per Veto. At +8 ×~3 Vetoes the Machiavellian identity is
    // almost fully washed out; keep small so "cold aristocrat played humanely"
    // stays mechanically possible.
    { type: "change_psyche_axis", axis: "y", delta: 5 },
  ],
  innerVoiceHints: [
    { voiceId: "inner_manipulator", stance: "opposes",
      text: "Бесплатная доброта — это убыток. Что ты с этого получишь?" },
    { voiceId: "inner_guide", stance: "supports",
      text: "Ничего. И именно поэтому это всё ещё ты." },
  ],
}
```

### Restraining Veto — kill a thirst surge at a catastrophe beat

Two authorable forms. They are **not** interchangeable — choosing per scene by
gut feel makes the mechanic read as inconsistent. Rule:

- **Use (a) token form on plot-critical beats** where a failed roll would derail
  the story (a public exposure that ends the arc, a scene the player must pass).
  Guaranteed success, paid in the scarce humanity resource.
- **Use (b) composure form on routine beats** where a failure is survivable and
  interesting. It is free of tokens but gambles against the rising-pressure
  spiral.

**(a) Token form** — guaranteed, costs the scarce resource:

```ts
{
  id: "WITCH_<scene>_RESTRAIN_VETO",
  text: "Силой задавить Жажду — здесь нельзя сорваться.",
  nextNodeId: "scene_<...>_held",
  requireAll: [
    { type: "var_gte", key: "resource_volition_token", value: 1 },
  ],
  effects: [
    { type: "add_var", key: "resource_volition_token", value: -1 },
  ],
}
```

**(b) Composure form** — free of tokens, but a hard `attr_composure` check whose
success still raises pressure (the spiral). DC follows `facadeDifficulty`:

```ts
{
  id: "WITCH_<scene>_RESTRAIN_CHECK",
  text: "Сжать кулаки и удержать маску.",
  nextNodeId: "scene_<...>_held",
  skillCheck: {
    id: "check_<scene>_restrain",
    voiceId: "attr_composure",
    // base 13 (hostile scrutiny) → facadeDifficulty(13, pressure)
    difficulty: 17, // authored for the ~pressure-80 band; see DC note below
  },
  // onPass/onFail effects authored as in case01 L4344 (+pressure on success,
  // exposure flag on failure).
}
```

### Façade DC: one integration point

`VnSkillCheck.difficulty` is a static number in the contract — it does not read
`pressure` at runtime. So `facadeDifficulty(base, pressure)` lands in one of two
ways:

1. **Resolver hook (preferred, small):** when a check's `voiceId` is
   `attr_composure` in a witch scene, the skill-check resolver applies
   `facadeDifficulty(authoredDifficulty, currentPressure)` before rolling. Author
   writes the _base_ DC; the curse scales it. One change in the resolver, every
   Façade scene benefits.
2. **Pure-authoring fallback (no code):** author picks `difficulty` per pressure
   band and gates the variant with the `var_lte` / `var_gte` pressure conditions
   already in use (the Sasha split at L2802/2811 is exactly this pattern).

Use (1) if/when the resolver is touched; (2) works today with zero engine change.

## The irreversibility tail (Обращение) — one isolated seam

This is the only decision left open. The seam is built so the answer can change
later without touching the economy above.

### Reconciling with the "fail forward" rule

`WITCH_TABLETOP_DM_RULES.md` is explicit: the curse must fail forward and **never
ends the one-shot by itself**. Therefore:

- **Tabletop / DM mode:** Tier 3 overflow stays `hard_bargain_exposure_or_spirit_danger`.
  No terminal state. The curse creates debt, leverage, exposure — never a game
  over. Unchanged.
- **Authored campaign mode:** a terminal point-of-no-return MAY exist, but it is
  reached by **player choices**, not by the curse auto-firing. The distinction:
  the curse never kills you; your decisions can walk you somewhere the curse then
  makes irreversible.

### Resolved: branching outcomes, not a mode unlock

Обращение is **not** a separate unlockable "play as the vampire" mode. It is one
of several **path outcomes** reached by the player's accumulated choices. We are
not designing an unlock layer now.

Concretely:

- The tail is a set of **branching endings** gated on choice/state (how often she
  fed, whether she took Warm Vetoes, whether the Façade broke in public), not a
  toggle into a new game mode.
- Full Обращение is the darkest branch — a **terminal tragic end** in Case 01,
  the roguelike dead-end the project favours — but it sits alongside other
  outcomes (held the line, partial fall, exposed-and-hunted) on the same axis.
- Because it is just authored branching, no extra system is needed: the existing
  flags + `tier`/`pressure`/`bloodDebt` state are enough to gate which ending
  fires. No "mode" code, no rework of the economy or skins.

### Hieronymus hook

The Executor turns toward Eleonora's trail when the Masquerade is broken loudly.
Wire him to the existing Tier-3 overflow signal:

```
overflow === "hard_bargain_exposure_or_spirit_danger"
  → set flag_witch_executor_on_trail
  → (campaign) escalate toward the terminal seam
  → (tabletop) becomes a hard bargain / exposure scene, never a death
```

A public Façade collapse (failed `attr_composure` at high pressure in a crowded
scene) is the loud break that should raise this flag.

## What is reuse vs new code

**Reuse (no code change):** `applySpiritualVeilFocus`, `applyBloodAbsorption`,
`applyAlcoholRelief`, pressure/tier overflow, `SKILL_IDS_BY_PATRON_VOICE`,
psyche-axis resonance, the two-layer parser guards.

**New code (small, additive):**

1. `applyRitualRelief` in `witchRules.ts` (~10 lines).
2. A `facadeDC` helper + one config block of tuning constants.
3. Authoring conventions for the two Vetoes (`resource_volition_token` spend on
   choice options).
4. `flag_witch_executor_on_trail` + its wiring at Tier-3 overflow and on public
   Façade collapse.
5. Skin/presentation mapping table (above) wired into the voice-bridge so named
   Eleonora labels render over the canonical ids.
6. `resource_volition_token: 3` seeded in `WITCH_ORIGIN_DEFAULTS` (done). Promote
   to a shared origin default when Vetoes generalize beyond the witch.

**Unrelated contract-hygiene flag (backlog, not Veto work):** five origin flaws in
`originProfiles.ts` use `checkVoice: "volition"`, but `"volition"` is **not** in
`SKILL_VOICE_IDS` (the canonical ids are `attr_composure`, `attr_psyche`, …). It is
currently a free-string alias resolved loosely. Harmless today and orthogonal to
the Veto resource, but when skill-check voice ids are tightened to the typed set,
either add an explicit alias map or migrate these to an `attr_*` id. Tracked here so
it is not rediscovered as a "volition collision" later — it is not one.

## Decisions log

- **Volition meter:** not built. Volition is derived from `pressure` (Variant 2).
- **Voice handling:** named Eleonora voices are skins over canonical ids, split
  across the two constitutional layers (see skin table).
- **Обращение:** branching outcomes gated on player choice/state, **not** a mode
  unlock. Full Обращение is the terminal branch; designed as authored branching,
  no new system. Vampire-as-playable is explicitly out of scope for now.
- **Veto currency:** the two Vetoes spend a dedicated `resource_volition_token`,
  **not** `resource_fate_token` (which stays for DM intervention / session-canon).
  A discrete will-act counter, not a fifth meter. Seeded at 3 in
  `WITCH_ORIGIN_DEFAULTS`.
- **Veto-token naming — `volition`, not `humanity` (resolved, do not reopen):**
  the token funds _both_ Vetoes. The Warm Veto is mercy ("humanity"), but the
  Restraining Veto is cold self-control that crushes the Beast — zero warmth.
  `humanity` would semantically miscast the Restraining Veto; `volition` honestly
  covers both (mercy _and_ suppression are acts of will against one's own nature).
  No mechanical collision with the existing `checkVoice: "volition"` either: that
  is a _check-voice id_ (what you roll), `resource_volition_token` is a _resource
  var-key_ (what you spend) — different contract layers, no reducer/condition can
  confuse them. This is unlike the `fate_token` clash, which was one resource with
  two consumers. Keep the name.
- **Tuning flags:** Warm Veto psyche drift set to `y +5` (was +8); Restraining
  Veto form choice has a rule — (a) token on plot-critical beats, (b) composure on
  routine beats.

Nothing here blocks implementation of the economy, skins, Façade DC, Vetoes, or
ritual relief. The endings are authored content that reads existing state.
