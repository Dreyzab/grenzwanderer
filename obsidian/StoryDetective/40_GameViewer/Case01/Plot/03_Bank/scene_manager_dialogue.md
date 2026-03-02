---
id: scene_manager_dialogue
aliases:
  - Scene: Manager Galdermann
tags:
  - type/vn_scene
  - layer/vn
  - case/case01
  - phase/bank_investigation
---

# 🗣️ Dialogue: Bank Director Galdermann

## Context

**Character**: [[Heinrich Galdermann]]
**Source Logic**: `case1_bank.logic.ts` (`manager_intro` branch)

## Script

**Intro**:
"Herr Galdermann mustert Sie mit der einstudierten Wärme eines Mannes, der Schuldnern zulächelt, bevor er sie pfändet."

**Choices**:

1. **Confront about Seed** (`manager_confront_seed`)
   - _Condition_: `clue_galdermann_mention` OR `clue_galdermann_leaflet`
   - _Text_: "Ihr Name fiel schon, bevor ich diese Bank erreichte."
   - _Reaction_: "Ein Flackern huscht über sein Gesicht. 'Ich bin bekannt in Freiburg. Das beweist überhaupt nichts.'"
   - _Effect_: `add_flag: clue_galdermann_preseed_confirmed`
   - _Next_: -> `manager_about_robbery`

2. **Open Case** (`manager_open_case`)
   - _Text_: "Beginnen wir mit dem Zeitablauf."
   - _Next_: -> `manager_about_robbery`

---

### Topic: The Robbery (`manager_about_robbery`)

**Text**: "'Ein bedauerlicher Vorfall, Herr Inspektor. Der Tresor wurde gewaltlos geöffnet. Zweifellos ein Insiderjob. Ich empfehle Ihnen, das Personal zu befragen.'"

**Choices**:

1. **Press about Hartmann** (`manager_press_hartmann`)
   - _Condition_: `clue_hartmann_newspaper` OR `clue_hartmann_letter`
   - _Text_: "Hartmann erscheint in mehreren Spuren. Erklären Sie das."
   - _Response_: "'[[Hartmann]] ist ein routinierter Angestellter. Klatsch bauscht gewöhnliche Namen auf.'"
   - _Effect_: `add_flag: clue_hartmann_brushed_off`
   - _Next_: -> `manager_dismissive`

2. **Request Statements** (`manager_request_statements`)
   - _Text_: "Ich will die unverfälschten Aussagen, keine Zusammenfassungen."
   - _Next_: -> `manager_dismissive`

---

### Conclusion (`manager_dismissive`)

**Text**: "'Und nun entschuldigen Sie mich bitte, ich muss Kunden beruhigen. Die Polizei hat bereits alle [[Aussagen]] aufgenommen, die sie braucht.'"

**Effects**:

- `add_flag: met_galdermann`

**Next**: -> [[action_investigate_bank|Back to Hub]]
