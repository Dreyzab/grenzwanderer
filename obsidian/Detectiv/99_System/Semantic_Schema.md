# Semantic Schema & Ontology

This document defines the **directed relationships** used in `Grezwanderer 4` to visualize the detective board in Excalibrain.

## 🕸️ Relationship Types (Ontology)

Use these keys in **Dataview Inline Fields** to create labeled arrows in your graph.

### 🩸 Narrative (Characters & Crime)

- **`killed`**: `[[Victim]]` (Arrow: Red, distinct)
- **`knows`**: `[[Character]]` (Arrow: Grey, bidirectional potentially)
- **`loves`**: `[[Character]]` (Arrow: Pink)
- **`hates`**: `[[Character]]` (Arrow: Dark Red)
- **`works_for`**: `[[Organization]]` (Arrow: Blue)

> **Usage Example:**
> In `Heinrich_Krebs.md`:
> `knows:: [[Clara von Altenburg]]`
> `hates:: [[The Inspector]]`

### 🔎 Logic (Deduction)

- **`contradicts`**: `[[Evidence]]` (Arrow: Orange, dashed)
- **`confirms`**: `[[Evidence]]` (Arrow: Green, solid)
- **`requires`**: `[[Item]]` (Arrow: Purple)
- **`unlocks`**: `[[Location]]` (Arrow: Gold)

> **Usage Example:**
> In `Bank_Statement.md`:
> `contradicts:: [[Krebs_Testimony]]`

### 🌍 World (Geography)

- **`located_in`**: `[[Region]]` (Arrow: Grey, dotted)
- **`contains`**: `[[Item]]` (Arrow: Grey)

---

## 📊 Dataview Queries

Use these snippets to generate dynamic lists based on the relationships above.

### List of Suspects (People who `killed` someone)

```dataview
TABLE killed AS "Victim"
FROM #npc
WHERE killed
```

### Unsolved Contradictions

```dataview
TABLE contradicts AS "Contradicts Evidence"
FROM #clue
WHERE contradicts
```

### Location Manifest

```dataview
TABLE rows.file.link AS "Objects/NPCs"
FROM ""
WHERE located_in
GROUP BY located_in
```

---

## 🧠 Excalibrain Setup (Recommended)

1.  Open **Excalibrain** pane.
2.  Go to Settings -> ontology.
3.  Map the fields above to visual styles:
    - **killed**: 🔴 Red Arrow
    - **contradicts**: 🟠 Orange Dashed
    - **unlocks**: 🟡 Gold
