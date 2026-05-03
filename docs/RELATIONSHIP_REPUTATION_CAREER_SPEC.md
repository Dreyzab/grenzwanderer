# Relationship, Reputation, and Career Spec

## Purpose

Define a hybrid social progression model where the player reads clear statuses, obligations, and career milestones while hidden numeric state remains available for branching, gating, and balance. The system must reinforce the agency-first map loop, rumor verification, and investigation consequences instead of competing with them.

## Current Runtime Anchors

- Backend authority lives in `spacetimedb/src/schema.ts`.
- Current relationship persistence already exists in `player_relationship` via `playerRelationship.value`.
- Hidden variables already exist through `player_var` and are a valid temporary home for `agency_standing`, `rep_*`, and milestone counters.
- VN and map runtime already support numeric relation gating and mutation through `relationship_gte` and `change_relationship` in `src/features/vn/types.ts`.
- Map binding gating already resolves relationships in `src/features/map/model/mapResolver.ts`.
- The current character dossier already exposes progression and faction-state surfaces in `src/features/character/CharacterPanel.tsx`.
- Current faction runtime now supports a canonical 8-faction registry via `socialCatalog.factions`, while legacy `rep_civic`, `rep_underworld`, and `rep_finance` remain compatibility fallback for migration-era psyche summaries.
- Career specialization foundation already exists in `src/features/character/originProfiles.ts` through origin tracks. Career rank must not become a second parallel specialization tree.
- Agency hub and map card exposure points already exist in `src/features/map/ui/DetectiveHub.tsx` and `src/features/map/ui/CaseCard.tsx`.
- Current command-mode content already demonstrates rumor and trust interplay in `spacetimedb/src/reducers/helpers/player_progression.ts` and related reducers (`map.ts`, `vn.ts`).

## Design Principles

- Numbers exist for logic and tuning, but statuses are the primary player-facing layer.
- Server-side runtime state is canonical. Client-side state is cache, projection, or adapter only.
- Relationship warmth and owed favors are separate concepts.
- Agency standing powers institutional career growth. Faction signals power city access, rumor quality, and side opportunities.
- Career progression is recognition through service milestones, not an automatic XP ladder.
- Each major case can contribute at most one major career credit to the same axis.
- Rumors matter only when they become actionable and verified.
- Low relationships must never hard-lock the main path. Alternate routes remain available but cost more, take longer, or create collateral damage.
- Favors are social obligations, not shop currency.

## Canonical Authority

- Canonical authority: SpacetimeDB tables and reducers.
- UI authority: derived bands, trend labels, dossier summaries, and contextual wording.
- Transitional authority: `player_var` and `player_flag` may hold temporary career and rumor state until dedicated schema is added.
- Forbidden pattern: mutable client-only relationship or reputation truth that diverges from backend state.

## Domain Model

### Character Relationship Model

Each important NPC has four distinct layers:

| Layer          | Type                   | Visibility    | Purpose                                                        |
| -------------- | ---------------------- | ------------- | -------------------------------------------------------------- |
| `trustScore`   | number, `-100..100`    | hidden        | Branching, soft gating, pricing, fallback cost                 |
| `statusBand`   | enum                   | visible       | Human-readable relationship state in dossier and contextual UI |
| `favorLedger`  | list of obligations    | hidden/system | Tracks who owes whom, why, and whether the debt is still valid |
| `favorBalance` | signed derived summary | mostly hidden | Fast check for UI copy and simple gating                       |

- `trustScore` is the direct evolution of the current `playerRelationship.value`.
- `statusBand` is derived from `trustScore`. It must never become a second editable source of truth.
- `favorLedger` is authoritative for obligations. `favorBalance` is a summary, not the source record.
- Positive `favorBalance` means the NPC owes the player.
- Negative `favorBalance` means the player owes the NPC.

### Relationship Matrix

| Visible status        | Hidden trust range | Narrative tone                     | Practical effects                                                |
| --------------------- | ------------------ | ---------------------------------- | ---------------------------------------------------------------- |
| Shut Out              | `<= -40`           | Active distrust or social refusal  | Worse hints, higher service friction, dirty fallback routes only |
| Strained Acquaintance | `-39..-10`         | Tense contact, limited cooperation | Partial info, higher risk, extra verification steps              |
| Working Contact       | `-9..24`           | Functional but conditional         | Standard services, neutral rumor quality, ordinary pricing       |
| Reliable Contact      | `25..59`           | Consistent cooperation             | Better hints, safer routes, lower service friction               |
| Ally                  | `60+`              | Strong loyalty or shared cause     | Priority access, proactive warnings, premium social options      |

### Favor Obligation Types

Each favor entry should record a type and a source so that obligations feel authored rather than abstract:

| Favor type   | Typical use                            | Example outcome                            |
| ------------ | -------------------------------------- | ------------------------------------------ |
| Information  | Rumor, testimony, document leak        | An informant owes one verified lead        |
| Access       | Door, archive, permit, backstage entry | A clerk opens a restricted route once      |
| Cover        | Alibi, silence, temporary shelter      | A witness protects the player from fallout |
| Introduction | Social bridge into a new circle        | A patron arranges an audience              |
| Protection   | Physical or procedural shielding       | A bureau superior delays a sanction        |

Recommended fields for each favor entry:

- `favorId`
- `characterId`
- `direction`
- `favorType`
- `weight`
- `sourceCaseId`
- `sourceRumorId`
- `note`
- `createdAt`
- `expiresAt`
- `resolvedAt`
- `status`

### Trust Growth and Loss Triggers

- Trust increases when the player protects the NPC's interests, verifies their information, shares credit, or resolves a case without burning their network.
- Trust decreases when the player lies badly, exposes the NPC, ignores prior obligations, escalates heat onto their circle, or treats them as disposable.
- Favors are created by concrete social acts, not by raw trust delta.
- Trust can drop while `favorBalance` stays positive.
- Trust can rise while the player still owes a serious favor.

## Reputation Model

### Agency Standing

`AgencyStanding` is the main institutional reputation used for promotion checks and formal privileges.

Recommended hidden range:

- `0..100`, clamped

Recommended visible bands:

| Visible band       | Hidden standing |
| ------------------ | --------------- |
| Under Observation  | `0..19`         |
| On Probation       | `20..39`        |
| Reliable Operative | `40..59`        |
| Valued Agent       | `60..79`        |
| Face of the Agency | `80..100`       |

Rules:

- This is a bureau-facing metric, not a citywide moral score.
- It should move on case closure, debrief quality, source handling, procedural discipline, and verified intelligence.
- It should not move for every minor dialogue beat.
- UI should show the band and the current trend, not the raw number.

### Faction Signals

`FactionSignals` represent how Freiburg factions and social environments currently interpret the player's methods.

Recommended hidden range per faction:

- `-100..100`

Canonical gameplay faction registry in this repo:

- `city_chancellery`
- `masters_union`
- `college_of_reason`
- `chapter_of_mercy`
- `house_of_pledges`
- `city_network`
- `free_yards`
- hidden `the_returned`

Public psyche layers:

- `daylight`
- `political`
- `shadow`

Compatibility fallback that remains readable during migration:

- `civic_order -> daylight`
- `financial_bloc -> political`
- `underworld -> shadow`
- `rep_civic`
- `rep_finance`
- `rep_underworld`

Rules:

- Faction signals do not determine rank promotion.
- They influence rumor density, clue quality, service cost, access friction, side-scene availability, and hidden-map openings.
- High standing with one faction can increase suspicion elsewhere.
- Public Character/Psyche should show canonical public factions only, never the old three bloc ids.
- Public layer alignment is derived from positive canonical public contributions first, with legacy fallback only when a layer has no canonical contribution.
- `the_returned` remains a hidden runtime faction and does not appear in the normal Character/Psyche presentation.
- Factions may be revealed by contact or by pressure; pressure reveal means the player has felt that milieu acting on the case, not necessarily joined it.
- The dossier should summarize layer pressure and faction-state directionality rather than raw bars in the long-term target UX.
- Debug and dev tooling may still expose numbers.

## Career Model

### Career vs Origin Tracks

- Career rank is institutional recognition.
- Origin tracks are the player's personal specialization fantasy.
- Rank unlocks agency privileges and case authority.
- Origin tracks shape how the player solves cases.
- A promotion must never feel like a replacement for origin-track growth.
- Career and origin progression may advance in the same case, but they should reward different axes.

### Rank Ladder Spec

| Rank              | Standing floor | Qualification case requirement          | Service criteria requirement | Privileges                                                                               |
| ----------------- | -------------- | --------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------- |
| Trainee           | `0`            | Agency onboarding completed             | None                         | Access to bureau briefings and basic dossiers                                            |
| Junior Detective  | `20`           | First qualification case closed         | `2 of 3` criteria            | Basic requisition, first formal warrants, visible bureau trust                           |
| Agency Detective  | `40`           | Major case or special assignment closed | `2 of 3` criteria            | Better briefing choices, official escalation routes, improved source protection requests |
| Senior Detective  | `65`           | Cross-faction or high-risk case closed  | `2 of 3` criteria            | Expanded bureau support, higher-value partners, cleaner fallback options                 |
| Lead Investigator | `85`           | Capstone investigation closed           | `2 of 3` criteria            | Priority case authority, wider resource reach, top-tier briefing influence               |

### Standard Promotion Criteria

Every promotion tier after onboarding should evaluate `2 of 3` service criteria:

| Criterion            | Requirement                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Verified rumor chain | A rumor was checked and converted into evidence, access, or a major breakthrough                                 |
| Network preservation | A key source or contact was preserved and the case did not burn the relevant social network                      |
| Clean case assembly  | The case was built with enough evidence, witness support, and a defensible conclusion without procedural failure |

Rules:

- A single case may satisfy multiple criteria, but it should count only once toward the same promotion packet.
- Qualification cases should be explicit in the report layer.
- Promotion should be awarded in debrief or return-to-agency flow, not silently on field completion.

## Rumor-To-Lead Rules

### Rumor State Class

Rumors must stop being an ad hoc pile of flags. They should become a first-class state object.

Recommended fields:

| Field            | Purpose                                                 |
| ---------------- | ------------------------------------------------------- |
| `rumorId`        | Stable identifier                                       |
| `sourceType`     | Contact, faction, briefing, witness, environment        |
| `sourceId`       | Who or what produced the rumor                          |
| `factionKey`     | Which social bloc colors the rumor                      |
| `subject`        | What the rumor is about                                 |
| `locationHint`   | Where it points                                         |
| `credibility`    | Hidden tuning for how much confirmation is still needed |
| `heatRisk`       | Hidden risk of pursuing it                              |
| `status`         | Current rumor lifecycle state                           |
| `linkedLeadId`   | Optional spawned lead or map event                      |
| `discoveredAt`   | Audit and expiration anchor                             |
| `expiresAt`      | Timeliness and decay                                    |
| `resolvedCaseId` | Which case consumed it                                  |

Recommended statuses:

| Status     | Meaning                                                    |
| ---------- | ---------------------------------------------------------- |
| `heard`    | The player encountered a rumor but has not acted on it     |
| `logged`   | The agency or dossier has recorded it                      |
| `pursuing` | The player is actively checking it                         |
| `verified` | It produced evidence, access, or a meaningful breakthrough |
| `spent`    | Its narrative value has been consumed                      |
| `burned`   | It collapsed, was compromised, or was knowingly mishandled |

### Verification Rules

- A rumor becomes a lead only when a player action verifies it.
- Verification can come from evidence, second-source confirmation, scene breakthrough, unlocked location access, or command-mode results.
- A verified rumor should spawn or update a hidden-map opportunity, usually through the existing `player_map_event` path.
- A rumor counts as career-relevant only once it reaches `verified`.
- A false or burned rumor should still leave consequences, usually heat, distrust, or faction drift.

### Current Runtime Mapping

- `playerMapEvent` is the natural storage target for spawned or temporary leads.
- `spawn_map_event` already exists in VN and map actions and should remain the preferred hook for turning verified rumors into map content.
- Until a dedicated rumor table exists, rumor state can be staged in `player_var` and `player_flag`, but only as a migration bridge.

## Agency Reputation Rules

### What Raises Agency Standing

- Closing a qualification case with a defensible report.
- Verifying a rumor that materially advances a bureau objective.
- Preserving a useful source or network while still producing results.
- Using procedure well enough to avoid avoidable fallout.
- Returning from the field with evidence that reduces uncertainty for the agency.

### What Lowers Agency Standing

- Filing weak conclusions without evidence support.
- Burning sources carelessly.
- Triggering avoidable procedural failure.
- Chasing noise and returning with nothing after consuming major agency resources.
- Repeatedly solving immediate problems in ways that damage the bureau's long-term operating capacity.

### Interaction With Faction Signals

- A case can improve agency standing while worsening one or more faction signals.
- A case can strengthen a faction signal while harming agency standing if the bureau sees the method as reckless or compromised.
- This tension is intentional and should drive map, rumor, and partner choices.

### Required Gameplay Effects

- Agency standing affects bureau briefings, support actions, promotion eligibility, and formal access routes.
- Faction signals affect hidden-map openings, rumor quality, contact pricing, and safer versus dirtier approaches.
- Neither system should exist as isolated flavor text.

## UI Exposure Map

| Surface                            | Current anchor                              | Player-facing content                                                                       | Hidden logic kept off-screen                                      |
| ---------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Character dossier header           | `src/features/character/CharacterPanel.tsx` | Current rank, agency band, primary faction direction, active origin specialization          | Raw standing score, exact faction values                          |
| Character dossier profile tab      | `src/features/character/CharacterPanel.tsx` | Career milestone summary, qualification case state, current bureau privileges               | Promotion counters and threshold math                             |
| Character dossier psyche tab       | `src/features/character/CharacterPanel.tsx` | Canonical public faction rows, reveal reason, `daylight/political/shadow` alignment summary | Exact faction scores, hidden `the_returned`, raw `rep_*` fallback |
| Character dossier contacts section | future addition in dossier or hub           | Relationship status, one-line obligation state, recent trend                                | Raw trust score and full favor ledger                             |
| Agency hub partner list            | `src/features/map/ui/DetectiveHub.tsx`      | Contact role, status band, owed favor note, availability                                    | Exact trust value and gating thresholds                           |
| Map case card                      | `src/features/map/ui/CaseCard.tsx`          | Contextual requirements such as warrant access, owed favor, or trusted contact path         | Numeric conditions and alternate-cost calculations                |
| VN scene feedback                  | VN overlay and toast layer                  | Immediate social consequence copy such as status shifts, favor created, standing improved   | Raw delta values                                                  |
| Post-case debrief                  | return-to-agency flow                       | Promotion progress, source outcome, verified-rumor result, bureau reaction                  | Internal scoring weights                                          |

### Exposure Rules

- Permanent progression belongs in the character dossier and agency debrief.
- Moment-to-moment consequence feedback belongs in VN scene summaries and toasts.
- Tactical requirement messaging belongs in map cards and partner lists.
- Raw numbers belong only in debug or internal tools.

## Data Authority and Migration Rules

### Phase 0: Minimal-Change Mapping

This phase keeps the current schema mostly intact.

- Treat `playerRelationship.value` as `trustScore`.
- Derive `statusBand` in shared helpers or UI selectors.
- Keep faction signals in `player_var` using the existing `rep_*` keys.
- Add `agency_standing` and promotion milestone vars or flags if needed before dedicated tables exist.
- Keep relation gating on numeric trust through existing `relationship_gte`.
- Use `player_map_event` plus `spawn_map_event` for rumor-driven leads.

### Phase 1: First-Class Social and Career Entities

Recommended dedicated tables once schema changes are greenlit:

| Table                   | Purpose                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| `player_favor_ledger`   | Persistent social obligations and their lifecycle                    |
| `player_rumor`          | Rumor state, verification, and expiration                            |
| `player_agency_career`  | Rank, standing, qualification packet state                           |
| `player_faction_signal` | Optional dedicated faction storage if `player_var` becomes too loose |

Rules:

- Promotion packet state should be stored explicitly, not inferred from brittle flag soup.
- Rumors need stable identifiers and lifecycle state.
- Favor records need provenance so narrative and systems can reference the same obligation.

## Behavioral Rules for Content Authors

- Every important NPC should define a trust-sensitive route and at least one favor-sensitive route.
- Every major case should contain at least one rumor that can become a lead.
- Every major case should create a meaningful social consequence in trust, favor, standing, faction drift, or career criteria.
- Every key gate should define a fallback route with higher cost or dirtier consequences.
- Promotions should be surfaced through debrief ritual, not surprise background math.

## Non-Goals

- No second visible XP bar for agency rank.
- No favor-to-money conversion.
- No client-owned relationship truth.
- No replacing origin tracks with a bureau rank tree.
- No main-path softlocks caused by one low-trust NPC.

## Expected Outcome

If implemented as specified:

- Relationships read as story but compute as system.
- Reputation affects the map, rumor economy, and access instead of existing as detached flavor.
- Career feels like recognition inside the agency rather than automatic leveling.
- Existing Grenzwanderer runtime contracts remain usable, with minimal-change migration from current trust, vars, and map-event primitives.
