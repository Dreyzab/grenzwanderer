# Parliament Modules — one engine, six origins

This doc specifies how the Inner Parliament becomes **modular per origin** without
forking the engine. It answers one question: _"There are six origins — how does
each get its own parliament without writing six parliaments?"_

The answer is already half-built in the code. A **module** is a per-origin
**data pack** (emphasis + skins + modes + hidden voice + doctrines) that rides on
top of the single shared engine. No origin gets a parallel system.

Source of truth wins over this doc. Verified against (2026-06):

- [`src/features/character/originProfiles.ts`](../src/features/character/originProfiles.ts) — 6 origins; `parliamentPresetId` + `getParliamentPresetForOrigin`.
- [`data/innerVoiceContract.ts`](../data/innerVoiceContract.ts) — 8 `inner_*`, 24 `attr_*`, psyche axes, `hasMixedSpeakerPool`.
- [`data/skillDefinitions.ts`](../data/skillDefinitions.ts) — `SKILL_IDS_BY_PATRON_VOICE` (the real patron map; **authority for which patron owns which skill**).
- [`data/voiceBridge.ts`](../data/voiceBridge.ts) — per-voice persona/prompt profiles (`CanonicalVoicePromptProfile`). **This is the layer a module overrides.**
- [`src/features/vn/voicePresentation.ts`](../src/features/vn/voicePresentation.ts) — `getVoicePresentation`, currently origin-blind.
- [`docs/INNER_PARLIAMENT_CONSTITUTION.md`](./INNER_PARLIAMENT_CONSTITUTION.md) — the two-layer rule (methods vs motives).
- [`docs/WITCH_VOLITION_AND_VETO_SPEC.md`](./WITCH_VOLITION_AND_VETO_SPEC.md) — Eleonora's volition economy; the first (informal) module.
- [`docs/NEUROCHEMICAL_PARLIAMENT_ARCHITECTURE.md`](./NEUROCHEMICAL_PARLIAMENT_ARCHITECTURE.md) — "one parliament, six origins, not three biochemistries."

## What is already modular (do not rebuild it)

| Modular hook                                 | Where                                                                                                                   | State                                                                                   |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Per-origin preset id                         | `parliamentPresetId` on tracks; `getParliamentPresetForOrigin(profile, track) → track.parliamentPresetId ?? profile.id` | ✅ resolver exists; only `journalist_cityroom` is set, **no preset content exists yet** |
| Per-origin stats / flaw / signature / tracks | `originProfiles.ts` (`statEffects`, `flaw`, `signature`, `tracks`)                                                      | ✅ all six filled                                                                       |
| Per-origin starting loudness                 | `statEffects` seed `attr_*` xp; `ORIGIN_TALKER_DEFAULT_RANK_BY_ID`                                                      | ◐ partial — no `inner_*` emphasis seeding yet                                           |
| Shared influence engine                      | `resolvePatronVoiceInfluence` / `rankPatronVoicesByInfluence`                                                           | ✅ origin-agnostic, **keep it that way**                                                |
| Voice persona layer                          | `voiceBridge.ts` `CANONICAL_VOICE_PROMPT_PROFILES` (3 of 24 filled) + `voicePresentation.ts`                            | ◐ exists, but **origin-blind** — same persona for everyone                              |

The single missing piece is the **per-origin persona/skin layer**: today
`attr_composure` always renders as "Composure," for every origin. A module makes
it render as **`[ФАСАД]`** with Eleonora's motto/blind-spot when the witch preset
is active, while staying "Composure" for the detective.

## What a module IS — and is NOT

A `ParliamentModule` is a **presentation + emphasis + authoring pack**, keyed by
`presetId`. It contains five things and only these:

1. **emphasis** — which `inner_*` factions start loud (seeds `inner_voice_rank_*`).
2. **skins** — named labels + persona overrides over canonical `attr_*` / `inner_*`
   ids, **split by the two constitutional layers**.
3. **modes** — derived-state overlays (e.g. `[НАБАТ]`, `[ИСТОЩЕНИЕ]`), computed
   from existing meters; **not voices**.
4. **hiddenVoice** — the `concealed_threat` reveal (e.g. `[СТЫД]`), gated by flags.
5. **doctrines** — belief-layer entries that drift psyche axes / bias resonance.

A module is **NOT**:

- ❌ a parallel engine — the influence math, two-layer parser, and psyche
  resonance are shared and untouched.
- ❌ a flat list of voices — skins MUST be split into `methodSkins` (over `attr_*`)
  and `motiveSkins` (over `inner_*`); a mixed pool is rejected by
  `hasMixedSpeakerPool`.
- ❌ a new stored meter — modes are **derived** (Variant 2). No fifth bar.
- ❌ new VN-snapshot schema — modules extend `voiceBridge` (a design/presentation
  data file), never the parser whitelist or `NpcRuntimeIdentity`
  (CHARACTER_CONCEPT §Boundaries).

## Proposed shape (design-level; lives in `data/parliamentModules.ts`)

This extends the existing persona layer. It is additive data, not engine code.

```ts
interface ParliamentModule {
  presetId: string; // === getParliamentPresetForOrigin(...)
  emphasis: Partial<Record<InnerVoiceId, number>>; // seeds inner_voice_rank_* at origin select
  methodSkins: VoiceSkin[]; // targetId ∈ SKILL_VOICE_IDS  (attr_*)
  motiveSkins: VoiceSkin[]; // targetId ∈ INNER_VOICE_IDS  (inner_*)
  modes: ParliamentMode[]; // derived overlays, NOT speakers
  hiddenVoice?: HiddenVoice; // concealed_threat reveal
  doctrines?: Doctrine[]; // belief layer over psyche axes
}

interface VoiceSkin {
  label: string; // "[ФАСАД]"
  targetId: SkillVoiceId | InnerVoiceId; // a REAL canonical id
  persona?: Partial<CanonicalVoicePromptProfile>; // overrides voiceBridge profile for this preset
  cost: string; // the "useful but costly" tax (author note)
}

interface ParliamentMode {
  label: string; // "[НАБАТ]"
  derivedFrom: string; // e.g. "witch_blood_curse_pressure >= 60"
  distorts: string; // how it recolors the motive layer
  prose: string; // writing-style shift (syntax, length)
}

interface HiddenVoice {
  label: string; // "[СТЫД]"
  sourceRole: "concealed_threat";
  revealTriggers: string[]; // flags/conditions that surface it
}

interface Doctrine {
  title: string; // "Фамилия дороже правды"
  axisShift: { axis: "x" | "y" | "approach"; delta: number };
  amplifies: InnerVoiceId;
  mutes: InnerVoiceId;
}
```

Lookup is `modulesByPresetId[getParliamentPresetForOrigin(profile, track)]`, with
fallback to a **base module** (no skins, canonical labels) when a preset has none.

## Authoring invariants (the module contract)

1. **Two-layer purity.** `methodSkins.targetId` must be in `SKILL_VOICE_IDS`;
   `motiveSkins.targetId` must be in `INNER_VOICE_IDS`. A skin never crosses.
2. **Real ids only.** Every `targetId` must already exist. A skin is a _label over_
   a voice, never a new voice. (Lint: assert each `targetId` resolves.)
3. **Patron honesty.** A method skin should respect its patron in
   `SKILL_IDS_BY_PATRON_VOICE`. `attr_composure` is patroned by `inner_leader`;
   skinning it as `[ФАСАД]` is consistent because the witch's `inner_leader`
   (House/command/face) is the loud faction. Don't skin a method whose patron the
   module never emphasizes — it will read as noise.
4. **Modes are derived, never stored.** A `ParliamentMode.derivedFrom` references an
   existing meter (`witch_blood_curse_pressure`, `moral_stress`, a flaw flag) — it
   must not introduce a new 0–100 bar.
5. **No hard locks.** A mode may raise DC, bias resonance, or recolor prose; it may
   not remove a choice (MORAL_STRESS: "no path blocked by identity").
6. **Hidden voice is earned.** `hiddenVoice` never appears at first meeting; it is
   gated by a real progression flag (CHARACTER_CONCEPT §Layer 5).
7. **One emphasis, not all loud.** `emphasis` should make **1–2** factions loud, not
   five. The whole point is hierarchy, not seven dominants.

## Reference module — `witch` (Eleonora Hartmann)

The fullest module; it absorbs the existing WITCH*VOLITION skin table and the
"social palace" architecture. Public role `patron_arranger`; hidden
`concealed_threat`. (Aristocratic in \_manner*; `witch` by origin — the playable
`aristocrat` is Charlotte von Waldstein.)

Final character bible: [`ELEONORA_PARLIAMENT_BIBLE.md`](./ELEONORA_PARLIAMENT_BIBLE.md)
(roster rationale, voice attention types, sample lines, Thirst-as-mechanic, Lotte arcs).

**emphasis:** `inner_leader` loud (`[ТРАДИЦИЯ]` — House + rank + command share this
patron), `inner_cynic` second (`[СУВЕРЕННОСТЬ]` — dignity/autonomy). `inner_exile`
simmering (`[ЧАРЫ]` — glamour; the Thirst itself stays a meter, see modes).

**methodSkins** (over `attr_*` — "can she, and how?"):

| label        | targetId         | patron          | cost                                                                                                                            |
| ------------ | ---------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `[ФАСАД]`    | `attr_composure` | `inner_leader`  | success raises `witch_blood_curse_pressure`; sets `flag_witch_somatic_exhaustion` → next Façade DC higher                       |
| `[ЭСТЕТИКА]` | `attr_poetics`   | `inner_hermit`  | the in-character voice of `applyRitualRelief`: slow `−pressure`, no debt — clean but slow, breeds dependence on sterile control |
| `[ГРАЦИЯ]`   | `attr_agility`   | `inner_adapter` | motor poise; cost is brittleness when poise is all that's left                                                                  |
| Veil-Sight   | `attr_spirit`    | `inner_exile`   | occult thirst-sense; reading the veil tightens the hunger                                                                       |

**motiveSkins** (over `inner_*` — "why, and who takes the wheel?"):

| label            | targetId            | cost                                                                                                                                                                        |
| ---------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[ТРАДИЦИЯ]`     | `inner_leader`      | merges `[ДОМ]` + `[ИЕРАРХИЯ]`: dynastic loyalty + status/rank radar; reads people as ranks and obligations; mistakes the inherited order for moral law                      |
| `[НЕЖНОСТЬ]`     | `inner_guide`       | sees pain, fear and unfreedom (sharpest with women, children, the defenseless); dissolves boundaries, rescues the unasked                                                   |
| `[СУВЕРЕННОСТЬ]` | `inner_cynic`       | guards dignity, autonomy, the right to refuse; reads help as a leash, compromise as surrender                                                                               |
| `[СТРАТЕГ]`      | `inner_manipulator` | leverage accounting (was `[МАКИАВЕЛЛИСТ]`, homePoint `{40,-70,70}`); erodes the capacity to trust                                                                           |
| `[ЧАРЫ]`         | `inner_exile`       | magnetism + witch-glamour as an outward instrument (command / kindle / scorch with one look); intoxicated by her own effect, reads desire as permission                     |
| `[СТЫД]`         | `inner_hermit`      | hidden until reveal (see hiddenVoice); three registers — social "unseemly", moral "you caused harm", monstrous "look what you wanted"; swaps responsibility for self-hatred |

**modes** (derived overlays — NOT voices):

| label           | derivedFrom                                      | distorts                                                                                                                                                                                                                         | prose                                                          |
| --------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `[НАБАТ]`       | `witch_blood_curse_pressure` high                | motives read the room as betrayal: `[ТРАДИЦИЯ]` sees an assault on the House in a critique, `[СУВЕРЕННОСТЬ]` a leash in an offer of help, `[СТРАТЕГ]` a plot in a trade, `[ЧАРЫ]` an invitation to overwhelm                     | syntax shortens, sharpens, assumes the worst case              |
| `[ИСТОЩЕНИЕ]`   | `flag_witch_somatic_exhaustion` + pressure       | degrades Façade _quality_: less fine diplomacy, more edge; `facadeDC` rises                                                                                                                                                      | sentences heavy, musicless, rarer, meaner                      |
| `[ГОЛОС ЖАЖДЫ]` | `witch_blood_curse_pressure` at maximum / Tier 3 | the Thirst is a VtM-Coteries-style **meter** (colored options + compulsions), never a seated voice; at the cap it briefly breaks into the parliament _through_ `[ЧАРЫ]` — short bodily imperatives crowd out the velvet register | single-clause commands; senses narrow to pulse, warmth, throat |

**hiddenVoice:**

```
[СТЫД] — sourceRole: concealed_threat
revealTriggers:
  - first significant harm she caused and rationalized (any register)
  - failed attr_composure at high pressure in a crowded scene (the loud Masquerade break)
  - accumulated feedings / step toward Tier 3
"Ты назвала это защитой. Назови теперь, чего это стоило ей — и кто платил."
```

**doctrines** (belief layer; each is a flag that drifts a psyche axis + biases resonance):

| title                              | axisShift   | amplifies                     | mutes               |
| ---------------------------------- | ----------- | ----------------------------- | ------------------- |
| Положение обязывает                | x +6        | `inner_leader` (ТРАДИЦИЯ)     | `inner_manipulator` |
| Фамилия дороже правды              | x +8        | `inner_leader` (ТРАДИЦИЯ)     | `inner_hermit`      |
| Никто не имеет права владеть мной  | x −7        | `inner_cynic` (СУВЕРЕННОСТЬ)  | `inner_leader`      |
| Помощь не создаёт долга            | y +6        | `inner_guide` (НЕЖНОСТЬ)      | `inner_cynic`       |
| Любовь не даёт права распоряжаться | y +7        | `inner_guide` (НЕЖНОСТЬ)      | `inner_leader`      |
| Правда — роскошь безопасных        | y −6        | `inner_manipulator` (СТРАТЕГ) | `inner_hermit`      |
| Вред требует ответа, не кары       | approach +6 | `inner_hermit` (СТЫД)         | `inner_exile`       |

> The Warm Veto already does `change_psyche_axis y +5` — the belief layer is _partly
> live_. Doctrines are the authored, named version of the same mechanic.

## The other five modules (slots, grounded in `originProfiles`)

Each origin's **flaw is its mode seed**, its **stat emphasis its loud factions**,
its **signature the gift the loud voices give**. Fill order = roster priority.

| Origin                   | emphasis (loud `inner_*`)             | signature method skin (example)                                                                           | mode (from flaw)                                                                                                                             | hidden voice (`concealed_threat`-style)                                                                                                                              |
| ------------------------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `detective` (Matthias)   | `inner_analyst` + `inner_cynic`       | `[ЛОГИКА]` over `attr_logic`                                                                              | **`[НЕДОВЕРИЕ]`** from `flaw_cynic_mistrust` (paranoia colors perception; costs time, alienates witnesses)                                   | the loneliness the cynicism is built to avoid feeling                                                                                                                |
| `journalist` (Arthur)    | `inner_manipulator` + `inner_analyst` | `[НЮХ]` over `attr_encyclopedia`                                                                          | **`[АЗАРТ]`** from `flaw_gambling_addiction` (the chase-surge; the dopamine "wanting" theme, instant) — preset `journalist_cityroom`         | the wreckage each bet leaves behind, never counted                                                                                                                   |
| `aristocrat` (Charlotte) | `inner_guide` + `inner_manipulator`   | shares the **social-palace skins** (`[ИЕРАРХИЯ]`, `[СТРАТЕГ]`, `[ЭСТЕТИКА]`) as a _non-supernatural_ skin | **`[КЛЕТКА]`** from `flaw_prideful_etiquette`/claustrophobia (composure collapse in tight space)                                             | being owned by the family name she performs                                                                                                                          |
| `veteran` (Gustav)       | `inner_cynic` + `inner_leader`        | `[ИНСТИНКТ]` over `attr_perception` (danger clarifies him)                                                | **`[БУТЫЛКА]`** from `flaw_battle_scar_trigger`/alcoholism (fast relief, slow cumulative cost — direct parallel to the witch's alcohol loop) | the men he could not carry out; survivor's silence. _The Freudian Ид/Эго/Суперэго/Тень skin set lives here — realized as [УСТАВ]/[ОПЕРАТИВНИК]/[ВЫЖИВАЛЬЩИК]/[ТЕНЬ]_ |
| `archivist` (Martha)     | `inner_analyst` (heavily)             | `[ИНДЕКС]` over `attr_encyclopedia`                                                                       | **`[КОМПУЛЬСИЯ]`** from `flaw_obsessive_archivist` (the missing-document emergency overrides danger/urgency)                                 | what she files in order not to feel                                                                                                                                  |

The **aristocrat ↔ witch** overlap is deliberate reuse, not duplication: the
"social palace" skins (`[СТРАТЕГ]`, `[ЭСТЕТИКА]`, `[ФАСАД]`) are authored once and
referenced by both presets — Charlotte runs them _clean_ and keeps a standalone
`[ИЕРАРХИЯ]`, while Eleonora folds rank-reading into `[ТРАДИЦИЯ]` and runs the set
with `[НАБАТ]`/`[СТЫД]`/Blood-Curse underneath.

## Full module definitions

Each module below is filled to the witch's depth. Patron ids are taken from the
real `SKILL_IDS_BY_PATRON_VOICE`. Doctrine axes: `x` = Individualism `−` ↔
Collectivism `+`; `y` = Egoism/Machiavellian `−` ↔ Altruism `+`; `approach` =
Reactive `−` ↔ Proactive `+`.

### `detective` — Matthias Adler, 27

Stats `attr_intellect +3 / attr_perception +4 / attr_empathy +1`; flaw Cynical
Mistrust (`checkVoice: empathy`, dc 9, _Until Reassured_); signature Crime Scene
Reconstruction. Player-anchor: the hidden voice is a **self-revelation**, not an
NPC unmask.

Character bible: [`ELIAS_PARLIAMENT_BIBLE.md`](./ELIAS_PARLIAMENT_BIBLE.md).
Archetype: the unconventional analyst (Sherlock / L / Mentalist), **not** a
burned-out noir wreck — his cynicism is _triggered_, not constant. This is the
**mechanics-forward** origin: the richest method layer of any preset, a thin
motive layer above it.

**emphasis:** `inner_analyst` loud (`[МЕТОД]` — the puzzle is the reward),
`inner_cynic` second (`[СКЕПСИС]` — a triggered lie-radar). Counter-faction kept
quiet but present: `inner_hermit` (`[СВИДЕТЕЛЬ]`).

**methodSkins** (over `attr_*` — six, the widest toolkit):

| label             | targetId            | patron          | cost                                                                                               |
| ----------------- | ------------------- | --------------- | -------------------------------------------------------------------------------------------------- |
| `[ЛОГИКА]`        | `attr_logic`        | `inner_analyst` | overfits to one line; underweights the human angle                                                 |
| `[ЭНЦИКЛОПЕДИЯ]`  | `attr_encyclopedia` | `inner_analyst` | knows the regiment, the year, the caliber — not what any of it felt like                           |
| `[ВЗГЛЯД]`        | `attr_perception`   | `inner_cynic`   | sees the tell _and_ the insult — reads malice into noise                                           |
| `[РЕКОНСТРУКЦИЯ]` | `attr_forensics`    | `inner_cynic`   | in-character voice of the signature ability; replays violence so vividly the player lives it twice |
| `[ИНТУИЦИЯ]`      | `attr_intuition`    | `inner_guide`   | insight without evidence; the bridge `[ИЗНАНКА]` enters by — cannot show its work                  |
| `[ЭМПАТИЯ]`       | `attr_empathy`      | `inner_guide`   | the skill his flaw fights; using it costs his guard                                                |

**motiveSkins** (over `inner_*`):

| label                   | targetId            | cost                                                                                                                                                      |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[МЕТОД]`               | `inner_analyst`     | was `[АНАЛИТИК]`; the unsolved is unbearable, the work is the reward; people become variables, boredom is a wound                                         |
| `[СКЕПСИС]`             | `inner_cynic`       | was `[ЦИНИК]`; **situational** — fires on smooth first answers, appeals to authority/sentiment, institutions covering their own; spends rapport he needed |
| `[ПРОВОКАТОР]`          | `inner_manipulator` | Mentalist-style staged experiments; the reaction is the evidence; wins the read, loses the room                                                           |
| `[ИЗНАНКА]`             | `inner_exile`       | the Occult Sleuth pull as a full voice; hears what evidence cannot say; erodes the provable ground — argues with `[МЕТОД]` over what counts as real       |
| `[СВИДЕТЕЛЬ]` (counter) | `inner_hermit`      | conscience; slow, unprofitable, keeps him honest and alone                                                                                                |

**modes:**

| label         | derivedFrom                                                                | distorts                                                                                                                                                                             | prose                                                             |
| ------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `[НЕДОВЕРИЕ]` | `flaw_cynic_mistrust` flag + recent failed `attr_empathy`                  | `[СКЕПСИС]` locks into trigger-state: every answer reads as a first lie; `[ВЗГЛЯД]` hunts deceit in cooperation; `[ПРОВОКАТОР]` escalates tests on people who already told the truth | clipped, interrogative, accusatory tempo                          |
| `[ТУННЕЛЬ]`   | unresolved case contradiction (authored beat flag) + rising `moral_stress` | the contradiction outranks danger, meals and people: `[МЕТОД]` speaks first and refuses to yield the floor; `[ЭМПАТИЯ]` DCs rise                                                     | accelerating clause-chains, deaf to interruption                  |
| `[ШТИЛЬ]`     | no open case thread / all leads closed                                     | boredom as threat: `[ПРОВОКАТОР]` experiments on bystanders, `[ИЗНАНКА]` gets louder in the silence, risk options light up                                                           | long listless sentences that snap awake at the hint of an anomaly |

**hiddenVoice:**

```
[ОДИНОЧЕСТВО] — sourceRole: concealed_threat (self-revelation)
revealTriggers:
  - a witness alienated by mistrust who was telling the truth
  - a case closed correctly but alone, no one left to tell
  - a person who tried to know him, filed under "solved"
"The footprint you kept finding was always your own, walking back out."
```

**doctrines:**

| title                                         | axisShift   | amplifies                        | mutes           |
| --------------------------------------------- | ----------- | -------------------------------- | --------------- |
| Каждая ложь оставляет след                    | approach +6 | `inner_analyst`                  | `inner_guide`   |
| Доверие — улика против тебя                   | x −8        | `inner_cynic`                    | `inner_guide`   |
| Правда стоит того, чтобы остаться одному      | y +6        | `inner_hermit`                   | `inner_cynic`   |
| То, чего нельзя доказать, тоже оставляет след | approach −5 | `inner_exile` (ИЗНАНКА)          | `inner_analyst` |
| Призрак — это улика, которую ещё не прочли    | approach +5 | `inner_analyst` (МЕТОД)          | `inner_exile`   |
| Люди — переменные в эксперименте              | y −7        | `inner_manipulator` (ПРОВОКАТОР) | `inner_hermit`  |

### `journalist` — Arthur Vance, 32

Stats `attr_encyclopedia +4 / attr_perception +3 / attr_deception +2`; flaw
Gambling Addiction (`checkVoice: volition`, dc 10, _Instant_); signature Nose for a
Story. Preset id `journalist_cityroom` (already wired on the Whistleblower track).

**emphasis:** `inner_manipulator` loud (charisma/deception/shadow — pressure
through publication), `inner_analyst` second (the buried lore thread).

**methodSkins:**

| label      | targetId            | patron              | cost                                            |
| ---------- | ------------------- | ------------------- | ----------------------------------------------- |
| `[НЮХ]`    | `attr_encyclopedia` | `inner_analyst`     | sees the story before the harm; files it anyway |
| `[ПЕРО]`   | `attr_deception`    | `inner_manipulator` | the angle that lands is rarely the fair one     |
| `[ВЗГЛЯД]` | `attr_perception`   | `inner_cynic`       | spots the mark; treats people as leads          |

**motiveSkins:**

| label              | targetId            | cost                                                  |
| ------------------ | ------------------- | ----------------------------------------------------- |
| `[ОХОТНИК]`        | `inner_manipulator` | turns sources into tools before they speak            |
| `[ПРИСПОСОБЛЕНЕЦ]` | `inner_adapter`     | rides the winning current; last on a collapsing story |

**modes:**

| label     | derivedFrom                                              | distorts                                                                                    | prose                                                       |
| --------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `[АЗАРТ]` | `flaw_gambling_addiction` surge (the dopamine "wanting") | high-variance options light up; the safe read greys in his own head before the room is read | fast, percussive, betting cadence ("one more, the big one") |

**hiddenVoice:**

```
[СЧЁТ] — sourceRole: concealed_threat (self-revelation)
revealTriggers:
  - a source burned by a published lead
  - a bet (literal or narrative) that cost someone who trusted him
"You always counted the scoop. Tonight, count what it stood on."
```

**doctrines:**

| title                         | axisShift   | amplifies           | mutes           |
| ----------------------------- | ----------- | ------------------- | --------------- |
| Город красиво лжёт            | approach +6 | `inner_manipulator` | `inner_guide`   |
| Сенсация переживает источник  | y −7        | `inner_manipulator` | `inner_hermit`  |
| Следующая ставка отыграет всё | approach +8 | `inner_adapter`     | `inner_analyst` |

### `aristocrat` — Charlotte von Waldstein, 25

Stats `attr_social +4 / attr_deception +2 / attr_encyclopedia +2`; flaw
Claustrophobia (`flaw_prideful_etiquette` flag, `checkVoice: volition`, dc 8,
_Instant_); signature Sharp Gaze. **Runs the social-palace skins clean** — the same
labels as the witch, but with no Blood Curse / `[ПЯТНО]` underneath.

**emphasis:** `inner_guide` loud (empathy/social/intuition — the room read of a
duelist of status), `inner_manipulator` second (deception). The witch's loud
`inner_leader`/House is _quiet_ here: Charlotte performs the name, she is not
(yet) consumed by it.

**methodSkins** (shared authoring with the witch, run clean):

| label        | targetId         | patron         | cost                                                       |
| ------------ | ---------------- | -------------- | ---------------------------------------------------------- |
| `[ФАСАД]`    | `attr_composure` | `inner_leader` | holds the drawing room; distance from her own feeling      |
| `[ЭСТЕТИКА]` | `attr_poetics`   | `inner_hermit` | restores control through form; dependence on sterile order |

**motiveSkins** (shared, run clean):

| label        | targetId            | cost                                 |
| ------------ | ------------------- | ------------------------------------ |
| `[ИЕРАРХИЯ]` | `inner_cynic`       | status radar; humiliates non-threats |
| `[СТРАТЕГ]`  | `inner_manipulator` | leverage accounting; erodes trust    |

**modes:**

| label      | derivedFrom                                       | distorts                                                                                       | prose                                                       |
| ---------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `[КЛЕТКА]` | `flaw_prideful_etiquette` in a confined-space tag | `[ФАСАД]` DC spikes; composure collapses; the radar turns inward and reads the walls as judges | breath-short, sentences that won't finish, the room closing |

**hiddenVoice:**

```
[ИМЯ] — sourceRole: concealed_threat (self-revelation)
revealTriggers:
  - a choice made for the family name against her own want
  - a tight room where the Façade broke in front of equals
"You were never the heir. You were the room the name lives in."
```

**doctrines:**

| title                                         | axisShift   | amplifies           | mutes         |
| --------------------------------------------- | ----------- | ------------------- | ------------- |
| Манеры — это броня                            | approach −5 | `inner_leader`      | `inner_cynic` |
| Имя обязывает, и потому правит                | x +7        | `inner_leader`      | `inner_exile` |
| Близость — это допуск, который можно отозвать | y −6        | `inner_manipulator` | `inner_guide` |

### `veteran` — Gustav Eisenhart, 40

Stats `attr_physical +4 / attr_perception +2 / attr_spirit +2`; flaw Alcoholism
(`flaw_battle_scar_trigger` flag, `checkVoice: volition`, dc 9, _Next Scene_);
signature Combat Instinct — **danger clarifies him**. His alcohol loop is the
direct structural twin of the witch's `applyAlcoholRelief` (fast relief, slow
cumulative cost) — reuse that shape, do not re-invent it.

Character bible: [`GUSTAV_PARLIAMENT_BIBLE.md`](./GUSTAV_PARLIAMENT_BIBLE.md).
The **Freudian module**: the manifesto's Ид/Эго/Суперэго/Тень realized as
_diegetic_ military figures — psychoanalysis is the underlay, the voices speak
army and war, never textbook. (Replaces the old "optional Freudian overlay" note:
this IS that overlay, built as the primary skin set.)

**emphasis:** `inner_cynic` loud (`[ЧАСОВОЙ]` — hypervigilance as a person),
`inner_leader` second (`[УСТАВ]` — the internalized dead commander). `inner_exile`
simmers (`[ВЫЖИВАЛЬЩИК]`, loudest under fire).

**methodSkins:**

| label              | targetId          | patron          | cost                                                                                                                                             |
| ------------------ | ----------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `[ИНСТИНКТ]`       | `attr_perception` | `inner_cynic`   | in-character voice of Combat Instinct (danger clarifies); reads the room as a field of fire; never off duty                                      |
| `[ТЕЛО]`           | `attr_physical`   | `inner_hermit`  | endures anything; asks the body to pay for the silence                                                                                           |
| `[ФАНТОМНАЯ БОЛЬ]` | `attr_endurance`  | `inner_adapter` | was `[ВЫДЕРЖКА]`; the body's war-memory speaks in pain — outlasts the bad minute, then bills him in phantom fire; mistakes endurance for healing |
| `[ПРИЗРАК]`        | `attr_stealth`    | `inner_adapter` | Hunter-track craft ("a trained absence"); the talent for vanishing works on relationships too                                                    |

**motiveSkins** (the Freudian five — diegetic names, psychoanalytic underlay):

| label           | targetId            | underlay                  | cost                                                                                                                              |
| --------------- | ------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `[УСТАВ]`       | `inner_leader`      | Superego                  | speaks in the dead commander's voice; orders relieve guilt by replacing judgment; cannot tell sacrifice from suicide              |
| `[ОПЕРАТИВНИК]` | `inner_analyst`     | Ego                       | the field-officer mediator between the oath and the animal; turns grief into logistics; the only voice the others still listen to |
| `[ЧАСОВОЙ]`     | `inner_cynic`       | hypervigilance (amygdala) | was `[ВЫЖИВШИЙ]`; sometimes spots the ambush before logic, sometimes builds one from a door-creak; cannot stand down              |
| `[ВЫЖИВАЛЬЩИК]` | `inner_exile`       | Id                        | was `[ОДИНОЧКА]`; no morality, no time — the war is always now; keeps him alive, costs him everyone watching                      |
| `[ТЕНЬ]`        | `inner_manipulator` | Jungian Shadow            | the repressed taste for power, fear and breakage that `[УСТАВ]` filed under "orders"; mocking, seductive, **open from scene one** |

> Note: `[ТЕНЬ]` deliberately sits on `inner_manipulator` (not `inner_cynic` as
> the old overlay sketch said) — `attr_shadow`'s patron is the manipulator, and
> the Shadow's register (mockery, seduction, people-as-prey) is manipulator
> territory. `inner_cynic` is taken by hypervigilance.

**modes:**

| label         | derivedFrom                                                                                             | distorts                                                                                                                                                      | prose                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `[БУТЫЛКА]`   | `flaw_battle_scar_trigger` (alcohol relief loop)                                                        | fast relief now (`−stress`), meaner cumulative cost next scene; patience drops, `[ИНСТИНКТ]` goes from sharp to jumpy, `[ТЕНЬ]` gets the floor more often     | heavy, slurred-by-degrees, fewer words, longer silences                         |
| `[ПЕРЕДОВАЯ]` | battle trigger (sharp sound/smell, AR-scan artifact) + `flaw_battle_scar_trigger` — the amygdala hijack | the front bleeds into the present (**AR layer distorts**): `[ВЫЖИВАЛЬЩИК]` takes the wheel, `[УСТАВ]` shouts orders to dead men, civilians read as combatants | present-tense intrusions of the war; sand on the teeth; "я" collapses into "мы" |
| `[ТИШИНА]`    | no active threat + low-stimulation scene tags                                                           | silence reads as ambush-prep: `[ЧАСОВОЙ]` louder, the pull of `[БУТЫЛКА]` rises, `[ТЕНЬ]` whispers in the quiet                                               | short sentences, long pauses; the calm itemized like a threat                   |

**hiddenVoice:**

```
[НЕ ВЫНЕС] — sourceRole: concealed_threat (self-revelation)
revealTriggers:
  - a scene where someone under his protection is lost
  - sobriety held through a beat where the bottle was offered
  - being publicly thanked or celebrated as a hero in front of witnesses
"Danger never clarified you. It just drowned out the names you couldn't carry."
```

**doctrines:**

| title                          | axisShift   | amplifies                   | mutes          |
| ------------------------------ | ----------- | --------------------------- | -------------- |
| Опасность — это ясность        | approach +7 | `inner_cynic` (ЧАСОВОЙ)     | `inner_guide`  |
| Тишина опаснее боя             | x −6        | `inner_exile` (ВЫЖИВАЛЬЩИК) | `inner_leader` |
| Кто выжил — тот и виноват      | y +5        | `inner_hermit`              | `inner_cynic`  |
| Приказ снимает вину            | x +7        | `inner_leader` (УСТАВ)      | `inner_hermit` |
| Сломанное во мне — тоже оружие | y −6        | `inner_manipulator` (ТЕНЬ)  | `inner_hermit` |
| Строй держат люди, а не устав  | y +6        | `inner_guide`               | `inner_exile`  |

### `archivist` — Martha Heller, 40

Stats `attr_intellect +4 / attr_encyclopedia +3 / attr_social +1`; flaw Obsessive
Archivist (`checkVoice: volition`, dc 8, _Until Resolved_); signature Index of
Everything.

**emphasis:** `inner_analyst` loud — heavily, almost mono-dominant (logic /
intellect / encyclopedia). Counter kept alive: `inner_hermit` (the quiet that
filing is meant to fill).

**methodSkins:**

| label      | targetId            | patron          | cost                                                         |
| ---------- | ------------------- | --------------- | ------------------------------------------------------------ |
| `[ИНДЕКС]` | `attr_encyclopedia` | `inner_analyst` | aligns every record; mistakes completeness for understanding |
| `[ЛОГИКА]` | `attr_logic`        | `inner_analyst` | the pattern is real; the urgency it ignores is also real     |

**motiveSkins:**

| label                   | targetId        | cost                                                  |
| ----------------------- | --------------- | ----------------------------------------------------- |
| `[АНАЛИТИК]`            | `inner_analyst` | the efficient line; people are entries                |
| `[ОТШЕЛЬНИК]` (counter) | `inner_hermit`  | least harm, ask little — but also: hide in the stacks |

**modes:**

| label          | derivedFrom                                     | distorts                                                                                                                                    | prose                                                  |
| -------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `[КОМПУЛЬСИЯ]` | `flaw_obsessive_archivist` (a missing document) | a gap in the record becomes a private emergency that overrides danger, urgency, and the social room; `[ИНДЕКС]` will not let the scene move | precise, accelerating, list-like, deaf to interruption |

**hiddenVoice:**

```
[ПУСТАЯ ПОЛКА] — sourceRole: concealed_threat (self-revelation)
revealTriggers:
  - an archive completed while a living thing went unattended
  - a gap she finally let stay open
"You were never indexing the truth. You were filing the place a person used to be."
```

**doctrines:**

| title                              | axisShift   | amplifies       | mutes          |
| ---------------------------------- | ----------- | --------------- | -------------- |
| Пробел в записи — это преступление | approach +7 | `inner_analyst` | `inner_guide`  |
| Полнота важнее последствий         | y −6        | `inner_analyst` | `inner_hermit` |
| В архиве безопаснее, чем в комнате | x −7        | `inner_hermit`  | `inner_leader` |

## Integration points (where each piece binds)

| Module piece        | Binds to (existing)                                                                                                                      | New work                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `emphasis`          | `inner_voice_rank_*` seeding in `buildOriginChoiceEffects` (extend alongside `ORIGIN_TALKER_DEFAULT_RANK_BY_ID`)                         | small additive effects                                                             |
| method/motive skins | `voicePresentation.getVoicePresentation` reads `modulesByPresetId[preset]` to override label/persona                                     | `voicePresentation` gains a `preset` arg; `voiceBridge` gains per-preset overrides |
| modes               | derived from `witch_blood_curse_pressure` / `moral_stress` / flaw flags; bias `rankPatronVoicesByInfluence` weights + `facadeDifficulty` | resolver hook (already proposed for Façade DC)                                     |
| hiddenVoice         | Player Dossier reveal flags; `flag_witch_executor_on_trail` for the witch                                                                | authored content + 1 flag per origin                                               |
| doctrines           | `change_psyche_axis` effects + resonance bias                                                                                            | authoring convention; no engine change                                             |

## Reuse vs new code

**Reuse (no engine change):** `resolvePatronVoiceInfluence`, `rankPatronVoicesByInfluence`,
two-layer parser guard (`hasMixedSpeakerPool`), psyche resonance, `parliamentPresetId`
resolver, `getVoicePresentation`, `voiceBridge` persona scaffolding, the witch
volition economy.

**New code (small, additive, presentation-tier):**

1. `data/parliamentModules.ts` — the `ParliamentModule` registry (witch first, then queue).
2. `voicePresentation.getVoicePresentation(voiceId, preset?)` — preset-aware label/persona override.
3. `inner_voice_rank_*` emphasis seeding in `buildOriginChoiceEffects`.
4. Per-origin mode derivation hook (reuses the Façade-DC resolver seam).
5. One Player-Dossier reveal flag per origin for the hidden voice.

Nothing here adds a meter, a parallel engine, a hard lock, or VN-snapshot schema.
A module is a data pack; the parliament stays one engine.
