# Atmosphere Bible

This document is the canonical writing compass for supported Freiburg 1900 / Case01. It defines
the atmosphere as contrast, not as constant noir: a Chekhovian daily surface,
a pressure-heavy political middle, a shadow layer underneath, and rare moments
of earned darkness when the case, a choice, or a social wound makes the city
show its teeth.

Date policy: 1900 is the operational canon for supported Freiburg / Case01.
Existing 1905 references in older notes, templates, or visual briefs are legacy
drift until a separate ADR promotes them or defines a split display policy. See
[`docs/adr/0001-freiburg-1900-operational-canon.md`](adr/0001-freiburg-1900-operational-canon.md).

## Core Formula

Grenzwanderer should read like:

- Chekhovian specificity: ordinary people, petty manners, habits, rooms,
  clothing, tea, coal, paperwork, politeness, and evasions.
- Conan Doyle deduction: the pleasure of observed detail becoming a testable
  inference.
- Selective Sherlock/Guy Ritchie bursts: short analytical slow-motion moments
  only when physical, social, or deductive risk spikes.
- Disco Elysium-style polyphony: the detective's mind is not a hint machine;
  it is a set of competing methods and motives.

The baseline emotion is not "everything is dark." The baseline emotion is that
Freiburg keeps functioning while something morally rotten is being filed,
polished, excused, or ignored.

## Five Tone Rules

### 1. Daily Surface

Freiburg's default state is routine, manners, social inertia, and small
absurdity. People complain about coal prices, hats, office hours, station
crowds, and bad handwriting while tragedy is happening nearby.

Use this layer to make the city feel lived in. A bank manager straightening a
cuff, a clerk protecting a ledger margin from rain, or a porter muttering about
Prussian luggage can do more than another paragraph of fog.

### 2. Earned Darkness

Darkness is not wallpaper. It arrives when an investigation exposes harm:
institutional silence, class contempt, a compromised witness, a covered death,
or a choice that protects the case while damaging a person.

If a scene is grim, it must answer why the grimness is happening now. If the
answer is only "because detective noir," cut it or return to daily surface.

### 3. Dynamic Calculation

Action-burst mode is selective. Use it for short moments of risk: a chase, a
fight, a lie under pressure, a lock, a social ambush, or a reconstruction where
one bad inference can poison the route.

In this mode, Brain, Body, and Shadow voices may break the moment into sharp
units: distance, timing, leverage, line of sight, hand position, odds, route,
and failure point. Keep the burst brief. The scene should feel faster after the
voices speak, not stalled by them.

### 4. Failed Calculation

A failed roll should not become empty embarrassment. The detective may build a
beautiful plan from bad premises, act on it, and pay for it. Failure creates
content: a worse clue, public contempt, a rumor, debt, injury, lost trust,
extra heat, a dirtier route, or a narrower interpretation.

The joke can be sharp, but the state change must matter. Fail-forward is not
"nothing happens"; it is "something worse, stranger, or more expensive happens."

### 5. Parliament With Boundaries

The 18 method voices describe how the detective reads and acts. They belong to
the `attr_*` layer: Logic, Perception, Encyclopedia, Intuition, Empathy,
Imagination, Authority, Charisma, Volition, Endurance, Agility, Senses, Stealth,
Deception, Intrusion, Occultism, Tradition, and Gambling.

The `inner_*` moral factions describe why the detective acts and what kind of
person is forming through the choice. Do not collapse method and motive.

Atmosphere can use both layers, but not as the same thing:

- Method voice: "What do I notice, infer, endure, pressure, fake, or risk?"
- Moral faction: "Who pays for this, and what does it make me?"

## Occult Policy: Ambiguous Trace

Occultism is allowed as suspicion, symbolism, social memory, pattern hunger,
and possible misread. Early Freiburg must not confirm a hard supernatural
truth. The player should be able to ask: is this a real hidden layer, an
institutional cover story, a trauma pattern, or a voice seeing too much?

Good occult atmosphere leaves a usable trace without collapsing ambiguity:

- a repeated symbol that also has a mundane institutional route;
- a ritual phrase that might be social code;
- a physical clue that an Occultism voice over-interprets;
- a witness whose fear is real even if their explanation is unstable.

## Authoring Vocabulary

Use these tags in planning notes, reviews, and scene comments. They are
editorial vocabulary only; they do not require runtime or schema changes.

| Tag                 | Meaning                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `daily_surface`     | Routine, manners, petty social texture, civic normality.          |
| `pressure_layer`    | Bureaucracy, reputation, class, institutional resistance.         |
| `shadow_layer`      | Covert routes, blackmail, illegal access, suppressed networks.    |
| `action_burst`      | Short analytical slow-motion risk sequence.                       |
| `earned_darkness`   | Grimness justified by case consequence, harm, or moral cost.      |
| `ambiguous_occult`  | Esoteric reading that remains interpretable as non-supernatural.  |
| `fail_forward_cost` | Failure that creates a cost, route, rumor, debt, or altered clue. |

## Grill Gate

Before accepting an important scene, answer these questions:

1. What does this scene change in the case: fact, clue, contradiction, route,
   relationship, hypothesis, or identity pressure?
2. Which method voice earned a line here, and what method does it actually
   provide?
3. What concrete Freiburg detail replaces generic noir mood?
4. What does failure do besides delay the same content?
5. If the scene is dark, why is that darkness earned by the case or choice?
6. If the scene hints at the occult, what keeps the trace ambiguous?

If the answers are weak, rewrite the scene around consequence, not mood.

## Calibration Scenes

### HBF Arrival

Target tone: disorientation into control. Use `daily_surface` first: crowds,
porters, timetables, coal, local suspicion, hurried civic routine. Do not start
with apocalypse. Early tension should come from friction and being an outsider.

Acceptable pressure: missed detail, nervous kiosk behavior, a schedule mark,
or a public slight that teaches how the city treats strangers.

### Bank Investigation

Target tone: controlled panic, institutional resistance, selective truth. This
is where `earned_darkness` can appear because harm has entered the room.

The bank must still contain manners: polished counters, careful denials,
clerks protecting procedure, and civic faces trying to keep the scandal
upright. Let darkness cut through that surface instead of replacing it.

### Warehouse Entry Plan

Target tone: tense preparation and point-of-no-return. Use `action_burst` only
when choosing or committing an approach: lawful raid, covert breach, route
timing, risk, and fallback.

Failure should become `fail_forward_cost`: extra witnesses, burned access,
injury, noise, reputation loss, or a dirtier return route. It should not cancel
the finale.

## Boundaries

- Do not rewrite runtime APIs, reducers, VN schema, SpacetimeDB tables, snapshot
  extraction, or AI contracts for this document.
- AI and Inner Parliament copy are presentation-only. They may describe
  atmosphere, aftermath, and interpretation, but they must not mutate state.
- Atmosphere without clue, route, social pressure, identity pressure, or
  consequence is a candidate for deletion or merger.
- Do not make Freiburg constantly grim. The city is more disturbing when it can
  return to tea, ledgers, umbrellas, and polite lies after the blow lands.
