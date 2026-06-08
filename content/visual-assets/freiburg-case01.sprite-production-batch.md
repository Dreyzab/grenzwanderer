# Freiburg Case01 Sprite Production Batch

Date: 2026-06-04
Mode: built-in image_gen, then local chroma-key removal for sprite PNG alpha.
Batch: primary `body_base` sprites, clean-face revision.

## Production Assets

- Eleonora Hartmann: `/images/characters/sprites/eleonora_hartmann/body/body_base.png`
- Felix Hartmann: `/images/characters/sprites/felix_hartmann/body/body_base.png`
- Detective: `/images/characters/sprites/detective/body/body_base.png`
- Bureau Master: `/images/characters/sprites/bureau_master/body/body_base.png`
- Lotte Weber: `/images/characters/sprites/lotte_weber/body/body_base.png`
- Alexander "Sasha": `/images/characters/sprites/sasha_hartmann_servant/body/body_base.png`
- Review contact sheet: `/images/characters/sprites/_style_tests/preview_case01_primary_sprites_clean_faces.png`

## Prompt Set Notes

All prompts used the approved full-body painterly semi-realistic European gothic VN sprite direction, a flat chroma-key background, centered full-body framing, generous padding, no cast shadow, no text, no watermark, no anime, and no modern clothing.

Face rendering rule: faces should stay clean and readable, with smooth tonal transitions and soft skin-plane color shifts. Keep strong brush texture on clothing, hair, and silhouette; avoid harsh facial brush marks, muddy skin, soot-like grime, over-sharp makeup edges, or high-contrast patches that make the face look dirty or artificially aged.

### Eleonora Hartmann

Revised prompt anchor: exactly 38 years old, mature and aristocratic but not elderly; clean elegant face, clear smooth skin, no grime, no soot, no mottled dirty texture, no heavy wrinkles. Black mourning lace over ivory high-neck Hartmann dress, black gloves, restrained old-gold jewelry, cold crimson accent. The Witch is implied through etiquette and control, not monster features.

### Felix Hartmann

Revised prompt anchor: early twenties, tired intelligent young Hartmann gentleman, clean pale face with slight under-eye tiredness but no dirty painterly stains. Dark suit, cream waistcoat, high collar, muted tie, pocket watch chain, hat held low.

### Detective

Revised prompt anchor: observant tired man with clean readable face, natural period portrait shading, no grime or soot. Practical investigative travel coat, waistcoat, notebook, gloves, hat; restrained and useful rather than heroic.

### Bureau Master

Revised prompt anchor: older severe institutional supervisor with clear intentional age lines but no muddy face texture. Sober dark formal Bureau clothing, dossier and sealed vial, restrained occult authority rather than wizard or villain costume.

### Lotte Weber

Promoted from approved style test. Anchor: lively red-haired chief telephone operator and hidden journalist, green 1900 business suit, notebook and pencil, joyful but observant.

### Alexander "Sasha"

Promoted from approved style test. Anchor: strong 44-year-old Russian veteran serving the Hartmann family, plain dark travel livery, old scar, disciplined stillness, no medals or military uniform.

## Known Cleanup

- Eleonora's lace edge can show slight green matte residue in some viewers because the body-base source used green chroma key. Final sprite cleanup may need a purple-key regeneration or edge-specific matte pass.
- Facial expression layers, separate eyes/brows/mouth assets, and overlays are not produced in this batch.
