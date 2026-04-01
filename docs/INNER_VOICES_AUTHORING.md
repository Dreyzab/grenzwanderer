# Inner Voices Authoring Guide

## Voice IDs

- `inner_leader`
- `inner_guide`
- `inner_manipulator`
- `inner_adapter`
- `inner_analyst`
- `inner_cynic`
- `inner_exile`
- `inner_hermit`

## Psyche Axes

- `psyche_axis_x`: individualist `-100` to collective `+100`
- `psyche_axis_y`: machiavellian `-100` to altruist `+100`
- `psyche_approach`: reactive `-100` to proactive `+100`

Use existing `var_gte` / `var_lte` for local psyche gating.

## Delta Vocabulary

- Small drift: `±5`
- Medium drift: `±12`
- Pivotal drift: `±30`

Apply with:

```ts
{ type: "change_psyche_axis", axis: "x" | "y" | "approach", delta: number }
```

## Scene Setup

Inner-voice scenes use:

```ts
voicePresenceMode: "parliament";
activeSpeakers: ["inner_leader", "inner_cynic", "inner_guide"];
```

Rules:

- `activeSpeakers` must use only `inner_*` ids or only skill voices. Mixed pools are rejected.
- For pivotal scenes, include at least one voice from an opposing quadrant so the counter-voice can appear.
- V1 uses explicit scene pools only. There is no automatic “pick from all eight” mode.

## Choice Hints

Use authored hints on key dilemmas:

```ts
innerVoiceHints: [
  {
    voiceId: "inner_leader",
    stance: "supports",
    text: "Protect the group before you protect the plan.",
  },
  {
    voiceId: "inner_cynic",
    stance: "opposes",
    text: "Mercy burns leverage and buys no certainty.",
  },
];
```

Rules:

- `innerVoiceHints.voiceId` must be an `inner_*` id.
- Hints are optional. If omitted, UI falls back to deterministic voice cards without choice-specific chips.

## Skill System Boundary

- `attr_*` stays in `skillCheck.voiceId`
- `voice_level_gte` accepts only skill voices
- `inner_*` never replaces skill checks in V1
