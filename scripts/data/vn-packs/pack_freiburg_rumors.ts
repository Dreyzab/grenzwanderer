import type { NodeBlueprint } from "../../vn-blueprint-types";
import type { ScenarioBlueprint } from "../../vn-blueprint-types";

export const PACK_FREIBURG_RUMORS_SCENARIOS: ScenarioBlueprint[] = [
  {
    id: "sandbox_workers_pub_rumor",
    title: "Workers Pub Rumor",
    startNodeId: "scene_workers_pub_rumor",
    mode: "overlay",
    packId: "freiburg_rumors",
    nodeIds: ["scene_workers_pub_rumor", "scene_workers_pub_rumor_end"],
  },
];

export const PACK_FREIBURG_RUMORS_NODES: NodeBlueprint[] = [
  {
    id: "scene_workers_pub_rumor",
    scenarioId: "sandbox_workers_pub_rumor",
    sourcePath:
      "40_GameViewer/Case01/Plot/03_Rumors/scene_workers_pub_rumor.md",
    onEnter: [{ type: "track_event", eventName: "workers_pub_rumor_opened" }],
    choices: [
      {
        id: "WORKERS_PUB_RUMOR_PURSUE",
        text: "Cut through the alleys before the lead goes cold.",
        nextNodeId: "scene_workers_pub_rumor_end",
        effects: [
          { type: "grant_xp", amount: 5 },
          { type: "register_rumor", rumorId: "rumor_bank_rail_yard" },
          {
            type: "change_favor_balance",
            npcId: "npc_anna_mahler",
            delta: 1,
            reason: "workers_pub_rumor_chain",
          },
          {
            type: "track_event",
            eventName: "workers_pub_rumor_registered",
            tags: { rumorId: "rumor_bank_rail_yard" },
          },
        ],
      },
    ],
  },
  {
    id: "scene_workers_pub_rumor_end",
    scenarioId: "sandbox_workers_pub_rumor",
    sourcePath:
      "40_GameViewer/Case01/Plot/03_Rumors/scene_workers_pub_rumor_end.md",
    terminal: true,
    choices: [],
  },
];
