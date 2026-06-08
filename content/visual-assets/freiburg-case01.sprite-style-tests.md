# Freiburg Case01 Sprite Style Tests

Date: 2026-06-04
Mode: built-in image_gen, then local chroma-key removal for sprite PNG alpha.

## Assets

- Lotte sprite transparent test: `/images/characters/sprites/_style_tests/lotte_weber_fullbody_style_test.png`
- Lotte chroma source: `/images/characters/sprites/_style_tests/lotte_weber_fullbody_style_test_chromakey.png`
- Sasha sprite transparent test: `/images/characters/sprites/_style_tests/sasha_hartmann_servant_fullbody_style_test.png`
- Sasha chroma source: `/images/characters/sprites/_style_tests/sasha_hartmann_servant_fullbody_style_test_chromakey.png`
- Background style test: `/images/scenes/style_tests/bg_hbf_baggage_counter_vn_style_test.png`
- Composite preview: `/images/scenes/style_tests/preview_lotte_sasha_on_hbf_style_test.png`

## Prompt Set

### Lotte Weber Sprite

Full-body VN sprite of Lotte Weber for a European gothic visual novel set around 1900. Use existing Lotte portrait identity: young red-haired woman, lively and warm, intelligent eyes, charming but not glamorous, chief telephone operator and hidden journalist energy. Fitted dark green 1900s business suit, white blouse, dark ribbon tie, modest skirt, practical boots, small period hat or pinned hair accessory. Painterly semi-realistic European VN style, not anime, not photorealistic CG. Centered full body with generous padding, notebook and pencil. Flat solid `#ff00ff` chroma-key background, no shadow, no text.

### Alexander "Sasha" Sprite

Full-body VN sprite of Alexander "Sasha", Hartmann family servant, for a European gothic visual novel set around 1900. Use existing Sasha portrait identity: about 44, strong Russian man, veteran presence without direct military costume, short dark hair, restrained face, old cheek scar, broad shoulders, calm under pressure. Plain dark travel livery / servant working coat over simple waistcoat and shirt, practical trousers and boots. Painterly semi-realistic European VN style. Centered full body with generous padding, quiet military posture. Flat solid `#00ff00` chroma-key background, no shadow, no medals, no weapon, no text.

### Freiburg Hbf Background

Reusable 16:9 VN background: Freiburg Hauptbahnhof baggage claim / station buffet edge at dawn after rain. Indoor-outdoor station threshold with luggage counter, brass railings, wet stone floor, dark wood panels, a few trunks, arched windows or platform openings, sky clearing after rain with first pale sunrise light. Painterly semi-realistic European VN background, simplified and readable, less detailed than a full CG event illustration. No people, no readable text, sprite-safe center and foreground.

## First Read

- Lotte tests the light, social, readable side of the VN layer well, but her final production base may need a slightly less polished face and cleaner edge work around hair and hat.
- Sasha reads strongly as weight, discipline, and household service rather than public military hero. This direction is close.
- The background is beautiful but closer to T2 composite quality than cheap T1 VN background. For recurring dialogue screens, a more simplified paint layer may be easier to read.
