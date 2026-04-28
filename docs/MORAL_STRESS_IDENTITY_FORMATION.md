# Moral Stress and Identity Formation

## Purpose

This spec defines how player choices shape the detective's moral identity and inner stress.

The current implementation should stay soft:

- no hard moral locks in early play
- no heavy debuffs while identity is still forming
- no karma, fortune, heat, or interrogation-tension redesign in this phase
- moral feedback is mostly voice tone, psyche drift, and remembered pressure

The design goal is not to punish good or evil choices. The design goal is to make the protagonist become someone through repeated choices.

## Stress Types Boundary

There are two separate stress concepts:

| Stress          | Meaning                                                       | Scope                     |
| --------------- | ------------------------------------------------------------- | ------------------------- |
| Dialogue stress | Pressure inside an interrogation, argument, or scene exchange | Scene system              |
| Moral stress    | Inner cost of violating a forming moral boundary              | Character identity system |

Do not merge them conceptually.

Dialogue stress answers: "How hot is this exchange?"

Moral stress answers: "How much does this choice grind against who I am becoming?"

## Core Formula

Moral stress is produced by moral contradiction, not by evil.

Conceptually:

```text
moral_stress = event weight x contradiction with identity x responsibility
```

Definitions:

- Event weight: how serious the outcome is.
- Contradiction with identity: how far the choice cuts against the player's established moral pattern.
- Responsibility: how directly the player caused or accepted the outcome.

Example:

```text
An innocent person dies because the player chose a convenient cover-up.

If the detective is becoming Collective + Altruist:
  high contradiction, high responsibility -> large moral_stress.

If the detective is becoming Individualist + Egoist:
  lower contradiction, high responsibility -> less moral_stress, but other systems may later carry the cost.
```

This does not mean the second detective is "right." It means the act is easier for that identity to compartmentalize.

## Early Game Behavior

Early in the game, the protagonist's moral identity is not fully formed.

Rules:

- choices move psyche axes in small steps
- moral factions argue, but do not dominate
- stress is rare and mild
- contradictions are framed as uncertainty, not collapse
- no path should be blocked because of moral identity

Use early choices to ask the player:

- Do you protect the group or keep your independence?
- Do you preserve people or use them?
- Do you move first or wait?
- Do you tell the truth when it costs leverage?

## Later Behavior

As repeated choices create a pattern, moral stress can become more visible.

Potential stages:

| Moral Stress | Intended Feel       | Future Mechanical Hook                                               |
| ------------ | ------------------- | -------------------------------------------------------------------- |
| 0-20         | Unease, tonal color | sharper voice commentary                                             |
| 20-50        | Recurring pressure  | more counter-voice appearances                                       |
| 50-75        | Strain              | possible soft debuffs such as reduced steadiness                     |
| 75+          | Crisis              | recovery scene, confession, rest, breakdown, or forced confrontation |

These thresholds are design language for now. Do not implement hard locks until the identity system is tested in content.

## Authoring Rules

Every major moral choice should be authored with four questions:

1. What method voice can perform the action?
2. Which moral factions support or oppose it?
3. Which psyche axis changes, and by how much?
4. Does this choice violate an existing moral boundary strongly enough to add moral stress?

Do not add moral stress just because a choice is harsh.

Add moral stress when:

- the choice causes serious harm
- the player had meaningful agency
- the choice contradicts a visible or repeated moral pattern
- an inner faction can plausibly say: "This is not who we said we were."

## Current Content Encoding

For now, content can represent moral identity with existing effects:

```ts
effects: [
  { type: "change_psyche_axis", axis: "x", delta: 5 },
  { type: "change_psyche_axis", axis: "y", delta: -5 },
  { type: "add_var", key: "moral_stress", value: 3 },
];
```

Use `moral_stress` as the design key for inner contradiction. Keep it separate from `tension`, `heat`, and interrogation-specific stress variables.

Small stress increments should be preferred in early scenes:

- `+1`: discomfort
- `+3`: clear contradiction
- `+5`: serious contradiction
- `+8` or more: major harm, betrayal, death, or identity crisis

## Example: Pressuring A Witness

Choice:

```text
Pressure a frightened witness until he gives the name.
```

Method:

```text
attr_authority
```

Moral factions:

```text
inner_manipulator supports: fear makes him useful.
inner_guide opposes: fear may destroy the truth.
inner_leader may support if the pressure protects others.
```

Early effect:

```text
psyche_axis_y -5
psyche_approach +5
maybe moral_stress +1 if the detective has repeatedly protected vulnerable witnesses
```

Later effect:

```text
If the detective is strongly Collective + Altruist and the witness breaks:
  moral_stress +5 or more.
```

## Example: Letting Someone Escape

Choice:

```text
Let a suspect run because arresting him would expose a child witness.
```

Method:

```text
attr_empathy or attr_volition
```

Moral factions:

```text
inner_guide supports: preserve the vulnerable.
inner_leader supports if group safety remains intact.
inner_cynic opposes: mercy gives danger more time.
```

Possible effect:

```text
psyche_axis_y +5
psyche_axis_x +3
psyche_approach -3
```

Moral stress should be low for a Guide/Leader identity, but can rise for a Cynic/Manipulator identity because the detective gave up control.

## Example: Cover-Up After A Death

Choice:

```text
Hide the agency's mistake after a civilian dies, preserving access to the investigation.
```

Method:

```text
attr_deception or attr_authority
```

Moral factions:

```text
inner_manipulator supports: preserve the board.
inner_adapter supports: survive the institution's current.
inner_witness opposes: truth is the last remaining duty.
inner_guide opposes: the dead deserve more than convenience.
```

Possible effect:

```text
psyche_axis_y -12
psyche_axis_x +5
psyche_approach +5
```

Moral stress:

```text
Collective + Altruist identity: high.
Individualist + Altruist identity: very high if truth is central.
Collective + Egoist identity: lower, unless the player has authored a boundary around protecting civilians.
```

## Presentation Rules

Avoid showing moral stress as accounting in normal narrative text.

Prefer:

```text
Guide falls silent.
Cynic does not laugh this time.
Witness remembers the name you did not say aloud.
```

Avoid:

```text
+5 moral_stress
-10 altruism
```

The numbers exist for state and tuning. The player-facing layer should feel like memory, pressure, and self-recognition.

## Future Integration Points

These are intentionally out of scope for now:

- karma
- fortune
- heat
- interrogation tension
- hard debuffs
- recovery scenes

When those systems are revisited, this spec should provide the boundary:

- psyche axes define identity
- moral stress defines contradiction cost
- dialogue stress defines scene pressure
- other systems can react later, but should not replace identity formation
