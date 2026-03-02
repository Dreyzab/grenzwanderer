---
id: scene_bank_arrival
aliases:
  - Scene: Bank Arrival
tags:
  - type/vn_scene
  - layer/vn
  - case/case01
  - phase/bank_investigation
---

# 🏦 Scene: Bank Arrival

## Context

**Location**: Bankhaus J.A. Krebs.
**Source Logic**: `case1_bank.logic.ts` (Scenes: `arrival`, `scene_solo_entry`, `scene_duo_entry`, `victoria_interrupts`)

## Script

**Start**:
"Bankhaus J.A. Krebs. Der Tatort. Die Morgenluft ist kalt."

**Choices**:

1. **Solo Entry** (`enter_solo`): "Zeit, an die Arbeit zu gehen."
   - _Condition_: `!met_mayor_first` AND `!clara_introduced`
   - _Result_: -> `scene_solo_entry`
2. **Duo Entry** (`enter_duo`): "Gehen wir hinein, Clara."
   - _Condition_: `met_mayor_first` OR `clara_introduced`
   - _Result_: -> `scene_duo_entry`

---

### Branch: Solo Entry

**Text**: "Ich stoße die schweren Türen auf. Die Stille drinnen ist beklemmend. Ich arbeite anfangs lieber allein."
**Next**: -> `victoria_interrupts`

### Branch: Duo Entry

**Text**: "Wir betreten das Gebäude gemeinsam. Mit Clara an Ihrer Seite verändert sich die Stimmung in der Halle sofort."
**Effects**:

- `add_flag: clara_seen_in_bank`
  **Next**: -> [[action_investigate_bank|Bank Hub]]

---

### Sequence: Victoria Interrupts (from Solo)

**Text**: "Herr Inspektor! Warten Sie! Fangen Sie nicht ohne mich an!"
**Effects**:

- `add_flag: clara_introduced`
- `add_flag: clara_met_at_bank`
- `add_flag: clara_seen_in_bank`

**Dialogue (Victoria Intro)**:
"Ich bin [[char_clara_altenburg|Clara von Altenburg]]. Ich bin aus eigenem Antrieb hier. Mein Vater kann den formalen Teil später erledigen, aber jetzt arbeiten wir."

**Choices**:

1. **Mockery** (`react_mockery`): "Das ist eine Ermittlung, kein Mädchenpensionat."
   - _Rel_: Clara -10
   - _Response_: "Ich habe alle Ihre Fallakten gelesen, Herr Inspektor. Unterschätzen Sie mich nicht."
2. **Surprise** (`react_surprise`): "Ich hätte nicht erwartet, dass die Verwandtschaft des Bürgermeisters sich die Hände schmutzig macht."
   - _Response_: "Überraschungen können in unserem Metier nützlich sein, Herr Inspektor."
3. **Interest** (`react_interest`): "Mal sehen, ob Sie den Blick für diese Arbeit haben."
   - _Rel_: Clara +10
   - _Response_: "Ich werde Sie nicht enttäuschen. Übrigens habe ich schon etwas gefunden."

**Next**: -> [[action_investigate_bank|Bank Hub]]
