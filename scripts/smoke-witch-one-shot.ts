import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { VnNode, VnSnapshot } from "../src/features/vn/types";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const snapshotPath = path.join(
  repoRoot,
  "content",
  "vn",
  "pilot.snapshot.json",
);

const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as VnSnapshot;
const nodeById = new Map(snapshot.nodes.map((node) => [node.id, node]));

const requireNode = (nodeId: string): VnNode => {
  const node = nodeById.get(nodeId);
  if (!node) {
    throw new Error(`Missing node '${nodeId}'`);
  }
  return node;
};

const requireChoice = (
  nodeId: string,
  choiceId: string,
  nextNodeId?: string,
): void => {
  const node = requireNode(nodeId);
  const choice = node.choices.find((entry) => entry.id === choiceId);
  if (!choice) {
    throw new Error(`Missing choice '${choiceId}' on '${nodeId}'`);
  }
  if (nextNodeId && choice.nextNodeId !== nextNodeId) {
    throw new Error(
      `Choice '${choiceId}' on '${nodeId}' should route to '${nextNodeId}', got '${choice.nextNodeId ?? "<none>"}'`,
    );
  }
};

requireChoice(
  "scene_case01_opening_arrival_video",
  "CASE01_WITCH_START_TO_LETTER",
  "scene_case01_train_compartment_letter_witch",
);
requireChoice(
  "scene_case01_hbf_departure",
  "CASE01_HBF_EXIT_WITCH_BUREAU",
  "scene_case01_witch_bureau_entry",
);
requireChoice(
  "scene_case01_hbf_departure",
  "CASE01_HBF_EXIT_WITCH_GHOST",
  "scene_case01_witch_estate_handoff",
);
requireChoice(
  "scene_case01_witch_bureau_entry",
  "AUTO_CONTINUE_WITCH_BUREAU_ENTRY",
  "scene_case01_witch_bureau_master_meeting",
);
requireChoice(
  "scene_case01_witch_bureau_master_meeting",
  "WITCH_BUREAU_MASTER_DRINK_SUPPRESSANT",
  "scene_case01_witch_bureau_exit",
);
requireChoice(
  "scene_case01_witch_bureau_master_meeting",
  "WITCH_BUREAU_MASTER_SIPHON_RELIC",
  "scene_case01_witch_bureau_exit",
);
requireChoice(
  "scene_case01_witch_bureau_master_meeting",
  "WITCH_BUREAU_MASTER_COMPOSURE",
  "scene_case01_witch_bureau_exit",
);
requireChoice(
  "scene_case01_witch_bureau_exit",
  "AUTO_CONTINUE_WITCH_BUREAU_EXIT",
  "scene_case01_witch_estate_handoff",
);
requireNode("scene_case01_witch_estate_handoff");
requireChoice(
  "scene_case01_hotel_morning_witch",
  "WITCH_MORNING_SORCERY_CLEANSE",
  "scene_case01_hotel_copper_trace_witch",
);
requireChoice(
  "scene_case01_hotel_copper_trace_witch",
  "WITCH_HOTEL_COPPER_TRACE_STEADY",
  "scene_case01_lobby_crossover_witch",
);
requireChoice(
  "scene_case01_lobby_crossover_witch",
  "WITCH_LOBBY_GREET",
  "scene_case01_hbf_exit_final",
);
requireChoice("scene_evidence_collection", "GHOST_WITCH_VEIL_FOCUS");
requireChoice("scene_evidence_collection", "GHOST_WITCH_BLOOD_TEMPTATION");

const hbfScenario = snapshot.scenarios.find(
  (scenario) => scenario.id === "case01_hbf_arrival",
);
if (
  !hbfScenario?.completionRoutes?.some(
    (route) =>
      route.nextScenarioId === "sandbox_ghost_pilot" &&
      route.requiredFlagsAll?.includes("origin_witch_handoff_done"),
  )
) {
  throw new Error(
    "Witch HBF scenario must expose a gated completion route to sandbox_ghost_pilot.",
  );
}

const witchStart = requireNode(
  "scene_case01_opening_arrival_video",
).choices.find((choice) => choice.id === "CASE01_WITCH_START_TO_LETTER");
if (
  !witchStart?.visibleIfAll?.some(
    (condition) =>
      condition.type === "flag_equals" &&
      condition.key === "origin_witch" &&
      condition.value === true,
  )
) {
  throw new Error("Witch start choice must be gated by origin_witch.");
}

console.log("smoke:witch-one-shot passed.");
