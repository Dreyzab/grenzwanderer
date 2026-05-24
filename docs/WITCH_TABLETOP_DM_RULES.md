# Witch Tabletop DM Rules Bible

This file defines the first playable one-shot for Eleanor Vance in the Grand Estate. It is a session-prep artifact, not an authored canon replacement.

## Canon Policy

- Immutable authored canon stays in Obsidian, snapshot, and CaseBuild artifacts.
- Tabletop DM improvisation creates session canon only.
- Session canon is review-first: the DM returns a proposal, then the player accepts or rejects it.
- Accepted session facts may later be promoted manually into Obsidian/CAS, but the DM cannot promote them by itself.
- The AI DM may narrate, ask for checks, propose risks, and propose session facts; reducers remain the only authority for durable game state mutation.

## Eleanor Start

- `resource_fate_token = 6`
- `resource_fortune = 0`
- `resource_fortune_mod = -1`
- `resource_karma = -10`
- `witch_blood_curse_tier = 1`
- `witch_blood_curse_pressure = 35`
- `witch_blood_power = 0`
- `witch_blood_debt = 0`
- `witch_alcohol_aftertaste = 0`

## Spiritual Veil Sight

Passive Veil Sight is free. The DM can give sensory hints: cold seams in air, wrong dust, memory residue, a pressure behind a portrait, a spirit's attention.

Spend to focus means Eleanor asks one precise occult question or requests one precise occult hint. The answer can be useful and sharp, but it raises Blood Curse pressure. The default pressure cost is `+15`.

Examples:

- "What in this room is not human?"
- "Which object did the spirit touch last?"
- "Is Karl afraid of the ghost or of someone alive?"
- "What does the cold spot want me to notice?"

## Blood Curse

The curse has three tiers. Each tier has pressure from `0` to `100`.

- Tier 1 overflow: bargain scene or complication.
- Tier 2 overflow: predator impulse.
- Tier 3 overflow: hard bargain, exposure, or spirit danger.

The curse should fail forward. It should never end the one-shot by itself; it creates debt, leverage, temptation, exposure, or a dangerous offer.

## Blood Absorption

Blood absorption gives immediate relief and power now. It reduces pressure and increases `witch_blood_power`.

The same act creates `witch_blood_debt`. The debt is not a moral lecture; it is a delayed engine. Later, the DM can use it to raise hunger, make a witness wary, sour a bargain, or turn a safe social moment into a pressure scene.

Quality bands:

- Thin blood: low relief, low power, low debt.
- Ordinary blood: normal relief, normal power, normal debt.
- Potent blood: strong relief, strong power, strong debt.

## Drinking Flaw

Alcohol can briefly reduce pressure and social stress. It should feel tempting in safe zones.

The cost comes later: weaker control, worse perception, lower effective fortune, or harder volition checks. Track this through `witch_alcohol_aftertaste`.

## Fate, Fortune, Karma

`resource_fate_token` is separate from Providence, Fortune, and Karma.

- Fate opens authorial DM intervention and can create session-canon proposals.
- Fortune modifies result quality.
- Karma shifts the moral weight of checks and consequences.
- For `psyche_axis_x <= -25`, negative karma helps selfish, coercive, or survival moves.
- Positive karma helps protective or cooperative moves.

## Tone Modes

Safe-zone tags: Bureau, tavern/lodging, train. The DM can use Chekhovian social texture: small absurdities, warmth, self-irony, uncomfortable hospitality, people talking past each other.

Investigation/threat tags: estate, spirit contact, interrogation, curse pressure `50+`. The DM uses Gothic/Mystery detective tone: precise dread, sensory evidence, moral ambiguity, and consequences that arrive quietly.

## Grand Estate One-Shot Truth

The truth is both true:

- There is a real spirit in the estate.
- Living people exploit or cover the haunting for a human secret.

Minimum cast:

- The spirit: a bound presence connected to the cold spot, the old pantry route, and an unfinished accusation.
- Baroness: publicly composed, privately managing scandal and debt.
- Karl: servant or groundsman who knows a service route and fears both the dead and the living.
- Human secret: a smuggling route, hidden ledger, or protected family compromise.
- Occult secret: the spirit is not a random haunting; it is anchored to an object or oath the living still use.

Session-canon hooks:

- Karl knows a pantry route used after midnight.
- The Baroness has already paid someone to call the haunting "weather."
- A hidden visitor uses the ghost story as cover.
- The spirit reacts to blood, brass, and old lavender.
- The coldest room is not where the body died, but where the lie is repeated.

Blood temptation scenes:

- Karl cuts his hand on a latch while lying.
- The Baroness offers wine that smells faintly metallic.
- A sealed pantry contains old bandages, brown glass, and a fresh basin.
- The spirit pulls warmth out of Eleanor and leaves hunger behind.

## DM Proposal Shape

`propose_dm_turn` returns:

- `narration`
- `checks`
- `sessionFacts`
- `suggestedStateDeltas`
- `risks`
- `toneMode`
- `canonRemarks`

The UI must show the proposal first. Only accepted session facts enter the overlay/session ledger.
