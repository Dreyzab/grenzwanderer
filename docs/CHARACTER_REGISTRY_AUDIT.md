# Character Registry Audit — Freiburg / Case01

Status: `[AUDIT SNAPSHOT / GRILL-WITH-DOCS]`  
Project: `grenzwanderer/Grenzwanderer`  
Date: 2026-06-30  
Scope: playable origins, Freiburg social runtime catalog, Case01 narrative roles, sprite-visible cast, Detectiv/StoryDetective `char_*.md` dossiers, and known identity drift.

This audit exists because the project has a large character surface. It should prevent future work from treating every old dossier as equal runtime canon.

## Source-of-truth stack

1. **Playable origins / runtime display / IDs / flags / scenes**: code and snapshots win.
2. **Freiburg social runtime catalog**: `scripts/data/freiburg_social_catalog.ts` defines live social NPC contacts and services.
3. **Case01 narrative roles**: `src/features/vn/characterRoles.ts` defines design-only role grammar.
4. **Sprite-visible cast**: `src/features/vn/characterSprites.ts` defines sprite production priority, not total canon.
5. **StoryDetective**: runtime-adjacent Case01 authoring vault.
6. **Detectiv**: design/reference vault; aliases and archetypes here do not automatically promote to runtime.
7. **Generated ledgers**: `docs/CHARACTER_BRIDGE_LEDGER.md` and `obsidian/StoryDetective/40_GameViewer/Case01/CASE01_CANON_LEDGER.md` are reports; fix their sources and regenerate.

## Audit summary

Official bridge result from `bun run content:character:bridge:check`:

- `0 error`
- `2 warn`
- `47 info`
- `81` char notes scanned
- `74` notes with `runtime_character_id`
- `3` notes with `knows:` matrix entries

Case01 canon ledger result from `bun run content:case01:canon:check`:

- `142` total Case01 nodes
- `48` covered by StoryDetective
- `94` bridged from TypeScript
- `0` missing ownership
- `0` identity drift findings

## Playable origins — canon layer

| Origin ID    | Canon display name      | Runtime role                            | Status |
| ------------ | ----------------------- | --------------------------------------- | ------ |
| `detective`  | Matthias Adler          | playable origin / investigator baseline | canon  |
| `journalist` | Arthur Vance            | playable origin / journalist route      | canon  |
| `aristocrat` | Charlotte von Waldstein | playable origin                         | canon  |
| `veteran`    | Gustav Eisenhart        | playable origin                         | canon  |
| `archivist`  | Martha Heller           | playable origin                         | canon  |
| `witch`      | Eleonora Hartmann       | playable origin / witch route           | canon  |

Policy implication: playable protagonist names are not generic aliases. `Arthur Vance` should not be reused as a detective alias once the identity cleanup is accepted.

## Freiburg social runtime catalog — live NPC contacts

Source: `scripts/data/freiburg_social_catalog.ts`.

| Runtime ID                   | Display name                | Faction             | Public role               | Tier       | Status                                                  |
| ---------------------------- | --------------------------- | ------------------- | ------------------------- | ---------- | ------------------------------------------------------- |
| `npc_weber_dispatcher`       | Lotte Weber                 | `city_chancellery`  | Chief telephone operator  | major      | canon runtime contact                                   |
| `npc_hedwig_weber`           | Hedwig Weber                | `the_returned`      | Bureau case handler       | major      | canon runtime contact; missing bound dossier            |
| `npc_dr_erasmus_lebrecht`    | Dr. Erasmus Lebrecht        | `the_returned`      | Immersion physician       | functional | canon runtime contact                                   |
| `npc_anna_mahler`            | Anna Mahler                 | `city_network`      | Railway fixer             | major      | canon runtime contact                                   |
| `npc_archivist_otto`         | Archivist Otto              | `city_chancellery`  | Records specialist        | functional | canon runtime contact                                   |
| `npc_mother_hartmann`        | Eleonora Hartmann           | `house_of_pledges`  | Aristocratic patron       | major      | canon runtime contact / playable witch identity overlap |
| `npc_felix_hartmann`         | Felix Hartmann              | `house_of_pledges`  | Junior field partner      | major      | canon runtime contact                                   |
| `npc_bureau_master`          | The Master                  | `the_returned`      | Bureau occult supervisor  | functional | canon runtime contact                                   |
| `npc_sasha_hartmann_servant` | Alexander "Sasha"           | `house_of_pledges`  | Hartmann family servant   | functional | canon runtime contact                                   |
| `npc_friedrich_wagner`       | Friedrich Wagner            | `the_returned`      | Dead estate accountant    | major      | canon runtime contact                                   |
| `npc_krebs_mugger`           | Krebs Mugger                | `free_yards`        | Street enforcer           | functional | canon runtime contact                                   |
| `npc_hotel_maid`             | Hotel Maid                  | `city_network`      | Zum Goldenen Adler maid   | functional | canon runtime contact                                   |
| `npc_apothecary`             | Adalbert Weiss              | `masters_union`     | Apothecary                | functional | canon runtime contact                                   |
| `npc_heinrich_galdermann`    | Heinrich Galdermann         | `house_of_pledges`  | Prokurist, Bankhaus Krebs | major      | canon runtime contact                                   |
| `npc_albrecht_stoll`         | Oberleutnant Albrecht Stoll | `city_chancellery`  | Serving pioneer officer   | major      | canon runtime contact                                   |
| `npc_emil_roth`              | Emil Roth                   | `masters_union`     | Book restorer             | functional | canon runtime contact                                   |
| `npc_anton_weber`            | Anton Weber                 | `city_chancellery`  | Reichspost route clerk    | functional | canon runtime contact                                   |
| `npc_rudi_kempf`             | Rudi Kempf                  | `city_network`      | Rail yard worker          | functional | canon runtime contact                                   |
| `npc_konrad_vossler`         | Konrad Vossler              | `college_of_reason` | Chemistry teacher         | functional | canon runtime contact / Case02 hook                     |

## Case01 narrative-role layer

Source: `src/features/vn/characterRoles.ts`. This is design-only role grammar, not the total runtime registry.

| Character ID                 | Display name                | Public role           | Hidden role / note                                          |
| ---------------------------- | --------------------------- | --------------------- | ----------------------------------------------------------- |
| `detective`                  | Detective                   | `player_anchor`       | player-facing investigator anchor                           |
| `npc_mother_hartmann`        | Eleonora Hartmann           | `patron_arranger`     | `concealed_threat`                                          |
| `npc_weber_dispatcher`       | Lotte Weber                 | `information_contact` | `noise_false_trail`                                         |
| `npc_sasha_hartmann_servant` | Alexander "Sasha"           | `support_ally`        | —                                                           |
| `npc_felix_hartmann`         | Felix Hartmann              | `support_ally`        | —                                                           |
| `npc_bureau_master`          | The Master                  | `information_contact` | `concealed_threat`                                          |
| `npc_heinrich_galdermann`    | Heinrich Galdermann         | `respectable_surface` | `culprit_by_signature`                                      |
| `npc_albrecht_stoll`         | Oberleutnant Albrecht Stoll | `respectable_surface` | `culprit_by_act`                                            |
| `npc_emil_roth`              | Emil Roth                   | `false_center`        | —                                                           |
| `npc_krebs_mugger`           | Krebs Mugger                | `contracted_fist`     | —                                                           |
| `npc_anton_weber`            | Anton Weber                 | `noise_false_trail`   | —                                                           |
| `npc_rudi_kempf`             | Rudi Kempf                  | `noise_false_trail`   | —                                                           |
| `npc_konrad_vossler`         | Konrad Vossler              | `mirror`              | —                                                           |
| `npc_architect`              | The Architect               | `negative_space`      | must not become a normal runtime contact without a decision |

## Sprite-visible cast

Source: `src/features/vn/characterSprites.ts`.

Sprite coverage is a production-priority signal, not a full canon list.

| Tier                       | Character IDs                                                                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Case01 primary sprite set  | `npc_mother_hartmann`, `npc_weber_dispatcher`, `npc_sasha_hartmann_servant`, `npc_felix_hartmann`, `detective`, `npc_bureau_master`             |
| Case01 casefile sprite set | `npc_heinrich_galdermann`, `npc_albrecht_stoll`, `npc_emil_roth`, `npc_krebs_mugger`, `npc_anton_weber`, `npc_rudi_kempf`, `npc_konrad_vossler` |

Notable gap: `npc_hedwig_weber` is a major runtime NPC but is not in the current sprite-visible set and has no bound dossier.

## High-risk identity collisions

These are the collisions that can poison future scenes if not fixed.

| Collision                                          | Current evidence                                                                                                                                    | Recommended policy                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Matthias Adler vs Arthur Vance                     | `originProfiles.ts` and `docs/JOURNALIST_ORIGIN_BIBLE.md` make Arthur the journalist; pre-audit identity rules treated Arthur as a detective alias. | Matthias = detective / `inspector`; Arthur = journalist only. Old Arthur-as-detective material becomes legacy reference. |
| Lotte Weber vs Lotte Fischer / `operator`          | Runtime/social catalog and relationship docs point to `npc_weber_dispatcher`; old identity ledger still says `operator` / Lotte Fischer.            | Lotte Weber = `npc_weber_dispatcher`; `operator` and Lotte Fischer are legacy aliases/reference.                         |
| Victoria Sterling vs Clara von Altenburg           | Current relationship docs and Case01 files use Victoria / `victoria_sterling`; Clara remains legacy planning shard.                                 | Victoria = scientific partner / shadow case; Clara = deprecated design shard unless promoted separately.                 |
| Baroness Elise vs Klara/Clara Altenburg            | Case01 Witch runtime uses Baroness Elise / `npc_baroness_elise`; Klara variants are legacy drift.                                                   | Baroness Elise = supported Witch-prologue estate identity; Klara variants legacy.                                        |
| Fritz Muller / Mueller / Müller                    | Runtime policy prefers `Fritz Muller`; variants are transliteration or locale aliases.                                                              | Keep runtime ASCII `Fritz Muller`; allow `Mueller`/`Müller` as aliases/localization only.                                |
| Bankhaus J.A. Krebs vs Kaiserbank / Bankhaus Krebs | Runtime display uses Bankhaus J.A. Krebs; Kaiserbank is legacy planning.                                                                            | Runtime display = Bankhaus J.A. Krebs.                                                                                   |
| Heinrich Galdermann spelling                       | Authoring contract guards `Heinrich Haldermann` / `Galderman` as aliases.                                                                           | Runtime display = Heinrich Galdermann.                                                                                   |

## Official bridge warnings

### 1. Duplicate same-vault runtime id: `enforcer`

`runtime_character_id 'enforcer'` is reused by two Detectiv notes:

- `obsidian/Detectiv/30_World_Intel/Characters/char_enforcer.md`
- `obsidian/Detectiv/30_World_Intel/Characters/char_warehouse_guard.md`

Severity: warning.  
Audit read: this is probably an archetype collision, not a live runtime contact collision. It still needs disambiguation if either note is promoted to runtime.

### 2. Unresolved runtime id: `npc_architect`

`obsidian/StoryDetective/40_GameViewer/Case01/_Characters/char_case01_architect.md` uses `runtime_character_id: npc_architect`, but this id does not resolve to social catalog, location cast, or character assets.

Severity: warning.  
Audit read: this is acceptable only if The Architect remains negative-space. If he becomes a live contact, `npc_architect` needs a runtime registry decision.

## Major runtime NPC without bound dossier

| Runtime ID         | Display name | Why it matters                                                                                                                        |
| ------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `npc_hedwig_weber` | Hedwig Weber | Used by the journalist route as Bureau sister / case handler; major tier but no `char_*.md` dossier bound via `runtime_character_id`. |

Recommendation: create or bind a dossier for Hedwig before expanding journalist route content further.

## Design/reference backlog

The Detectiv vault contains many design-only or unbound archetypes. They are not errors by themselves.

Examples include:

- `Academic Contact`
- `Archive Keeper`
- `Bank Teller`
- `Butler`
- `Kommissar Dietrich Richter`
- `Jakob Moser`
- `Faction Underground`
- `Fortune Teller`
- `Noble Patron`
- `Pneumatic Courier`
- `Student Leader`
- `Tailor Master`
- `Hans Bauer`

Policy: these stay `design/reference` until explicitly promoted into one of the runtime registries or tied to a supported StoryDetective scenario.

## Promotion rule proposed by this audit

A character becomes supported runtime canon only when at least one of these is true:

1. It appears as a playable origin in `originProfiles.ts`.
2. It appears in `FREIBURG_SOCIAL_CATALOG.npcIdentities`.
3. It appears in supported StoryDetective runtime scenes with a stable `characterId` and passes bridge/canon checks.
4. It appears in `characterRoles.ts` as a deliberate design-only role assignment and is documented as non-runtime if negative-space.

A character is not promoted merely because a `char_*.md` note exists in Detectiv.

## Open decisions for grill

1. Should high-risk identity collisions be patched immediately in `CASE01_CANON_IDENTITY.md` and `content-authoring-contract.ts`?
2. Should Hedwig Weber receive a bound `char_*.md` dossier now?
3. Should The Architect remain negative-space with explicit non-runtime wording, or should `npc_architect` become a registered runtime id?
4. Should the `enforcer` duplicate be split into two IDs before either note is promoted?
