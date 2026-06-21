# Grenzwanderer Context

Описание контекста проекта Grenzwanderer и его основных понятий.

## Language

**Player**:
{A player interacting with the Grenzwanderer game or application}
_Avoid_: User, client

**Character**:
{A character within the game state representing a player's persona or NPC}
_Avoid_: Hero, avatar, unit

**Story**:
{A visual novel story path or narrative thread in Grenzwanderer}
_Avoid_: Quest, script, level

**Fact** (knowledge atom):
{A canonical, identifiable piece of information a Character may or may not hold. Clue-shaped Facts reuse Evidence IDs (`ev_*`); social Facts get their own IDs.}
_Avoid_: Flag (a flag is storage; a Fact is meaning), Clue (a clue is the player-facing surface of a Fact)

**Knowledge**:
{Whether a given Character holds a given Fact. Derived at runtime from an authored condition over phase + flags — never stored per Character×Fact, never auto-propagated between Characters.}
_Avoid_: Memory (see below)

**Evidence**:
{The Player's held Facts — the player-side resolver of Knowledge. `grant_evidence` adds Evidence; dialogue gates on it. Symmetric with a Character's Knowledge.}
_Avoid_: Knowledge (when you mean the player's side specifically, say Evidence)

**Memory** (deprecated as a single term):
{Overloaded. Splits into three independent concepts with different storage: Knowledge (facts an NPC holds, derived), Disposition (relationship axes like `lotte_warmth/suspicion`, stored vars), and episodic history (derivable from `domain_event_log` + flags). Name the specific one.}
_Avoid_: using "Memory" / "память" as a catch-all in design or code
