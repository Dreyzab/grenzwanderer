# Neurochemical Parliament Architecture — Manifesto vs. Canon

This doc reconciles the "Neurobiological & Psychoanalytic Inner Parliament"
design manifesto against what actually exists in the codebase and the existing
design canon. It is a **triage map**, not a build order: every manifesto claim is
tagged so we know what is real, what was deliberately rejected, what is genuinely
new and worth doing, and what is written for the wrong setting.

Source of truth wins over this doc. Verified against (2026-06):

- [`src/features/character/originProfiles.ts`](../src/features/character/originProfiles.ts) — the 6 playable origins.
- [`data/innerVoiceContract.ts`](../data/innerVoiceContract.ts) — 8 `inner_*` factions, 24 `attr_*` skills, psyche axes, resonance.
- [`data/skillDefinitions.ts`](../data/skillDefinitions.ts) — `SKILL_IDS_BY_PATRON_VOICE`.
- [`src/shared/game/witchRules.ts`](../src/shared/game/witchRules.ts) — the one fully-built per-origin biochemical subsystem.
- [`docs/INNER_PARLIAMENT_CONSTITUTION.md`](./INNER_PARLIAMENT_CONSTITUTION.md) — the two-layer rule.
- [`docs/MORAL_STRESS_IDENTITY_FORMATION.md`](./MORAL_STRESS_IDENTITY_FORMATION.md) — the soft-stress policy.
- [`docs/WITCH_VOLITION_AND_VETO_SPEC.md`](./WITCH_VOLITION_AND_VETO_SPEC.md) — volition/Veto (Variant 2).
- [`docs/CHARACTER_CONCEPT.md`](./CHARACTER_CONCEPT.md) — character layers and roles.

## The biggest correction: one parliament, six origins, not three biochemistries

The manifesto frames three protagonists as **three fundamentally different
biochemical engines**. The code does something cheaper and stronger: **one shared
parliament**, differentiated per origin by data, not by separate systems. There
are **six** playable origins, not three.

| Origin (`id`) | Character                   | Stat emphasis           | Flaw (the "biochemical vulnerability") | Manifesto match            |
| ------------- | --------------------------- | ----------------------- | -------------------------------------- | -------------------------- |
| `detective`   | Matthias Adler, 27          | intellect, perception   | Cynical Mistrust                       | "Детектив"                 |
| `journalist`  | Arthur Vance, 32            | encyclopedia, deception | Gambling Addiction                     | (dopamine/maybe theme)     |
| `aristocrat`  | Charlotte von Waldstein, 25 | social, deception       | Claustrophobia                         | partial "Элеонора" surface |
| `veteran`     | Gustav Eisenhart, 40        | physical, perception    | **Alcoholism**                         | "Бывший Военный"           |
| `archivist`   | Martha Heller, 40           | intellect, encyclopedia | Obsessive Archivist                    | —                          |
| `witch`       | **Eleonora Hartmann**, 45   | spirit, perception      | **Blood Curse**                        | "Элеонора" (true)          |

Consequences for any manifesto work:

- **The "three biochemical algorithms" already exist** — as `statEffects` +
  `flaw` + `signature` + `tracks` + optional `parliamentPresetId` on a shared
  parliament. Differentiation is per-origin data, never a parallel engine. Do not
  build three systems.
- **The Veteran is real** (`veteran`, Gustav Eisenhart). His flaw is Alcoholism,
  not a PTSD lock; his signature is "danger clarifies him." The manifesto's
  Freudian Ид/Эго/Суперэго/Тень parliament is **not** built — at most it is an
  optional voice-skin over the shared parliament (like Eleonora's named voices),
  not a new structure.
- **Eleonora is both** a playable origin (`witch`) and an NPC in the Detective's
  Case 01 (`patron_arranger ▸ concealed_threat`, see CHARACTER_CONCEPT). The
  witch origin is "play as Eleonora."
- The **flaw system is the manifesto's neurochemical profile, already shipped**:
  each flaw has a `checkVoice`, `dc`, and `durationLabel`. Blood Curse is the only
  one expanded into a full subsystem (`witchRules.ts`); the others are single
  flaw hooks waiting for content.

## Manifesto → reality table

Status legend: ✅ already in code · ◐ partially exists · ❌ deliberately rejected
(reason given) · ✚ new, worth doing · ⚠ written for the wrong setting.

| Manifesto claim                                                                | Status | Where it lives / why                                                                                                                                       |
| ------------------------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Inner Parliament" of voices                                                   | ✅     | `innerVoiceContract.ts`: 8 `inner_*` + 24 `attr_*`, resonance-selected                                                                                     |
| Voices have neuro/philosophical basis & style                                  | ◐      | personas exist (`worldview`, `toneDescriptor`); neuro labels are flavor, not mechanics                                                                     |
| Two axes of worldview (Ego↔Altruism, Individ↔Collectiv)                        | ✅     | `psyche_axis_x`, `psyche_axis_y`, `psyche_approach`                                                                                                        |
| Named voices (`[ДОФАМИН]`, `[ФАСАД]`, `[ТЕНЬ]`…)                               | ◐      | as **skins** over canonical ids across the two layers, never a flat list — see Constitution + WITCH_VOLITION spec                                          |
| Dopamine / Serotonin / Cortisol / PFC dashboard                                | ◐      | no such vars exist; `moral_stress` + dialogue stress cover part — see Dashboard section                                                                    |
| PFC Load / Воля as a stored meter                                              | ❌     | Variant 2: volition is **derived** from pressure/flaw checks, not a 5th meter (WITCH_VOLITION spec)                                                        |
| Stress blocks/greys dialogue options ("amygdala hijack")                       | ❌→◐   | hard UI locks are **forbidden** (MORAL*STRESS: "no path blocked by moral identity"). Allowed only as \_soft*: flaw checks, rising DC, `requireAll` greying |
| Per-protagonist biochemical engine                                             | ✅     | one parliament + per-origin `statEffects`/`flaw`/`signature`/`tracks`                                                                                      |
| Blood Curse / vampirism subsystem                                              | ✅     | `witchRules.ts` (pressure, tiers, blood debt, alcohol, veil focus)                                                                                         |
| Veteran PTSD Freudian parliament (Ид/Эго/Суперэго/Тень)                        | ✚      | veteran origin exists; this specific parliament is an unbuilt optional skin                                                                                |
| Veto (act against the dominant voice)                                          | ✅     | built for Eleonora via `resource_volition_token` — kept separate from `resource_fate_token`/DM intervention (WITCH_VOLITION spec); generalizable           |
| Ritual/meditation in Safe zone restores control                                | ✅     | `applyRitualRelief` (witch); Safe-zone tags in DM rules                                                                                                    |
| Protocol Trinity `Card = Weapon + Artifact + Voice`                            | ✚/❌   | **not in code at all.** If built, Voice must key on a neuro **axis**, not a voice name — see below                                                         |
| Exact percentages in voice lines ("+23%")                                      | ◐      | allowed only as `[ЛОГИКА]`'s characteristic deformation; other voices stay qualitative (prior consult decision)                                            |
| Circadian rhythm modifies the dashboard                                        | ✚      | not built; low priority, no time-of-day system referenced                                                                                                  |
| FJR regiment, dosimeter (1970s), crypto-safe, "credits", AR-radar, ruined city | ⚠      | wrong setting — these are postapoc AI-boilerplate. Canon is **1900 Freiburg**; AR is a meta player-layer (phone scanning real city), not in-world tech     |

## The dashboard, mapped onto what exists

The manifesto's four 0–100 scales do not exist as named vars. Here is the honest
mapping; only one scale is clearly worth adding.

| Manifesto scale                               | Closest existing concept                                       | Verdict                                                                                    |
| --------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Cortisol** (acute stress, scene threat)     | dialogue/scene stress ("how hot is this exchange")             | ◐ exists conceptually; the "screen-edge glitch" UI is unbuilt flavor                       |
| **PFC Load** (self-control / Воля)            | derived from curse pressure + flaw composure checks            | ❌ as a meter — Variant 2 keeps it derived                                                 |
| **Serotonin** (status/hierarchy satisfaction) | no equivalent; closest is relationship/standing effects        | ✚ the one scale plausibly worth adding, and mainly for the aristocrat/witch status fantasy |
| **Dopamine** (wanting / 50% uncertainty)      | no equivalent; gated risk options already exist via conditions | ◐ a theme, not a meter; journalist's Gambling flaw is its local form                       |

Two stress concepts are already firewalled in canon and must not be merged into a
single "cortisol" bar (MORAL_STRESS §Stress Types Boundary):

- **Dialogue stress** = scene heat (scene system).
- **Moral stress** (`moral_stress` var) = contradiction with forming identity
  (character system), with soft thresholds 0–20 / 20–50 / 50–75 / 75+.

If a neurochemical dashboard is ever surfaced to the player, it should be a
**read-out of these existing signals**, not a new authoritative state layer.

## Determinism as lens, not cage (the manifesto's central risk)

The manifesto repeatedly wants stress to **remove** player choices ("options are
visually blocked in the UI"). Canon already decided against this:

- MORAL_STRESS: "no hard moral locks," "no path should be blocked because of moral
  identity."
- The shipped pattern is **soft**: the option stays visible and **greys** when
  unaffordable (`requireAll` → `isLocked`), difficulty **rises** with pressure
  (`facadeDifficulty`), and flaws trigger **checks**, not bans.

So "amygdala hijack" is authored as: the harder, truer option is still on screen,
but it costs a Veto / a hard check / a scarce token. The player always sees who
they could be. That is the project's determinism-as-lens stance; keep manifesto
content inside it.

## Protocol Trinity — if it is ever built

`Card = Weapon + Artifact + Voice` does not exist in code. The manifesto's own
examples expose the trap it must avoid: it names `[ЛОГИКА]`, `[МАКИАВЕЛЛИСТ]`,
`[ТЕНЬ]` — **different voices per protagonist**. If the card system keys on voice
_names_, it must be authored once per origin (≈6×).

The fix is to key the `Voice` component on a **neurochemical axis**, not a name,
so every origin's voices map onto a small shared set:

| Axis           | Maps from                                                        | Combat effect (manifesto intent)                 |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------ |
| dopamine-type  | risk/reward voices (gambling, dofamin skins)                     | crit / high-variance / risk cards                |
| serotonin-type | status/manipulation voices (`inner_manipulator`, snobbery skins) | psychological damage → enemy flees, no blood     |
| amygdala-type  | aggression voices (`attr_physical`, shadow skins)                | ×2 physical damage + DoT on own composure        |
| pfc-type       | executive voices (`attr_logic`, `attr_composure`)                | find structural weakness / suppress own variance |

The 8 `inner_*` and 24 `attr_*` ids each carry an axis tag; the card reads the
axis. This is the only design that keeps the combat layer from being written
three (or six) times. **Decision needed before any Trinity work, not now.**

## Scientific-accuracy stance

The manifesto's neuroscience is pop-simplified to the point of distortion
("serotonin = hierarchy," oxytocin as a clean in-group/out-group switch, "winning
aggression permanently lowers baseline serotonin"). For a **game-design metaphor
this is fine and intended** — the project uses Sapolsky as a lens, not a citation.
Authoring rule: lean on the _feel_ (drive vs. brake, status vs. survival, the
harder right thing) and never put a falsifiable neuro-claim in the player's mouth
as fact. `[ЛОГИКА]` may sound clinical; the narrator must not.

## What is safe to do next (if/when asked)

- **Per-origin modules** — the modular skin/emphasis/mode system that lets each of
  the six origins get its own parliament over the one shared engine is specced in
  [`PARLIAMENT_MODULES.md`](./PARLIAMENT_MODULES.md) (witch is the reference module).
- **Veteran voice-skin** — map Ид/Эго/Суперэго/Тень onto the shared parliament
  (like the Eleonora skin table), no new system. Veteran origin already exists.
- **Serotonin/status scale** — the one dashboard scale worth prototyping, scoped
  to aristocrat/witch.
- **Protocol Trinity axis abstraction** — only after the name-vs-axis decision.

Nothing in the manifesto requires a parallel engine. Everything it wants either
already exists, is a skin over the shared parliament, or is a deliberate
no (hard UI locks, a 5th stored meter).
