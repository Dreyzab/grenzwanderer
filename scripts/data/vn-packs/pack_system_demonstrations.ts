import type { NodeBlueprint } from "../../vn-blueprint-types";
import type { ScenarioBlueprint } from "../../vn-blueprint-types";

export const PACK_SYSTEM_DEMONSTRATIONS_SCENARIOS: ScenarioBlueprint[] = [
  {
    id: "sandbox_loop_demo",
    title: "Loop Demo Pilot",
    startNodeId: "scene_loop_demo_intro",
    mode: "overlay",
    packId: "system_loop_demo",
    nodeIds: ["scene_loop_demo_intro", "scene_loop_demo_end"],
  },
  {
    id: "sandbox_inner_voice_demo",
    title: "Inner Voices Demo",
    startNodeId: "scene_inner_voice_demo_intro",
    mode: "overlay",
    packId: "system_inner_voice_demo",
    nodeIds: [
      "scene_inner_voice_demo_intro",
      "scene_inner_voice_demo_reflection",
      "scene_inner_voice_demo_leader",
      "scene_inner_voice_demo_cynic",
    ],
  },
];

export const PACK_SYSTEM_DEMONSTRATIONS_NODES: NodeBlueprint[] = [
  {
    id: "scene_loop_demo_intro",
    scenarioId: "sandbox_loop_demo",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_start.md",
    titleOverride: "Loop Demo Start",
    bodyOverride: "This is a demo scenario for testing the Mind Palace loop.",
    choices: [
      {
        id: "LOOP_DEMO_CLUE",
        text: "Discover the demo fact",
        choiceType: "action",
        nextNodeId: "scene_loop_demo_end",
        effects: [
          {
            type: "discover_fact",
            caseId: "case_loop_demo",
            factId: "fact_loop_clue",
          },
          { type: "track_event", eventName: "loop_demo_fact_discovered" },
        ],
      },
    ],
  },
  {
    id: "scene_loop_demo_end",
    scenarioId: "sandbox_loop_demo",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_start.md",
    titleOverride: "Loop Demo End",
    bodyOverride:
      "You have discovered the fact. Please check your Mind Palace.",
    terminal: true,
    choices: [],
  },
  {
    id: "scene_inner_voice_demo_intro",
    scenarioId: "sandbox_inner_voice_demo",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_start.md",
    titleOverride: "Inner Voices Demo",
    bodyOverride:
      "A frightened courier offers you a ledger and begs for safe passage before the city closes around him.",
    voicePresenceMode: "parliament",
    activeSpeakers: ["inner_leader", "inner_guide", "inner_cynic"],
    choices: [
      {
        id: "INNER_VOICE_HELP",
        text: "Hide the courier and slow the pursuit.",
        nextNodeId: "scene_inner_voice_demo_reflection",
        innerVoiceHints: [
          {
            voiceId: "inner_leader",
            stance: "supports",
            text: "Keep him alive, even if it costs initiative.",
          },
          {
            voiceId: "inner_cynic",
            stance: "opposes",
            text: "Mercy spends leverage and buys you no guarantee.",
          },
        ],
        effects: [
          { type: "change_psyche_axis", axis: "x", delta: 5 },
          { type: "change_psyche_axis", axis: "y", delta: 12 },
          { type: "change_psyche_axis", axis: "approach", delta: -5 },
        ],
      },
      {
        id: "INNER_VOICE_LEVERAGE",
        text: "Take the ledger and make the courier owe you.",
        nextNodeId: "scene_inner_voice_demo_reflection",
        innerVoiceHints: [
          {
            voiceId: "inner_cynic",
            stance: "supports",
            text: "Take the asset first and keep the debt in your pocket.",
          },
          {
            voiceId: "inner_leader",
            stance: "opposes",
            text: "Do not turn fear into tribute when trust is still possible.",
          },
        ],
        effects: [
          { type: "change_psyche_axis", axis: "x", delta: -5 },
          { type: "change_psyche_axis", axis: "y", delta: -12 },
          { type: "change_psyche_axis", axis: "approach", delta: 5 },
        ],
      },
    ],
  },
  {
    id: "scene_inner_voice_demo_reflection",
    scenarioId: "sandbox_inner_voice_demo",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_start.md",
    titleOverride: "Afterimage",
    bodyOverride:
      "The room quiets, but the argument inside you sharpens into two clear routes.",
    voicePresenceMode: "parliament",
    activeSpeakers: ["inner_leader", "inner_guide", "inner_cynic"],
    choices: [
      {
        id: "INNER_VOICE_FOLLOW_LIGHT",
        text: "Stay with the generous instinct.",
        nextNodeId: "scene_inner_voice_demo_leader",
        visibleIfAll: [{ type: "var_gte", key: "psyche_axis_y", value: 10 }],
        innerVoiceHints: [
          {
            voiceId: "inner_leader",
            stance: "supports",
            text: "You already chose to protect someone. Finish the line cleanly.",
          },
        ],
      },
      {
        id: "INNER_VOICE_FOLLOW_EDGE",
        text: "Press the hard edge while it still holds.",
        nextNodeId: "scene_inner_voice_demo_cynic",
        visibleIfAll: [{ type: "var_lte", key: "psyche_axis_y", value: -10 }],
        innerVoiceHints: [
          {
            voiceId: "inner_cynic",
            stance: "supports",
            text: "You have the leverage now. Use it before the city shifts again.",
          },
        ],
      },
    ],
  },
  {
    id: "scene_inner_voice_demo_leader",
    scenarioId: "sandbox_inner_voice_demo",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_start.md",
    titleOverride: "Shared Burden",
    bodyOverride:
      "You move slower, but the courier leaves alive and the city owes you a different kind of memory.",
    terminal: true,
    choices: [],
  },
  {
    id: "scene_inner_voice_demo_cynic",
    scenarioId: "sandbox_inner_voice_demo",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_start.md",
    titleOverride: "Cold Leverage",
    bodyOverride:
      "You leave with the ledger, the advantage, and a silence that will not forgive you soon.",
    terminal: true,
    choices: [],
  },
];
