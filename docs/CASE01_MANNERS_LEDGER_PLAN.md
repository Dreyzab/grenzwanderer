# Case01 Manners Ledger Plan

Working skeleton for turning Dining Car flags into live Freiburg callbacks.

## Thesis

Freiburg remembers manners before names.

The train scene should not behave like a one-off prologue. Choices at the
dining car table become social weather in the first hours of the city:
characters do not say "your flag is set"; they treat the detective as someone
whose manners have already entered circulation.

## Core Design

Use a three-layer payoff model:

1. Echo: low-cost atmospheric callbacks in later dialogue.
2. Ledger: small access, tone, or shortcut consequences.
3. Artifact: one memorable physical reminder, only where it earns its place.

Do not make any dining car choice "correct." Each choice changes the kind of
access and the kind of suspicion.

## Runtime Alignment

These constraints override the more speculative version of the plan.

| #   | Constraint                              | Runtime meaning                                                                                               | MVP decision                                                                                                                                   |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `Zum Goldenen Adler` is now canonical   | The name exists in onboarding text and has a runtime-backed lodging scene.                                    | Keep `flag_asked_lodging_route` as the semantic flag and spend it only inside `case01_lodging_zum_goldenen_adler`.                             |
| 2   | Salon Reich is not Eleonora             | Existing salon-like content is mediated by another host/proxy, not Eleonora herself.                          | Use a proxy line: "Frau Muller / salon host was warned by Frau Hartmann..." plus, where possible, a Felix aside.                               |
| 3   | Lotte interlude is thin                 | Current `case01_lotte_interlude` is warning -> trust/distance. There is no "prove you noticed" stage to skip. | Do not bypass the quest. Add a conditional opening line or visible-if confrontation choice for `noticed_lotte_schedule`.                       |
| 4   | Felix lacks a clean Act 1 callback node | There is no dedicated Felix follow-up scene in the current Case01 Act 1 runtime.                              | Use `corridor_reflection` if/when it is runtime-backed; otherwise create a small reactive reflection node before adding Felix-specific payoff. |
| 5   | No inventory dependency                 | Artifacts cannot rely on an inspection/inventory system for MVP.                                              | Artifact = one line inside `bodyOverride`, not a game object.                                                                                  |

Naming rule:

- Prefer `flag_asked_lodging_route` over `flag_asked_zum_goldenen_adler`.
- Keep `flag_asked_zum_goldenen_adler` only as a temporary compatibility alias until older
  dining-car snapshots and saves no longer need it.
- Spend lodging-route payoff at `Zum Goldenen Adler`, not in unrelated salon or HBF nodes.

## Existing Input Flags

### `flag_accepted_eleonora_hospitality`

Meaning: the detective entered Eleonora's ritual.

Social read:

- Polite enough to accept patronage.
- Easier to place inside aristocratic circles.
- More vulnerable to being treated as "Hartmann-adjacent."

Target payoff:

- Salon/bourgeois contacts warm up faster.
- Working-class contacts may read the detective as already claimed.

### `flag_declined_eleonora_hospitality`

Meaning: the detective marked a boundary.

Social read:

- Independent and difficult to host.
- Less useful as a social guest.
- Harder to fold into Eleonora's orbit.

Target payoff:

- Eleonora's circle stays formal.
- Official/neutral contacts may respect the restraint.

### `flag_silent_observation`

Meaning: the detective let Felix speak first.

Social read:

- Good listener.
- Less performative than most investigators.
- Dangerous because silence collects.

Target payoff:

- Felix gets an early trust/interpretation callback.
- Lotte treats the detective as someone who listens on purpose.

### `flag_dining_intro_self`

Meaning: the detective placed their name into circulation.

Social read:

- Formal, legible, status-forward.
- Easier for official contacts to identify.
- Easier for the city to anticipate.

Target payoff:

- Officials and front desks recognize the name earlier.
- The recognition should feel useful but slightly invasive.

### `flag_asked_zum_goldenen_adler` / planned rename: `flag_asked_lodging_route`

Meaning: the detective disclosed their lodging vector to Lotte.

Social read:

- Direct questioner.
- Gave away a destination.
- Lotte now has a clean line into the lodging thread.

Target payoff:

- Lodging-related scenes become sharper and more informed.
- Lotte can plausibly know about the detective's movements.

MVP note:

- Do not spend this on `Zum Goldenen Adler` unless a real runtime scene exists.
- If only another inn/gasthaus is canonical, rename this flag and all text before
  implementation.

### `noticed_lotte_schedule`

Meaning: the detective saw Lotte's schedule/list logic.

Social read:

- The detective noticed the operator layer under the charming surface.
- Lotte cannot fully pretend the train meeting was casual.

Target payoff:

- Unique entry or shortcut in `case01_lotte_interlude`.
- This is the highest-value dining car callback; spend it late enough to matter.

## Payoff Map

### Beat 1: Platform/HBF Echo

Goal: confirm that the train scene follows the player into Freiburg without
changing gameplay yet.

Candidate locations:

- `scene_case01_train_platform_parting`
- `scene_case01_beat1_atmosphere`
- `scene_case01_hbf_newsboy_approach`
- `scene_case01_hbf_luggage`

Rules:

- One echo at most in the immediate arrival flow.
- Keep it oblique: a line, a glance, a service detail.
- Do not over-explain the flag.

Examples:

- Accepted wine: a porter is already deferential because "the Hartmann party"
  was noticed.
- Declined wine: a clerk uses a cooler, more formal address.
- Introduced self: someone has already heard the detective's name.
- Asked lodging route: a desk clerk, porter, or map contact knows the lodging
  detail before the detective volunteers it.

### Beat 2: First City Contact Ledger

Goal: make one early choice feel materially recognized.

Candidate locations:

- HBF luggage counter.
- Police post.
- Confirmed lodging venue, after audit.
- First bourgeois/salon access point through a proxy host.
- `corridor_reflection`, if runtime-backed.

Rules:

- Consequence changes tone, friction, or information order.
- It must not close a quest.
- It may skip one redundant step or open one alternate line.

Examples:

- Accepted hospitality: easier social access, but NPCs assume Hartmann proximity.
- Declined hospitality: no soft welcome, but more neutral official footing.
- Silent observation: Felix gives a small interpretive aside without being asked.
- Asked lodging route: lodging contact has a preloaded comment from Lotte.

### Beat 3: Lotte Wire Payoff

Goal: spend `noticed_lotte_schedule` in Lotte's actual domain.

Target scenario:

- `case01_lotte_interlude`
- Current nodes around `scene_case01_lotte_warning`

Desired effect:

- New opening line if `noticed_lotte_schedule`.
- Optional alternate choice that confronts her schedule logic.
- Bypass exposition, not the quest: the player starts the exchange with sharper
  context, but still chooses trust or distance.

Draft callback:

```text
[Detective]:
â€” In the train, you were not taking notes. You were keeping time.

[Lotte]:
â€” Time keeps itself. I only mark when people pretend they arrived by chance.
```

Possible mechanics:

- Add a `visibleIfAll: noticed_lotte_schedule` first choice, or route to a
  variant opening node before the existing trust/distance decision.
- Reuse `scene_case01_lotte_trust` and `scene_case01_lotte_distance` as the real
  outcome branches.
- Do not bypass the whole interlude; there is currently no prove-you-noticed
  stage to skip.

### Beat 4: Eleonora Social Payoff

Goal: make hospitality matter in a later social setting.

Candidate future scenes:

- Salon/Reich-style aristocratic access through a proxy host.
- Frau Muller / salon host as Hartmann-informed proxy.
- Felix aside, if a reflection node is available.
- Rathaus-adjacent patronage introduction.

Accepted wine proxy callback:

```text
[Frau Muller]:
â€” Frau Hartmann mentioned you accepted what was offered. That is useful in this
room.
```

Declined wine proxy callback:

```text
[Frau Muller]:
â€” Frau Hartmann also mentioned that you prefer a free hand. We shall not insist.
```

Possible mechanics:

- Accepted: social gate has warmer text or one fewer credential challenge.
- Declined: no warm gate, but less "claimed by Hartmann" suspicion elsewhere.

## Artifact Rule

Use at most one sensory artifact in the MVP.

Best candidate:

- A single body line in `corridor_reflection` or a lodging/front-desk scene.
- Use only if `noticed_lotte_schedule` or the renamed lodging-route flag is set.

Reason:

- It reinforces Lotte as operator without forcing a full inventory system.
- The object is a narrative beat, not a collectible.

Example:

```text
On the blotter lies a timetable corner, folded once. 08:41 is underlined; not
in ink, but by pressure.
```

Avoid:

- Multiple keepsakes from the train.
- Any object that implies Lotte can magically access the detective's pockets
  unless the scene explicitly supports it.
- Any artifact that requires inventory, item inspection, or new UI.

## Implementation Phases

### Phase 1: Audit Targets

Find the exact nodes that can carry callbacks without adding new systems.

Tasks:

- Locate all early HBF nodes after the train.
- Locate `case01_lotte_interlude` nodes and choices.
- Locate any existing social/salon/proxy-host access scene.
- Confirm the real runtime lodging venue; do not assume `Zum Goldenen Adler`.
- Confirm whether `corridor_reflection` is runtime-backed or only designed.
- Record which nodes are runtime-canonical vs generated snapshot only.

Output:

- Short target list with node ids and intended callback type.

### Phase 2: Echo MVP

Implement minimal atmospheric callbacks.

Tasks:

- Add 2-3 conditional variant nodes or conditional choices where current content
  structure supports it.
- Prefer node branching over runtime body interpolation unless body variants
  already exist.
- Keep each callback to one or two lines.
- If lodging is not runtime-backed, skip lodging echo in this phase.

Acceptance:

- A player who made a dining car choice hears at least one later echo.
- No quest path becomes unavailable.
- `smoke:case01-mainline` and `smoke:case01-branches` pass.

### Phase 3: Lotte Ledger MVP

Spend `noticed_lotte_schedule` in `case01_lotte_interlude`.

Tasks:

- Add a visible-if choice or variant opening on `scene_case01_lotte_warning`.
- Let the detective confront Lotte about the timetable logic.
- Reward with trust wording, relationship, or information ordering.

Acceptance:

- The callback feels like a direct result of observing the notebook.
- It does not skip the entire interlude.
- Existing Lotte trust/distance branches still work.
- It does not invent a missing "prove you noticed" stage.

### Phase 4: Eleonora Ledger MVP

Add one social consequence for hospitality.

Tasks:

- Identify the earliest fitting salon/proxy/patronage scene.
- Add accepted/declined variants.
- Ensure accepted is not simply better than declined.
- Phrase the callback as Frau Hartmann's influence travelling through another
  person if Eleonora is not present.

Acceptance:

- Accepted hospitality grants warmth/access but creates Hartmann association.
- Declined hospitality preserves distance but reduces warmth.

### Phase 5: Polish And Tests

Tasks:

- Update `src/shared/case01Canon.ts` only if new flags are needed.
- Regenerate content snapshots with `bun run content:extract`.
- Update RU translations for touched VN keys.
- Run:
  - `bun run smoke:case01-mainline`
  - `bun run smoke:case01-branches`
  - targeted `rg` checks for stale lines.

## Narrative Guardrails

- The city should feel observant, not omniscient.
- Callbacks should feel like manners moving through people, not a database read.
- No dining car choice should be framed as correct.
- Lotte's callbacks should reveal logistics.
- Eleonora's callbacks should reveal social ownership.
- Felix's callbacks should reveal fatigue and private interpretation.
- One strong callback is better than four explanatory ones.

## Open Decisions

1. Should the current `flag_asked_zum_goldenen_adler` compatibility alias be removed after
   old saves/snapshots no longer need it?
2. Should accepted/declined hospitality affect relationship values, or only
   text/access?
3. Should `noticed_lotte_schedule` grant a relationship change with Lotte, or
   only unlock a sharper dialogue path?
4. Is `corridor_reflection` already runtime-backed, or must it be authored as
   part of the MVP?
5. Which existing salon proxy is canon: Frau Muller, Baroness Elise, or another
   host?

## First Work Slice

Recommended first implementation slice:

1. Audit target nodes.
2. Rename or alias the lodging flag away from `Zum Goldenen Adler` if no real venue exists.
3. Add one HBF echo.
4. Add one Lotte interlude opening callback for `noticed_lotte_schedule`.
5. Add no inventory; artifact remains a single line if used.
6. Run content extraction and smoke tests.

This gives the player immediate confirmation plus one meaningful later payoff,
without committing the whole city to a large branching system yet.

## Second Work Slice

HBF hardening adds one accepted-hospitality echo before
`scene_case01_beat1_atmosphere` and keeps the arrival flow to at most one extra
echo. The lodging-route alias remains unspent until a runtime lodging node is
canonical, and Eleonora proxy/salon plus `corridor_reflection` remain the next
social layer rather than part of this slice.

## Third Work Slice

Because Case01 has no runtime-backed salon/proxy host yet, declined hospitality
is spent at the Rathaus as an official-footing callback. It adds a visible
`case01_mayor_briefing` route for `flag_declined_eleonora_hospitality` that
returns to the normal dossier branch, preserving quest flow and leaving the
future Eleonora proxy/salon payoff uncommitted.

## Fourth Work Slice

`flag_silent_observation` gets a low-friction Lotte listener opening in
`case01_lotte_interlude`. It is gated behind the absence of
`noticed_lotte_schedule`, so the stronger schedule confrontation keeps priority
when both flags are present, and both listener outcomes still return to the
normal trust/distance branches.

## Fifth Work Slice

`flag_defended_felix` gets a small Rathaus callback in
`case01_mayor_briefing`: Felix can read the official cover before the player
accepts it. The aside reveals his legal caution and fatigue without adding a
new Felix scene, changing access, or creating a relationship advantage beyond
the normal mayor-branch exit effects.

## Sixth Work Slice

Zum Goldenen Adler is now the canonical MVP lodging venue. The existing inn map point
starts `case01_lodging_zum_goldenen_adler`, and `flag_asked_lodging_route` is spent only
inside that runtime-backed lodging beat.

The payoff is Lotte-informed rather than omniscient: the desk is ready because
Lotte Weber made a practical inquiry before the detective arrived. The
timetable corner remains a single body line, not an inventory object or
inspectable artifact.

Salon/proxy payoff and `corridor_reflection` remain next-layer beats.

## Seventh Work Slice

Case01 background art pass gives every post-HBF `case01_*` scenario an effective
background. New assets live under `/images/scenes/case01/`, with scenario-level
defaults for the investigation beats and node-specific close-ups where the
story changes visual meaning.

The warehouse finale no longer borrows `scene_estate_intro.png`; it now uses a
warehouse-specific default plus separate lawful and compromised outcome frames.
The mainline smoke check now guards Case01 background coverage and verifies that
referenced public assets exist.
