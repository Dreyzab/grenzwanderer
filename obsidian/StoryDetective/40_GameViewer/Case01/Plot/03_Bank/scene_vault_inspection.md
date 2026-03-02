---
id: scene_vault_inspection
aliases:
  - Scene: Vault Inspection
tags:
  - type/vn_scene
  - layer/vn
  - case/case01
  - phase/bank_investigation
---

# 🔒 Scene: Vault Inspection

## Context

**Location**: Bank Vault.
**Source Logic**: `case1_bank.logic.ts` (`vault_inspection` -> `vault_leave`)
**Assets**: `/images/scenarios/bank_vault_1905.png`

## Script

**Intro**:
"Die Tresortür hängt offen, wie zum Hohn. Drinnen erzählen leere Fächer die Geschichte. Aber der [[Schließmechanismus]] und der [[Boden]] könnten mehr verraten."

**Choices**:

1. **[Logic] Examine Lock** (`examine_lock_logic`)
   - _Condition_: `!found_velvet`
   - _Skill Check_: **Logic** (Diff: 10)
   - _Text_: "[Logik] Den Schließmechanismus analysieren."

   **Success**:
   - _Text_: "Keine chemischen Rückstände. Keine Dietrichspuren. Ein Insider? Sie bemerken einen Fetzen [[roten Samt]]."
   - _Evidence_: [[ev_torn_velvet|Torn Velvet]]
   - _Effect_: `add_flag: found_velvet`

   **Fail**:
   - _Text_: "Der Mechanismus ist komplex. Sie bräuchten mehr Zeit."

2. **[Intuition] Atmosphere** (`sense_atmosphere_intuition`)
   - _Condition_: `!found_residue`
   - _Skill Check_: **Intuition** (Diff: 12)
   - _Text_: "[Intuition] Irgendetwas an diesem Raum fühlt sich... falsch an."

   **Success**:
   - _Text_: "Sie atmen langsam ein. Bittere Mandeln. Industriechemikalien. Kein Dynamit. Sie finden feine [[Pulverrückstände]] auf dem Boden."
   - _Evidence_: [[ev_chemical_residue|Strange Dust]]
   - _Effect_: `add_flag: found_residue`
   - _Next_: -> `vault_occult_discovery` (Hidden Layer)

3. **[Logic] Compare Sender** (`compare_chemical_sender`)
   - _Condition_: `clue_chemical_sender` AND `!compared_sender_residue`
   - _Skill Check_: **Logic** (Diff: 8)
   - _Text_: "[Logik] Rückstände mit dem Absender der Chemiewerke vergleichen."

   **Success**:
   - _Text_: "Absenderhinweis und Rückstandsprofil stimmen überein. Zugang durch die [[Breisgauer Chemiewerke]]."
   - _Effect_: `add_flag: clue_sender_residue_match`, `add_flag: compared_sender_residue`

4. **Leave** (`return_to_hub`)
   - _Text_: "Zurück zur Haupthalle."
   - _Effect_: `add_flag: vault_inspected` (On Exit)
   - _Next_: -> [[action_investigate_bank|Back to Hub]]

---

### Hidden Layer: Occult Discovery (`vault_occult_discovery`)

**Trigger**: Intuition Success.

**Scene**: Victoria enters.
**Choices**:

1. **[Occultism] Shivers** (`occult_shivers_check`)
   - _Skill Check_: **Occultism** (Diff: 14)
   - _Success_: Find [[ev_occult_circle|Occult Circle]]. "Chalk markings with geometric precision."
   - _Effect_: `sensed_presence: true`

2. **Ask Victoria** (`ask_victoria_occult`)
   - _Reaction_: Victoria analyzes it. Rel +5.

3. **Dismiss** (`dismiss_occult`)
   - _Text_: "Theater."
