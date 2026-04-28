# Inner Parliament Constitution

## Core Rule

The Inner Parliament has two layers:

- `attr_*` voices are methods. They answer: "Can the detective do this, and by what technique?"
- `inner_*` factions are motives. They answer: "Why does the detective want to do this, and what kind of person is taking the wheel?"

Never collapse these layers. A skill voice can unlock an action; a moral faction can argue for or against the reason to take it.

See also: [Moral Stress and Identity Formation](./MORAL_STRESS_IDENTITY_FORMATION.md).

## The 18 Method Voices

The detective parliament is six departments with three voices each.

| Department | Voices                          | Investigation Function                          |
| ---------- | ------------------------------- | ----------------------------------------------- |
| Brain      | Logic, Perception, Encyclopedia | Deduction, visible detail, stored facts         |
| Soul       | Intuition, Empathy, Imagination | Gut warning, emotional truth, reconstruction    |
| Character  | Authority, Charisma, Volition   | Pressure, rapport, self-command                 |
| Body       | Endurance, Agility, Senses      | Fatigue, movement, physical signal reading      |
| Shadow     | Stealth, Deception, Intrusion   | Hidden movement, lies, locks and covert access  |
| Spirit     | Occultism, Tradition, Gambling  | Esoteric patterns, social memory, risk and odds |

Use these voices for:

- `skillCheck.voiceId`
- passive checks
- `voice_level_gte`
- AI thought style after a check
- scene-specific `activeSpeakers` when the scene wants a skill parliament

Authoring test: if the line says "what method detects or accomplishes this?", it belongs to an `attr_*` voice.

## The Moral Factions

The moral parliament uses `inner_*` ids and sits on two axes:

- `psyche_axis_x`: Individualism `-100` to Collectivism `+100`
- `psyche_axis_y`: Egoism/Machiavellian `-100` to Altruism `+100`
- `psyche_approach`: Reactive `-100` to Proactive `+100`

Recommended faction map:

| Quadrant                 | Proactive Faction   | Reactive Faction | Moral Question                                   |
| ------------------------ | ------------------- | ---------------- | ------------------------------------------------ |
| Collective + Altruist    | `inner_leader`      | `inner_guide`    | How do we protect people together?               |
| Collective + Egoist      | `inner_manipulator` | `inner_adapter`  | How do we use the room without being used?       |
| Individualist + Egoist   | `inner_cynic`       | `inner_exile`    | How do I survive when trust is a liability?      |
| Individualist + Altruist | `inner_witness`     | `inner_hermit`   | How do I keep truth and conscience intact alone? |

Current runtime note: V1 has `inner_analyst` instead of `inner_witness`. Conceptually, `inner_analyst` is a rational method voice more than a moral faction. Treat it as transitional until the roster is renamed or re-authored.

Use moral factions for:

- pivotal dilemmas
- `innerVoiceHints`
- psyche drift through `change_psyche_axis`
- debates about costs, harm, loyalty, leverage, mercy, truth, and survival

Authoring test: if the line says "why should we choose this, and what does it make us?", it belongs to an `inner_*` faction.

## Scene Interaction Pattern

A strong scene can use both layers, but not in the same contract slot.

Example:

```ts
skillCheck: {
  id: "check_pressure_witness",
  voiceId: "attr_authority",
  difficulty: 11
}
```

Authority says the detective can pressure the witness.

```ts
innerVoiceHints: [
  {
    voiceId: "inner_manipulator",
    stance: "supports",
    text: "Break the rhythm now. Fear will make him useful.",
  },
  {
    voiceId: "inner_guide",
    stance: "opposes",
    text: "If you frighten him, you may get words and lose the truth.",
  },
];
```

The moral factions argue over whether pressure is worth the harm.

## Hard Boundaries

- `inner_*` never replaces `skillCheck.voiceId`.
- `voice_level_gte` only checks method voices.
- `activeSpeakers` must contain only skill voices or only moral factions; mixed pools are rejected by the parser.
- A failed method check should create cost, delay, risk, or a narrower route, not a dead investigation.
- A moral faction should never provide forensic facts. It can interpret stakes, temptation, fear, duty, or self-image.

## Runtime Migration Notes

The design canon is 18 method voices, but the current code still contains legacy and aggregate ids.

- Aggregate/core ids such as `attr_intellect`, `attr_physical`, `attr_spirit`, `attr_shadow`, `attr_social`, and `attr_psyche` should be treated as department-level compatibility variables, not final voice personas.
- `Volition`, `Senses`, and `Gambling` exist in design notes; runtime ids may need explicit alignment before they are used as `skillCheck.voiceId`.
- Existing scenario content can keep legacy ids during migration if `voiceBridge` maps them to canonical presentation.

Preferred final rule: every authored skill check should point to one of the 18 method voices, and every moral dilemma should point to one or more `inner_*` factions.
