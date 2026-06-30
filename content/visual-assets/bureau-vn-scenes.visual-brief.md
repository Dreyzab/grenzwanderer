# Bureau VN Scenes Visual Brief

Purpose: reusable T1 VN backgrounds for the Bureau floors introduced by the
interactive Bureau floor explorer. These are candidate assets for split-mode
scenes and do not replace existing `witch_bureau_*` CG beats until approved.

Status: pilot approved on 2026-06-23. Full `minus-1` T1 batch generated
on 2026-06-23 as candidate assets, not wired into runtime.

First saved candidate:
`public/images/scenes/bureau-arrival/bg_bureau_archive_hall_t1_pilot.webp`.

## Shared T1 Direction

- Runtime: `split`.
- Production tier: `T1_VN`.
- Framing: 16:9 wide establishing shot, empty scene, no people, no silhouettes.
- Composition: sprite-safe center and lower foreground, readable mid-ground
  depth, no foreground clutter that blocks characters.
- Style: oil painting, broad expressive brushstrokes, visible canvas texture,
  painterly semi-realistic European gothic VN background, less detailed than
  fullscreen CG.
- Continuity anchors: dark oak, aged brass, wax seals, old paper, dried
  lavender, cool underground stone, warm bureaucratic lamplight.
- Avoid: readable text, modern objects, gore, ritual circles, fantasy portals,
  neon, CGI gloss, anime styling, generic fantasy dungeon staging.

## Pilot Asset

### `bureau_archive_hall_t1_pilot`

Target file:
`public/images/scenes/bureau-arrival/bg_bureau_archive_hall_t1_pilot.webp`

Meta file:
`public/images/scenes/bureau-arrival/bg_bureau_archive_hall_t1_pilot.meta.json`

Use: reusable establishing/background plate for the Bureau archive hall beneath
Freiburg Hauptbahnhof. It bridges the existing Bureau CGs and the -1 floor plan
without replacing either.

QA read: the center corridor is open enough for sprites, the room reads as
archival Bureau infrastructure, and documents do not contain readable text.

Promotion: retained as the style gate and promoted by copy into canonical
connector asset `bureau_b1_corridor_services_t1`.

## -1 Floor Production Plan

Floor source: `BureauFloorExplorer`, floor id `minus-1`, role "Archive and
laboratories". Use this as the first complete Bureau VN background batch.

Batch rule: each room gets a T1 VN background candidate first. Stronger T2 or
T3 treatments can be derived later only for dramatic beats.

| Asset id                         | Room                      | Runtime use                                  | Prompt focus                                                                                         |
| -------------------------------- | ------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `bureau_b1_stairs_hall_t1`       | Stair hall                | Arrival, vertical route, security checkpoint | Stone stair landing, service lamp, archive seals, route control, doors toward archive and lower labs |
| `bureau_b1_archive_t1`           | Archive                   | Dossier search, evidence retrieval           | Tall dark shelves, case folders, index drawers, wax seals, lavender, restricted institutional order  |
| `bureau_b1_reading_room_t1`      | Archive reading room      | Dialogue and document review                 | Long table, green-shaded lamps, file rests, closed folders, quiet controlled study space             |
| `bureau_b1_catalog_t1`           | Cataloging and records    | Procedure, clue indexing                     | Card catalog wall, ledger desk, numbered tabs as abstract marks, no readable labels                  |
| `bureau_b1_lab_a_t1`             | Research laboratory A     | Primary tests                                | Brass instruments, glass vessels, measuring frames, sterile order, restrained occult science         |
| `bureau_b1_lab_b_t1`             | Research laboratory B     | Separated experiment zone                    | Secondary bench layout, partition screen, isolation cabinet, cooler shadowed lamplight               |
| `bureau_b1_reagents_t1`          | Reagent storage           | Restricted supplies                          | Locked cabinets, amber bottles without readable labels, hazard order implied by placement            |
| `bureau_b1_decon_t1`             | Deactivation and cleaning | Contamination protocol                       | Stone wash area, protective hooks, drains, clean towels, institutional caution without gore          |
| `bureau_b1_photo_lab_t1`         | Photo laboratory          | Evidence images                              | Darkroom trays, glass plates, red safelight, hanging negatives as abstract shapes                    |
| `bureau_b1_workshop_t1`          | Instrument workshop       | Device repair                                | Brass tools, calibration bench, field instruments, parts drawers, practical engineering              |
| `bureau_b1_corridor_services_t1` | Corridor and services     | Generic transit/dialogue                     | Long underground corridor, cross-doors, pipes, archive carts, strongest reusable floor connector     |
| `bureau_b1_service_closet_t1`    | Service closet            | Supplies, hidden pickup                      | Crates, packing paper, spare sample boxes, small service lamp, no dramatic reveal                    |

## Batch Prompt Template

Use case: historical-scene
Asset type: T1 VN split-mode reusable background, 16:9 visual novel background
candidate
Primary request: Secret Bureau [room name] beneath Freiburg Hauptbahnhof, 1905.
Scene/backdrop: [room-specific focus], underground anti-paranormal agency
infrastructure, dark oak, aged brass, old paper, wax seals, cool stone.
Style/medium: oil painting, broad expressive brushstrokes, visible canvas
texture, painterly semi-realistic European gothic visual novel background, less
detailed than fullscreen CG, readable for recurring dialogue scenes.
Composition/framing: wide establishing shot, empty scene with no people, no
human silhouettes, sprite-safe center and lower foreground, readable mid-ground
depth, no foreground clutter blocking the center.
Lighting/mood: warm bureaucratic lamplight against cool underground stone,
controlled pressure, secret but not theatrical horror.
Text: no readable text anywhere; documents and labels may have abstract marks
only.
Constraints: 1905 Kaiser-era Germany, historical veracity, no modern objects,
no readable labels or signage, no gore, no ritual circles, no fantasy portal,
no neon, no CGI look, no anime, no watermark.

## Completed -1 Floor Batch

Batch id: `bureau_minus_1_t1_v1`.

Exact final prompt strings are stored in each asset's `.meta.json` under
`finalPrompt`, with `finalPromptSha256` for verification.

| Asset id                         | Room id           | Image                                    | Meta                                          | QA note                                                        |
| -------------------------------- | ----------------- | ---------------------------------------- | --------------------------------------------- | -------------------------------------------------------------- |
| `bureau_b1_corridor_services_t1` | `b1-corridor`     | `bg_bureau_b1_corridor_services_t1.webp` | `bg_bureau_b1_corridor_services_t1.meta.json` | Promoted copy from pilot; sprite-safe central corridor         |
| `bureau_b1_stairs_hall_t1`       | `b1-stairs`       | `bg_bureau_b1_stairs_hall_t1.webp`       | `bg_bureau_b1_stairs_hall_t1.meta.json`       | Service stair node; no readable signage                        |
| `bureau_b1_archive_t1`           | `b1-archive`      | `bg_bureau_b1_archive_t1.webp`           | `bg_bureau_b1_archive_t1.meta.json`           | Dense archive storage with open aisle                          |
| `bureau_b1_reading_room_t1`      | `b1-reading-room` | `bg_bureau_b1_reading_room_t1.webp`      | `bg_bureau_b1_reading_room_t1.meta.json`      | Reading table leaves staging room                              |
| `bureau_b1_catalog_t1`           | `b1-catalog`      | `bg_bureau_b1_catalog_t1.webp`           | `bg_bureau_b1_catalog_t1.meta.json`           | Catalog drawers and abstract records only                      |
| `bureau_b1_lab_a_t1`             | `b1-lab-a`        | `bg_bureau_b1_lab_a_t1.webp`             | `bg_bureau_b1_lab_a_t1.meta.json`             | Accepted after rejecting two variants with human wall diagrams |
| `bureau_b1_lab_b_t1`             | `b1-lab-b`        | `bg_bureau_b1_lab_b_t1.webp`             | `bg_bureau_b1_lab_b_t1.meta.json`             | Separate lab zone without human imagery                        |
| `bureau_b1_reagents_t1`          | `b1-reagents`     | `bg_bureau_b1_reagents_t1.webp`          | `bg_bureau_b1_reagents_t1.meta.json`          | Locked reagent storage; no readable labels                     |
| `bureau_b1_decon_t1`             | `b1-decon`        | `bg_bureau_b1_decon_t1.webp`             | `bg_bureau_b1_decon_t1.meta.json`             | Clean deactivation room; no gore/body traces                   |
| `bureau_b1_photo_lab_t1`         | `b1-photo`        | `bg_bureau_b1_photo_lab_t1.webp`         | `bg_bureau_b1_photo_lab_t1.meta.json`         | Red safelight darkroom; negatives abstract only                |
| `bureau_b1_workshop_t1`          | `b1-workshop`     | `bg_bureau_b1_workshop_t1.webp`          | `bg_bureau_b1_workshop_t1.meta.json`          | Instrument workshop; practical, not steampunk excess           |
| `bureau_b1_service_closet_t1`    | `b1-closet`       | `bg_bureau_b1_service_closet_t1.webp`    | `bg_bureau_b1_service_closet_t1.meta.json`    | Compact supplies room with open lower foreground               |

## Batch Production Order

The -1 floor was generated as a controlled batch in this order:

1. `bureau_b1_corridor_services_t1`
2. `bureau_b1_stairs_hall_t1`
3. `bureau_b1_archive_t1`
4. `bureau_b1_reading_room_t1`
5. `bureau_b1_catalog_t1`
6. `bureau_b1_lab_a_t1`
7. `bureau_b1_lab_b_t1`
8. `bureau_b1_reagents_t1`
9. `bureau_b1_decon_t1`
10. `bureau_b1_photo_lab_t1`
11. `bureau_b1_workshop_t1`
12. `bureau_b1_service_closet_t1`

Reasoning: start with the corridor and stairs because they establish floor
continuity. Then produce the archive cluster, then the lab/service rooms.

## Batch QA Notes

- All canonical outputs are WebP files at `1672x941`.
- All canonical outputs remain candidate assets and are not referenced by
  runtime scene code.
- Visual QA target: no people, no silhouettes, no readable text, no modern
  objects, no gore, and no staging-blocking foreground clutter.
- Metadata QA target: each canonical meta includes `productionBatch`,
  `floorId`, `roomId`, `roomNumber`, `roomTitle`, `roomAccess`,
  `styleGateAssetId`, `finalPromptSha256`, and `assetSha256`.

## Completed -2 Floor Batch

Batch id: `bureau_minus_2_t1_v1`.

Floor source: `BureauFloorExplorer`, floor id `minus-2`, role "Laboratories
and chambers". The batch contains 12 map-bound T1 VN background candidates and
one visual-only armory candidate. None are wired into runtime.

Updated art direction: `bureau_b2_artifacts_t1` and `bureau_b2_armory_t1` were
revised after first pass to be brighter, more mystical, and more fantasy-
inflected while preserving Bureau institutional control and 1905 material
language.

Exact final prompt strings are stored in each asset's `.meta.json` under
`finalPrompt`, with `finalPromptSha256` for verification.

| Asset id                           | Room id            | Image                                      | Meta                                            | QA note                                              |
| ---------------------------------- | ------------------ | ------------------------------------------ | ----------------------------------------------- | ---------------------------------------------------- |
| `bureau_b2_stairs_hall_t1`         | `b2-stairs`        | `bg_bureau_b2_stairs_hall_t1.webp`         | `bg_bureau_b2_stairs_hall_t1.meta.json`         | Deep restricted stair hall                           |
| `bureau_b2_corridor_t1`            | `b2-corridor`      | `bg_bureau_b2_corridor_t1.webp`            | `bg_bureau_b2_corridor_t1.meta.json`            | Central restricted corridor                          |
| `bureau_b2_parapsychology_lab_t1`  | `b2-para-lab`      | `bg_bureau_b2_parapsychology_lab_t1.webp`  | `bg_bureau_b2_parapsychology_lab_t1.meta.json`  | Parapsychology lab, non-ritual staging               |
| `bureau_b2_physical_lab_t1`        | `b2-physical-lab`  | `bg_bureau_b2_physical_lab_t1.webp`        | `bg_bureau_b2_physical_lab_t1.meta.json`        | Accepted reroll without symbolic wall diagram        |
| `bureau_b2_observation_chamber_t1` | `b2-observation`   | `bg_bureau_b2_observation_chamber_t1.webp` | `bg_bureau_b2_observation_chamber_t1.meta.json` | Empty controlled observation room                    |
| `bureau_b2_isolation_room_t1`      | `b2-interrogation` | `bg_bureau_b2_isolation_room_t1.webp`      | `bg_bureau_b2_isolation_room_t1.meta.json`      | Negotiation/interrogation room without torture props |
| `bureau_b2_artifacts_t1`           | `b2-artifacts`     | `bg_bureau_b2_artifacts_t1.webp`           | `bg_bureau_b2_artifacts_t1.meta.json`           | Bright mystical containment repository               |
| `bureau_b2_reagent_prep_t1`        | `b2-reagent-prep`  | `bg_bureau_b2_reagent_prep_t1.webp`        | `bg_bureau_b2_reagent_prep_t1.meta.json`        | Deep reagent preparation room                        |
| `bureau_b2_cold_storage_t1`        | `b2-cold-storage`  | `bg_bureau_b2_cold_storage_t1.webp`        | `bg_bureau_b2_cold_storage_t1.meta.json`        | Cold sample storage, not a morgue                    |
| `bureau_b2_staff_rest_t1`          | `b2-rest`          | `bg_bureau_b2_staff_rest_t1.webp`          | `bg_bureau_b2_staff_rest_t1.meta.json`          | Staff recovery room                                  |
| `bureau_b2_technical_room_t1`      | `b2-technical`     | `bg_bureau_b2_technical_room_t1.webp`      | `bg_bureau_b2_technical_room_t1.meta.json`      | Ventilation and maintenance room                     |
| `bureau_b2_service_storage_t1`     | `b2-service`       | `bg_bureau_b2_service_storage_t1.webp`     | `bg_bureau_b2_service_storage_t1.meta.json`     | Laboratory service storage                           |
| `bureau_b2_armory_t1`              | `b2-armory-visual` | `bg_bureau_b2_armory_t1.webp`              | `bg_bureau_b2_armory_t1.meta.json`              | Visual-only mystical armory; not present in map      |

## -2 Batch QA Notes

- All canonical `bureau_b2_*` outputs are WebP files at `1672x941`.
- `bureau_b2_armory_t1` is intentionally `visualOnly: true` with
  `mapRoomId: null`; the interactive floor map was not changed.
- `bureau_b2_artifacts_t1` and `bureau_b2_armory_t1` intentionally allow
  brighter mystical/fantasy color accents, glow, and contained arcane objects.
- All outputs remain candidate assets and are not referenced by runtime scene
  code.
