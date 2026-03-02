---
id: scene_clerk_dialogue
aliases:
  - Scene: Clerk Ernst Vogel
tags:
  - type/vn_scene
  - layer/vn
  - case/case01
  - phase/bank_investigation
---

# 🗣️ Dialogue: Bank Clerk (Ernst Vogel)

## Context

**Character**: [[Ernst Vogel]] (Clerk)
**Source Logic**: `case1_bank.logic.ts` (`clerk_intro` -> `clerk_done`)

## Script

**Intro**:
"Der junge Angestellte — [[Ernst Vogel]], laut seinem Namensschild — sieht aus, als hätte er seit Tagen nicht geschlafen. Seine Hände zittern, während er Papiere sortiert."

**Mood**: Nervous, Defensiv.

### Dialogue Hub (`clerk_nervous`)

**Text**: "„Ich... Ich hatte Nachtdienst, Herr Inspektor. Ich schwöre, ich habe [[den Tresor abgeschlossen]]! Aber heute Morgen stand er einfach... offen. Wie von Zauberhand.“"

**Choices**:

1. **Ask about Hartmann** (`ask_about_hartmann`)
   - _Condition_: `clue_hartmann_newspaper` OR `clue_hartmann_letter`
   - _Text_: "Wer genau ist dieser Hartmann in Ihrem Betrieb?"
   - _Response_: "`clerk_hartmann_response` - „Zugriff auf die Hauptbücher. Vertrauenswürdig. In letzter Zeit bekam [[Hartmann]] fast täglich versiegelte Briefe.“"
   - _Effect_: `add_flag: asked_hartmann`, `add_flag: clue_hartmann_internal_contact`

2. **Ask about Box 217** (`ask_about_box_217`)
   - _Condition_: `clue_vault_box_217`
   - _Text_: "Was war im Schließfach 217?"
   - _Response_: "`clerk_box217_response` - „Die Diskretion bei Schließfächern ist strikt... aber [[Fach 217]] war von der Direktion als sensibel markiert.“"
   - _Effect_: `add_flag: asked_box_217`, `add_flag: clue_box217_sensitive`

3. **[Empathy] Read Him** (`read_clerk_empathy`)
   - _Skill Check_: **Empathy** (Diff: 10)
   - _Text_: "[Empathie] Er verbirgt etwas. Seine Angst lesen."

   **Success**:
   - _Text_: "Sein Blick zuckt zur Tür. Keine Schuld — das ist Terror. Er hat in jener Nacht etwas gesehen."
   - _Outcome_: -> `clerk_revelation`
   - _Evidence_: [[ev_witness_rumor|Bächleputzer Sighting]]

   **Fail**:
   - _Text_: "Sie können ihn nicht ganz lesen. Die Angst ist echt, aber ihre Quelle bleibt undurchsichtig."
   - _Outcome_: -> `clerk_closes_up`

4. **Press Him** (`press_clerk`)
   - _Text_: "Sie erwarten, dass ich glaube, Magie hat den Tresor geöffnet?"
   - _Response_: "`clerk_press` - „Ich weiß nicht, was Sie hören wollen! Das Schloss wurde nicht geknackt!“"
   - _Outcome_: -> `clerk_done`

5. **Leave** (`leave_clerk`)
   - _Text_: "Das wäre vorerst alles."
   - _Outcome_: -> [[action_investigate_bank|Back to Hub]]

---

### Key Information (`clerk_revelation`)

**Text**: "„Da ist ein Mann... Gustav. Der [[Bächleputzer]]. Er reinigt die Wasserkanäle im Morgengrauen. Er hat mir erzählt... er sah einen [[Schatten]] beim Bank in jener Nacht. Eine Gestalt in Schwarz.“"
**Effect**: `add_flag: clerk_revealed_shadow`

### Post-Interview (`clerk_done`)

**Text**: "Der Angestellte hat nichts mehr zu bieten. Vorerst."
**Effect**: `add_flag: clerk_interviewed`
