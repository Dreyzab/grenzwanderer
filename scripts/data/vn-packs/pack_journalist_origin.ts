import { buildOriginChoiceEffects } from "../../origins.manifest";
import type { NodeBlueprint } from "../../vn-blueprint-types";
import type { ScenarioBlueprint } from "../../vn-blueprint-types";
import { journalistOriginProfile } from "./legacy-origin-profiles";

const JOURNALIST_BATH_BACKGROUND =
  "/VN/start/journalist/Gemini_Generated_Image4.png";
const JOURNALIST_BATH_SURFACE_BACKGROUND =
  "/VN/start/journalist/Gemini_Generated_Image5.png";
const JOURNALIST_CELLAR_BACKGROUND =
  "/VN/start/journalist/Gemini_Generated_Image2.png";
const JOURNALIST_CELLAR_CLOSE_BACKGROUND =
  "/VN/start/journalist/Gemini_Generated_Image3.png";

const JOURNALIST_WAKEUP_BODY = `White matter peels away from your chest in layers.

Not water. Not foam. Something between wet newspaper ink, lime, and a medicine that changed its mind at the last possible second.

You try to breathe.

Steam, chalk, alcohol, and someone else's confidence enter your throat together.

For a second you are not lying in a tub. You have been printed into it: face, hands, ribs, all pressed in thick white pigment against a wooden form. Then your heart strikes once. Clumsy. Unprofessional. Like a typesetter dropping a letter on the floor.

And you become a man again.

**[attr_perception]**:
Wood under the skull. Iron hoop by the elbow. Wax in the air. Stone floor. Glass on the left. Spoon on the right. The spoon is clean. The glass is not.

**[attr_logic]**:
Cellar. Bath. Candles. Missing boots. Not a hospital in the usual sense. Not an inn. Not a newspaper office, unless the profession has declined further than feared.

**[inner_cynic]**:
If a room removes your boots before introducing itself, the room has already made one decision for you.

**[Narrator]**:
You try to move your fingers.

The white matter holds your wrist for half a second longer, like a creditor who has agreed to release a debtor but wants the touch remembered.

**[Dr. Erasmus Lebrecht]**:
Do not swallow. Everyone swallows the first time. Then they complain about the taste and demand their memory back in full.

**[Narrator]**:
The voice is cheerful. Almost festive.

You turn your head.

A bald man stands beside the tub in a waistcoat and apron. Pink cheeks. Lively eyes. A steady hand. He smiles as though death is a patient's bad habit, not a medical outcome.

There is ink on his fingers. Wax on his cuff. A brown mark on the apron that you postpone classifying until tomorrow.

**[inner_cynic]**:
A man who smiles over a half-living body in a bath has either a licence or an alibi. In this city those may be the same document.

**[inner_leader]**:
Sit up. Do not negotiate from below eye level. People turn lying men into paperwork.

**[Narrator]**:
You try.

Your chest answers with pain. Your throat answers with coughing. The tub answers with a wooden groan too loud for a place where everyone is pretending this is a normal arrangement.

The man lays a palm on your shoulder.

**[Dr. Erasmus Lebrecht]**:
No, no. Pupils first, heroism second. Order exists for a reason. Though I admit beauty has suffered in your case.

**[Narrator]**:
He brings a candle near your face.

The flame swells. Splits into two. Then eight.

**[attr_perception]**:
Seven candles.

No. Eight. One is reflected in the glass.

**[attr_logic]**:
Reflections count only if the observer is desperate or the accountant is corrupt.

**[Dr. Erasmus Lebrecht]**:
Name?

**[Narrator]**:
You open your mouth.

The name is there. Nearby. Like a familiar street around a corner. But another thought arrives first.

**[you]**:
Where is my notebook?

**[Narrator]**:
The man pauses.

Then his smile widens.

**[Dr. Erasmus Lebrecht]**:
Excellent. Selfhood preserved. Most ask for name, date, or mother. A journalist asks for property.

**[attr_logic]**:
Journalist. Therefore the notebook matters more than the name. Other people can supply a name. They cannot supply your notes.

**[inner_cynic]**:
If the notes are gone, this is not treatment. It is editing.

**[Narrator]**:
You try to remember yesterday.

Cafe. Smoke. Print. A woman across from you? Black gloves? A boy's blue cap? A telegram? Laughter around a wager you should not have accepted.

Then — a wall.

Not emptiness. Emptiness would be more honest.

A wall: smooth, wet, seamless. As if someone did not tear out a page, but poured printers' glue across the door and instructed your memory to call it architecture.

**[attr_logic]**:
The central fact is missing.

**[inner_cynic]**:
Someone removed not the memory, but the route to it.

**[Narrator]**:
A thought comes without your accent.

**[inner_shadow]**:
What is missing is us.

**[Narrator]**:
You blink.

The candles sharpen. Doctor Lebrecht stops smiling for precisely long enough to let you notice.

**[Dr. Erasmus Lebrecht]**:
And that, Mr. Vance, is already not your sentence.

**[you]**:
Who are you?

**[Dr. Erasmus Lebrecht]**:
Dr. Erasmus Lebrecht. Physician, balneologist, and consultant in cases the city police prefer to describe as exhaustion.

**[Narrator]**:
He takes a small leather book from the table. Not a crest. Not a cross. Not a medical emblem. A bird with open wings, an eye, and several marks that look halfway between Egyptian and accounting.

**[inner_cynic]**:
When a doctor keeps a book that resembles a grimoire, ask for a second doctor. When there is no second doctor, ask for a lawyer. When there is no lawyer, do not swallow.

**[Dr. Erasmus Lebrecht]**:
Tell me, Mr. Vance. When you counted the candles — who finished the count?

**[you]**:
What?

**[Dr. Erasmus Lebrecht]**:
Simple question. You began counting. Who finished?

**[attr_logic]**:
He is testing memory.

**[inner_cynic]**:
He is testing how many people are sitting at your table.

**[inner_leader]**:
Do not answer quickly.

**[inner_shadow]**:
Not him.

**[Narrator]**:
The thought comes not like a voice in the room, but worse: like a note your own mind has already written in the margin and now pretends was always there.

Lebrecht sees the pause.

The smile returns.

**[Dr. Erasmus Lebrecht]**:
Good. Very good. I rarely get patients who can be frightened correctly.

**[you]**:
You call that good?

**[Dr. Erasmus Lebrecht]**:
I call it statistics when priests are present. In their absence, luck.

**[Narrator]**:
He makes a note.

**[Dr. Erasmus Lebrecht]**:
There is an entity in you.

**[Narrator]**:
Somewhere behind the wall, water moves through a pipe. Or someone whispers into a pipe while pretending to be water.

**[you]**:
An entity.

**[Dr. Erasmus Lebrecht]**:
Unpleasant word, agreed. Demon is shorter, but invites clergy, and clergy invite forms. Spirit sounds like a parlour. Passenger is too railway-minded after what happened to you. For now: entity.

**[inner_cynic]**:
He speaks of you as a room with an illegal tenant.

**[attr_perception]**:
Your fingers shake. Not all of them. Middle and ring finger on the left hand arrive half a second late.

**[you]**:
What happened to me?

**[Dr. Erasmus Lebrecht]**:
The patient version, the police version, or the rare version reserved for people who deserve the truth and still cannot use it?

**[you]**:
The newspaper version.

**[Dr. Erasmus Lebrecht]**:
Local correspondent takes a restorative bath after overwork. Subheading: city services acted promptly. No photograph, out of mercy for subscribers.

**[inner_cynic]**:
He is funny. Dangerous. Funny men make bills easier to sign.

**[attr_logic]**:
He evades the answer, but he does not deny the event. Therefore the event exists and has an official version.

**[you]**:
And the unofficial one?

**[Dr. Erasmus Lebrecht]**:
The unofficial one begins where you stopped remembering.

**[Narrator]**:
Above you, from a door or perhaps a speaking tube, a woman's voice enters the cellar.

Calm. Dry. A little tired.

**[H. Weber]**:
Doctor?

**[Dr. Erasmus Lebrecht]**:
Alive. Irritated. Asked about his notebook before his soul. By my standards, promising.

**[H. Weber]**:
Orientation?

**[Dr. Erasmus Lebrecht]**:
Partial. He did not give the name, but confirmed the profession by reflex. Found the wall. The passenger answered.

**[H. Weber]**:
Phrase it more carefully.

**[Dr. Erasmus Lebrecht]**:
Of course, Fräulein Weber. I always phrase carefully when people with the authority to close cellars are listening.

**[inner_cynic]**:
Weber. Remember that. Names spoken in cellars are rarely accidental.

**[attr_logic]**:
Woman. Weber. Authority over the procedure. Not a nurse. Not a clerk. Administrative control.

**[you]**:
Who is Weber?

**[Dr. Erasmus Lebrecht]**:
At the moment? The reason you were not moved to the morgue and I was not moved to a disciplinary hearing. I recommend gratitude. From a distance.

**[H. Weber]**:
Enough, Doctor.

**[Narrator]**:
The line clicks dead.

You try to sit again. This time Lebrecht only steadies your elbow. The world tilts. Candles smear. The white matter slides from your shoulder to your chest.

**[inner_leader]**:
Back straight. Breath first. Voice second.

**[inner_shadow]**:
She is afraid you will remember the wrong thing.

**[you]**:
What am I supposed to remember?

**[Narrator]**:
Lebrecht watches you closely now.

Less cheerful doctor. More man who has heard this question from other patients and did not pity all of them.

**[Dr. Erasmus Lebrecht]**:
No, Mr. Vance. The question now is what you are willing to forget in order to keep walking.`;

const JOURNALIST_MEMORY_GAP_BODY = `Your clothes lie on a side table, but not in the order a man leaves them willingly.

Shirt. Watch. Wet collar. A scratched coin. Somebody else's button. A pencil broken in two.

No notebook.

The world returns through small things. It always does.

Yesterday does not return.

You try professionally.

Place. Time. Witness. Money. Who won. Who lied first.

Wall.

You try differently.

Cafe smell. Cup noise. Newspaper columns. A woman's gloves. A boy's cap. The telegram.

Wall.

You try dirty.

Debt. Wager. Name of the bookmaker. The number nobody said aloud. The laughter of a man who knew the outcome before you did.

Wall.

**[attr_logic]**:
The gap is not random. It has a border.

**[inner_cynic]**:
Borders are made by people who do not want you to see the account.

**[inner_shadow]**:
Or by us.

**[Narrator]**:
The speaking tube clicks again.

**[H. Weber]**:
Doctor. If he asks about records, give him nothing handwritten.

**[Dr. Erasmus Lebrecht]**:
I would not. My handwriting is terrible.

**[H. Weber]**:
His handwritten material.

**[Narrator]**:
Lebrecht stops smiling for a fraction of a second.

**[Dr. Erasmus Lebrecht]**:
Understood.

**[Narrator]**:
Click. Silence.

**[attr_logic]**:
Your notes exist.

**[inner_cynic]**:
They have been read.

**[you]**:
My notes are with her?

**[Dr. Erasmus Lebrecht]**:
With whom?

**[you]**:
Weber.

**[Dr. Erasmus Lebrecht]**:
Mr. Vance, in this city many things are with Weber. It is one reason the city is still standing.

**[inner_cynic]**:
An answer without an answer. Therefore yes.`;

const JOURNALIST_VALVE_BODY = `The valve hisses beside the tub.

Wet metal. Rushed maintenance. A cellar pretending to be a clinic while doing the work of a machine room.

A little brass tag hangs under the wheel: IMMER. STAB. 7B. Someone has scratched a second mark below it by hand — H.W.

**[attr_logic]**:
The procedure has a number. The hand mark has initials. Bureaucracy on top of improvisation.

**[inner_cynic]**:
When the official label and the private scratch disagree, trust the scratch.

**[Dr. Erasmus Lebrecht]**:
Do not turn it. Last patient who helped with the plumbing remembered three childhoods and only one of them was his.`;

const JOURNALIST_LEDGER_BODY = `A swollen ledger lies beside the wall, its page edges marked by recent handling and cellar damp.

Not the doctor's book. This one is municipal: columns, times, initials, the cowardly neatness of people who do ugly work with clean rulers.

Near the bottom of the open page: VANCE, A. — immersion complete — notes withheld by H. Weber.

The line below is blotted out.

**[attr_logic]**:
They logged the withholding, not the reason.

**[inner_cynic]**:
A bureaucracy that admits theft on paper has a better word for theft.

**[inner_shadow]**:
Collateral.`;

const JOURNALIST_UNIFORM_BODY = `A fresh inspector's coat hangs above the boiler, still damp from the bath heat and already waiting to become your cover.

The cut is wrong for you. The shoulders are too disciplined. The pockets are too empty.

Inside one sleeve, a folded card: TEMPORARY FIELD COOPERATION — PRESS ASSET — AUTH. H.W.

**[inner_leader]**:
A uniform is not authority. But it changes the room before you enter it.

**[inner_cynic]**:
They do not recruit you. They dress the liability until it looks useful.`;

const JOURNALIST_RECRUITMENT_BODY = `H. Weber does not enter at first.

Her voice arrives through the speaking tube, measured and close enough to feel impolite.

**[H. Weber]**:
Mr. Vance. Your notes are safe. That is not the same as available.

**[you]**:
You read them.

**[H. Weber]**:
Some of them. The living have a privilege over paper. We used it.

**[Dr. Erasmus Lebrecht]**:
A humane abuse of authority. My favourite kind, administratively speaking.

**[H. Weber]**:
Doctor.

**[Dr. Erasmus Lebrecht]**:
Muting myself.

**[Narrator]**:
A pause. Somewhere above, a latch moves.

**[H. Weber]**:
The Bureau needs a journalist who can wear a badge, follow money, and recognize a lie before it becomes an institution. You need your missing hours, your notebook, and an explanation for the thing that answered inside you.

**[inner_cynic]**:
She has arranged the table so every chair is hers.

**[attr_logic]**:
Offer structure: information in exchange for service. Coercive, but not incoherent.

**[inner_shadow]**:
She does not know what we remember.

**[you]**:
And if I refuse?

**[H. Weber]**:
Then you leave with clean clothes, a medical lie, and the certainty that someone else knows how your story begins.

**[Narrator]**:
You look at the missing space where your notebook should be.

There are humiliations a man can survive. There are even humiliations he can sell.

But a story about you, written by someone else, is not survival.

It is ownership.`;

export const PACK_JOURNALIST_ORIGIN_SCENARIOS: ScenarioBlueprint[] = [
  {
    id: "origin_journalist_bootstrap",
    title: "Origin Bootstrap - Journalist",
    startNodeId: "scene_origin_journalist_bootstrap",
    mode: "fullscreen",
    packId: "system_origin_bootstrap",
    completionRoute: {
      nextScenarioId: "journalist_agency_wakeup",
      requiredFlagsAll: ["origin_journalist"],
      blockedIfFlagsAny: ["origin_journalist_handoff_done"],
    },
    nodeIds: ["scene_origin_journalist_bootstrap"],
  },
  {
    id: "journalist_agency_wakeup",
    title: "Immersion Bath Wakeup",
    startNodeId: "scene_journalist_agency_wakeup",
    mode: "fullscreen",
    packId: "journalist_origin",
    completionRoute: {
      nextScenarioId: "sandbox_agency_briefing",
      requiredFlagsAll: ["origin_journalist"],
      blockedIfFlagsAny: ["agency_briefing_complete"],
    },
    nodeIds: [
      "scene_journalist_agency_wakeup",
      "scene_journalist_memory_gap",
      "scene_journalist_cellar_valve",
      "scene_journalist_cellar_ledger",
      "scene_journalist_cellar_uniform",
      "scene_journalist_recruitment_pitch",
    ],
  },
];

export const PACK_JOURNALIST_ORIGIN_NODES: NodeBlueprint[] = [
  {
    id: "scene_origin_journalist_bootstrap",
    scenarioId: "origin_journalist_bootstrap",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_backstory_select.md",
    terminal: true,
    bodyOverride: "Preparing case file...",
    preconditions: [
      {
        type: "flag_equals",
        key: "origin_journalist",
        value: false,
      },
    ],
    onEnter: [
      ...buildOriginChoiceEffects(journalistOriginProfile),
      {
        type: "track_event",
        eventName: "origin_bootstrap_applied",
        tags: {
          origin: "journalist",
          system_flow: "origin_bootstrap",
        },
      },
    ],
    choices: [],
  },
  {
    id: "scene_journalist_agency_wakeup",
    scenarioId: "journalist_agency_wakeup",
    sourcePath:
      "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_agency_wakeup.md",
    titleOverride: "Immersion Bath",
    bodyOverride: JOURNALIST_WAKEUP_BODY,
    backgroundUrl: JOURNALIST_BATH_BACKGROUND,
    characterId: "npc_dr_erasmus_lebrecht",
    choices: [
      {
        id: "JOURNALIST_WAKEUP_SURFACE",
        text: "Grip the tub rim and demand your notes.",
        nextNodeId: "scene_journalist_memory_gap",
        innerVoiceHints: [
          {
            voiceId: "inner_cynic",
            stance: "supports",
            text: "If the notes are gone, this is not treatment. It is editing.",
          },
          {
            voiceId: "inner_leader",
            stance: "opposes",
            text: "Sit up first. People turn lying men into paperwork.",
          },
        ],
        effects: [
          {
            type: "track_event",
            eventName: "journalist_wakeup_surfaced",
            tags: { route: "journalist_wakeup" },
          },
          { type: "add_var", key: "var_addiction_pressure", value: 1 },
        ],
      },
    ],
  },
  {
    id: "scene_journalist_memory_gap",
    scenarioId: "journalist_agency_wakeup",
    sourcePath:
      "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_memory_gap.md",
    titleOverride: "Missing Notes",
    bodyOverride: JOURNALIST_MEMORY_GAP_BODY,
    backgroundUrl: JOURNALIST_BATH_SURFACE_BACKGROUND,
    characterId: "npc_hedwig_weber",
    choices: [
      {
        id: "JOURNALIST_WAKEUP_ORIENT",
        text: "Ask H. Weber what the Bureau wants from a journalist.",
        nextNodeId: "scene_journalist_recruitment_pitch",
        innerVoiceHints: [
          {
            voiceId: "inner_cynic",
            stance: "supports",
            text: "She has your notes. That makes this a negotiation with a knife under the table.",
          },
          {
            voiceId: "inner_guide",
            stance: "opposes",
            text: "She kept you alive. Do not mistake leverage for motive too early.",
          },
        ],
      },
      {
        id: "JOURNALIST_WAKEUP_INSPECT_VALVE",
        text: "Ignore the answer for a second and inspect the steam valve.",
        choiceType: "inquiry",
        nextNodeId: "scene_journalist_cellar_valve",
        innerVoiceHints: [
          {
            voiceId: "inner_cynic",
            stance: "supports",
            text: "Objects lie less fluently than officials.",
          },
          {
            voiceId: "inner_leader",
            stance: "opposes",
            text: "Do not crawl through plumbing while your captors still hold the room.",
          },
        ],
      },
    ],
  },
  {
    id: "scene_journalist_cellar_valve",
    scenarioId: "journalist_agency_wakeup",
    sourcePath:
      "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_cellar_valve.md",
    titleOverride: "Steam Valve",
    bodyOverride: JOURNALIST_VALVE_BODY,
    backgroundUrl: JOURNALIST_CELLAR_BACKGROUND,
    characterId: "npc_dr_erasmus_lebrecht",
    choices: [
      {
        id: "JOURNALIST_VALVE_TO_LEDGER",
        text: "Trace the wet pipe to the ledger crate by the wall.",
        nextNodeId: "scene_journalist_cellar_ledger",
        effects: [
          {
            type: "track_event",
            eventName: "journalist_wakeup_valve_checked",
            tags: { route: "journalist_wakeup" },
          },
        ],
      },
      {
        id: "JOURNALIST_VALVE_CONTINUE",
        text: "Leave the hardware alone and face H. Weber's offer.",
        nextNodeId: "scene_journalist_recruitment_pitch",
      },
    ],
  },
  {
    id: "scene_journalist_cellar_ledger",
    scenarioId: "journalist_agency_wakeup",
    sourcePath:
      "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_cellar_ledger.md",
    titleOverride: "Ledger Crate",
    bodyOverride: JOURNALIST_LEDGER_BODY,
    backgroundUrl: JOURNALIST_CELLAR_CLOSE_BACKGROUND,
    characterId: "npc_hedwig_weber",
    choices: [
      {
        id: "JOURNALIST_LEDGER_TO_UNIFORM",
        text: "Set the ledger down and inspect the drying uniform.",
        nextNodeId: "scene_journalist_cellar_uniform",
        effects: [
          {
            type: "track_event",
            eventName: "journalist_wakeup_ledger_checked",
            tags: { route: "journalist_wakeup" },
          },
        ],
      },
      {
        id: "JOURNALIST_LEDGER_CONTINUE",
        text: "Keep H. Weber's initials in mind and hear the offer out.",
        nextNodeId: "scene_journalist_recruitment_pitch",
      },
    ],
  },
  {
    id: "scene_journalist_cellar_uniform",
    scenarioId: "journalist_agency_wakeup",
    sourcePath:
      "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_cellar_uniform.md",
    titleOverride: "Drying Uniform",
    bodyOverride: JOURNALIST_UNIFORM_BODY,
    backgroundUrl: JOURNALIST_CELLAR_BACKGROUND,
    characterId: "npc_hedwig_weber",
    choices: [
      {
        id: "JOURNALIST_UNIFORM_CONTINUE",
        text: "Pull the coat on and demand the short version.",
        nextNodeId: "scene_journalist_recruitment_pitch",
        effects: [
          {
            type: "track_event",
            eventName: "journalist_wakeup_uniform_checked",
            tags: { route: "journalist_wakeup" },
          },
        ],
      },
    ],
  },
  {
    id: "scene_journalist_recruitment_pitch",
    scenarioId: "journalist_agency_wakeup",
    sourcePath:
      "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_recruitment_pitch.md",
    titleOverride: "H. Weber's Pitch",
    bodyOverride: JOURNALIST_RECRUITMENT_BODY,
    backgroundUrl: JOURNALIST_BATH_SURFACE_BACKGROUND,
    characterId: "npc_hedwig_weber",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "origin_journalist_handoff_done", value: true },
      {
        type: "track_event",
        eventName: "journalist_wakeup_completed",
        tags: { route: "journalist_wakeup" },
      },
    ],
    choices: [],
  },
];
