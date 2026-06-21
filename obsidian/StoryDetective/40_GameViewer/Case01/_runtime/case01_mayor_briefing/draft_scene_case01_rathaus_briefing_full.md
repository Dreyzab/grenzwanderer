---
id: scene_case01_rathaus_briefing_full
type: vn_scene
status: active
background: /images/scenes/case01/cg_case01_rathaus_summit.png
---

# Scene: The Mayor's Office

## Script

**Oberbuergermeister**: (Tapping a heavy signet ring on the oak desk) "Herr Thorne... the Bankhaus Krebs is not merely a building. It is a pillar of Freiburg's stability. If a postal wagon vanishes between here and the station, it is a mystery. If it disappears *inside* the city walls, it is a scandal."

**Felix**: (Stepping forward with a leather dossier) "The HBF manifests show the wagon cleared the tracks, sir. But the Bank's ledger has a... gap. Exactly twenty-four minutes of silence."

**Victoria**: (Standing by the tall window, her silhouette sharp against the morning light) "Silence has a chemical signature, Felix. Or at least, the reason for it does. I found traces of magnesium and sulfur at the transition threshold."

**Oberbuergermeister**: (Sighing, looking at Victoria with a mix of pride and fear) "My daughter is... persistent, Herr Thorne. The Polizeidirektion finds her presence 'irregular'. I find it necessary. If you accept her as a private consultant, I will sign this writ."

**Victoria**: (Turning to you, her analytical gaze fixed) "I don't need a badge to read a crime scene, Detective. I only need the authority to stand on one. Shall we see if the Bank's marble is as clean as they claim?"

```vn-logic
choices:
  - id: RATHAUS_ACCEPT_PARTNERSHIP
    text: "I accept. Victoria's expertise is the edge this case needs."
    next: scene_case01_mayor_exit
    effects:
      - set_flag(victoria_introduced, true)
      - set_flag(victoria_respected, true)
      - set_var(official_writ_strength, 2)
      - change_relationship(victoria_sterling, 1)
  - id: RATHAUS_PROFESSIONAL_ONLY
    text: "I will take the writ and the consultant. Let's keep this strictly professional."
    next: scene_case01_mayor_exit
    effects:
      - set_flag(victoria_introduced, true)
      - set_var(official_writ_strength, 1)
  - id: RATHAUS_SKEPTICAL
    text: "Is this a request for an investigator or a babysitter, Herr Oberbuergermeister?"
    next: scene_case01_mayor_exit
    effects:
      - set_flag(victoria_introduced, true)
      - change_relationship(victoria_sterling, -1)
      - add_tension(1)
```
