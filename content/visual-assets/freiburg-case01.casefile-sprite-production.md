# Freiburg Case01 Casefile Sprite Production

Date: 2026-06-04
Mode: built-in image_gen, flat magenta chroma-key source, then local chroma-key removal for PNG alpha.
Batch: suspect, false-trail, and mirror `body_base` sprites for the Case 01 bank/theft line.

## Production Assets

- Heinrich Galdermann: `/images/characters/sprites/heinrich_galdermann/body/body_base.png`
- Oberleutnant Albrecht Stoll: `/images/characters/sprites/albrecht_stoll/body/body_base.png`
- Emil Roth: `/images/characters/sprites/emil_roth/body/body_base.png`
- Krebs Mugger: `/images/characters/sprites/krebs_mugger/body/body_base.png`
- Anton Weber: `/images/characters/sprites/anton_weber/body/body_base.png`
- Rudi Kempf: `/images/characters/sprites/rudi_kempf/body/body_base.png`
- Konrad Vossler: `/images/characters/sprites/konrad_vossler/body/body_base.png`
- Body-base review contact sheet: `/images/characters/sprites/_style_tests/preview_case01_casefile_sprites.png`
- Portrait review contact sheet: `/images/characters/sprites/_style_tests/preview_case01_casefile_portraits.png`

## Portrait Outputs

- Heinrich Galdermann: `/images/characters/heinrich_galdermann/heinrich_galdermann.webp`
- Oberleutnant Albrecht Stoll: `/images/characters/albrecht_stoll/albrecht_stoll.webp`
- Emil Roth: `/images/characters/emil_roth/emil_roth.webp`
- Krebs Mugger: `/images/characters/krebs_mugger/krebs_mugger.webp`
- Anton Weber: `/images/characters/anton_weber/anton_weber.webp`
- Rudi Kempf: `/images/characters/rudi_kempf/rudi_kempf.webp`
- Konrad Vossler: `/images/characters/konrad_vossler/konrad_vossler.webp`

## Prompt Set Notes

All prompts used the approved full-body painterly semi-realistic European gothic VN sprite direction, a flat removable `#ff00ff` chroma-key background, centered full-body framing, generous padding, no cast shadow, no text, no watermark, no anime, and no modern clothing.

Face rendering rule: faces should stay clean and readable, with smooth tonal transitions and soft skin-plane color shifts. Keep strong brush texture on clothing, hair, and silhouette; avoid harsh facial brush marks, muddy skin, soot-like grime, over-sharp makeup edges, or high-contrast patches that make the face look dirty or artificially aged.

### Heinrich Galdermann

Full-body sprite of a broad, respectable Freiburg bank prokurist around 50. Expensive waistcoat, dark formal suit, perfectly parted hair, damp handkerchief held as part of the gesture, leather folder or report. His face should smile like an official signature: courteous, guilty, not openly villainous.

### Oberleutnant Albrecht Stoll

Full-body sprite of a disciplined 1900 German pioneer officer/sapper. Broad shoulders, dark field coat over military tailoring, heavy chemical-protection gloves, thermite grime on cuffs, scarred knuckle, mathematical calm. No medals, no heroic pose, no triumphant soldier glamour.

### Emil Roth

Full-body sprite of a thin Freiburg manuscript restorer and technical informant. Ink and wax on careful hands, measuring rule, notes, worn work coat, anxious reverence. He should read as a false center: noisy and culpable, but not the blade.

### Krebs Mugger

Full-body sprite of a hired street enforcer affiliated with Free Yards. Scraped knuckles, worn cap, rough coat, practical boots, low-level threat. He belongs to the witch pressure line, not the vault breach.

### Anton Weber

Full-body sprite of a Freiburg postman whose real route was bent by forged military paperwork. Postal coat, satchel, official papers, yellow-black cord as his professional trace. He is a false trail, more used than malicious.

### Rudi Kempf

Full-body sprite of a worker protester whose noise masked the thermite breach. Strong worker body, rolled sleeves, pamphlet or protest paper, angry but sincere. He should not feel like the mastermind.

### Konrad Vossler

Full-body sprite of a former pioneer turned chemistry teacher. White lab coat over period suit, sulfur-stained cuffs, notebook, controlled voice in the face. He is Stoll's mirror and belongs to the Dead Registry / Case 02 line, not the Case 01 accomplice chain.

## Architect Handling

`npc_architect` is intentionally not produced as a portrait or sprite. In Case 01, the Architect is a negative space: a former commander felt through forged orders, target choice, breach precision, and Stoll's reflexive obedience. This should remain a content id and narrative pressure, not a renderable NPC.

## Known Cleanup

- Facial expression layers, separate eyes/brows/mouth assets, and overlays are not produced in this batch.
- Stoll's current base is suitable for confrontation or casefile reveal. If the gameplay needs him to blend into the lobby before exposure, produce a later `postal_coat` overlay or alternate pose.
- Chroma-key source files are preserved as `body_base_chromakey.png` beside each final transparent `body_base.png`.
