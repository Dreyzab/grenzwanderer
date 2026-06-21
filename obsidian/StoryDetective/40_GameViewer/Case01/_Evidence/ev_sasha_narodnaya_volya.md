---
id: ev_sasha_narodnaya_volya
node_type: evidence
case: case01
phase: investigation
status: draft
stakeholders:
  - npc:npc_sasha_hartmann_servant
  - faction:house_of_pledges
holder: faction:the_returned
tags:
  - type/evidence
  - leverage
  - origin/witch
---

# Sasha's Narodnaya Volya Past

**Source**: Bureau archive (The Returned) — held by The Master as collateral behind the cover and suppressant he rations to the household
**Acquisition**: Bureau induction — the hidden-lift descent (`scene_case01_witch_bureau_entry`) surfaces Sasha's card among "the cards of people who'd rather stay rumors" and sets `flag_witch_knows_bureau_holds_sasha` (Eleonora route)

## Description

Alexander "Sasha" was tied to the periphery of Narodnaya Volya before the 1881
assassination of Alexander II. Fleeing the post-regicide dragnet, he was
sheltered in the Hartmann household in Königsberg by Eleonora's late husband.
Eleonora inherited both the servant and the secret.

## Impact

- **Blast radius.** Exposure ruins Sasha *and* stains the Hartmann House — an
  aristocratic family harboring a regicide-adjacent revolutionary in 1905.
  Threat / disposition effects fan out to every entry in `stakeholders`, not just
  the subject. This is the first Fact that needs the field.
- Binding leverage in the `[СТРАТЕГ]` «вексель» register (see ELEONORA bible §3).
- Thematic charge: the servant once struck at the autocratic hierarchy that
  Eleonora's `[ТРАДИЦИЯ]` embodies. It is why his loyalty is debt, not faith.

## Open

- **Holder resolved: the Bureau (`the_returned`), via The Master.** Fits its
  standing economy — it rations cover and suppressant and already keeps files on
  "people who'd rather stay rumors" (shown in the lift descent). Encoded in the
  matrix as `npc_bureau_master knows ev_sasha_narodnaya_volya: always`.
- **Acquisition wired (Eleonora route).** The lift descent now records the grip as
  `flag_witch_knows_bureau_holds_sasha`. Nothing *reads* that flag yet — it is the
  acquisition record the cashing beat will consume.
- **Remaining: the cashing beat.** A scene where the grip is *spent* — the Master
  making the threat explicit to bind Eleonora, a Bureau-pressure choice gated on
  `flag_witch_knows_bureau_holds_sasha`, and/or a Detective-route path that grants
  the file as evidence. Until one reads the flag, the leverage is established but
  not yet exercised.

## Related

- [[40_GameViewer/Case01/_Characters/char_case01_sasha_hartmann_servant|Alexander "Sasha"]]
- ADR_008_NPC_Knowledge (Detectiv/99_System/ADR)
