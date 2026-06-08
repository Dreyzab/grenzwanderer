# Visual Architecture

Grenzwanderer uses two runtime visual modes and three production tiers.

## Runtime Modes

`split` is the everyday VN mode. It is built from a stylized location
background plus character sprites. It is used for dialogue, investigation,
choice-heavy scenes, repeat visits, and group staging.

`fullscreen` is the narrative CG mode. It is used for rare event art: emotional
turns, dangerous decisions, revelations, and scenes that should remain in the
player's memory.

The rule is simple:

- Sprites and backgrounds are the game layer.
- CG illustrations are the dramatic accent layer.

## Production Tiers

| Tier         | Use                                                           | Runtime      |
| ------------ | ------------------------------------------------------------- | ------------ |
| T1_VN        | Stylized background + full-body layered sprites               | `split`      |
| T2_COMPOSITE | Richer background, stronger light, close crop or bust staging | `split`      |
| T3_CG        | Fullscreen event illustration                                 | `fullscreen` |

T2 is not a new engine mode. It is a richer asset/presentation tier inside the
same `split` runtime, so the code stays small while direction can ramp from
daily surface to pressure to earned darkness.

## Sprite Doctrine

Character sprites are produced as full-body layered assets on a transparent
background. Runtime presentation may crop or scale them into full-body,
waist-up, bust, or close-focus compositions.

The source stays full-body because silhouette and costume identity matter in
European gothic VN staging.

Required scale presets:

- `far` for group staging.
- `normal` for standard dialogue.
- `focus` for the current speaker.
- `close` for intimate pressure or T2 composite scenes.

Required layer model:

- `body_base`
- `face_base`
- `eyes/{emotion}`
- `brows/{emotion}`
- `mouth/{emotion}`
- `overlays/{overlay}` for rare state-specific effects

The shared emotion enum is:

- `neutral`
- `warm`
- `tense`
- `suspicious`
- `hurt`
- `commanding`
- `dangerous`

Eleonora additionally supports:

- `composed`
- `softened`
- `hungry`
- `cracking`
- `predatory`
- `controlled_panic`

## Style Bridge

Sprites and CG art may differ in detail level, but not in identity. Every major
character must keep the same anchors across portrait, sprite, and CG:

- silhouette
- age read
- face structure
- hair
- costume markers
- palette
- forbidden drift

The current production catalog for the first sprite batch lives in
`src/features/vn/characterSprites.ts`; scaffold outputs are generated under
`content/visual-assets/`.
