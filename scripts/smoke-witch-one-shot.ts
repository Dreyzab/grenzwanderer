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
  "CASE01_WITCH_START_TO_DROWSE",
  "scene_case01_opening_arrival_video_witch",
);
requireChoice(
  "scene_case01_opening_arrival_video_witch",
  "AUTO_CONTINUE_WITCH_DROWSE_TO_MEMORY",
  "scene_case01_witch_compartment_memory",
);
requireChoice(
  "scene_case01_witch_compartment_memory",
  "AUTO_CONTINUE_WITCH_DROWSE_TO_THIRST",
  "scene_case01_witch_thirst_mask",
);
requireChoice(
  "scene_case01_witch_thirst_mask",
  "AUTO_CONTINUE_WITCH_THIRST_TO_COIN",
  "scene_case01_witch_coin_clang",
);
requireChoice(
  "scene_case01_witch_coin_clang",
  "AUTO_CONTINUE_WITCH_COIN_CLANG_TO_WAKE",
  "scene_case01_witch_coin_wake",
);
requireChoice(
  "scene_case01_witch_coin_wake",
  "WITCH_COIN_DRY_JOKE",
  "scene_case01_train_assistant_intro_witch",
);
requireChoice(
  "scene_case01_train_assistant_intro_witch",
  "AUTO_CONTINUE_WITCH_ASSISTANT_TO_COLLAR",
  "scene_case01_train_collar_choice_witch",
);
requireChoice(
  "scene_case01_train_collar_choice_witch",
  "WITCH_COLLAR_DRY_JOKE",
  "scene_case01_witch_felix_exit",
);
requireChoice(
  "scene_case01_witch_felix_exit",
  "AUTO_CONTINUE_WITCH_FELIX_EXIT_TO_LETTER",
  "scene_case01_train_compartment_letter_witch",
);
requireChoice(
  "scene_case01_train_compartment_letter_witch",
  "AUTO_CONTINUE_WITCH_LETTER_TO_AFTERTHOUGHTS",
  "scene_case01_witch_letter_afterthoughts",
);
requireChoice(
  "scene_case01_witch_letter_afterthoughts",
  "WITCH_LETTER_AFTERTHOUGHT_COMPOSE",
  "scene_case01_witch_dining_car_buffet_first_look",
);
requireChoice(
  "scene_case01_witch_dining_car_buffet_first_look",
  "WITCH_LOTTE_COUNTER_OBSERVE",
  "scene_case01_witch_lotte_counter_intro",
);
requireChoice(
  "scene_case01_witch_lotte_counter_intro",
  "WITCH_LOTTE_GREETING_SOCIAL",
  "scene_case01_train_dining_car_intro_witch",
);
requireChoice(
  "scene_case01_train_dining_car_intro_witch",
  "WITCH_LOTTE_INTRO_SOMATIC",
  "scene_case01_train_dining_car_lotte_monologue_witch",
);
requireChoice(
  "scene_case01_train_dining_car_lotte_monologue_witch",
  "WITCH_LOTTE_MONOLOGUE_GRIEF",
  "scene_case01_witch_lotte_monologue_grief_reaction",
);
requireChoice(
  "scene_case01_witch_lotte_monologue_grief_reaction",
  "AUTO_CONTINUE_WITCH_LOTTE_GRIEF_REACTION",
  "scene_case01_train_ankommen_video",
);
requireChoice(
  "scene_case01_train_ankommen_video",
  "AUTO_CONTINUE_SCENE_CASE01_TRAIN_ANKOMMEN_VIDEO",
  "scene_case01_train_voza_cutscene",
);
requireChoice(
  "scene_case01_train_voza_cutscene",
  "CHOICE_VOZA_TO_HBF_WITCH_LOTTE_GOODBYE",
  "scene_case01_witch_lotte_goodbye_platform",
);
requireChoice(
  "scene_case01_witch_lotte_goodbye_platform",
  "AUTO_CONTINUE_WITCH_LOTTE_GOODBYE_PLATFORM",
  "scene_case01_hbf_luggage_incident_witch",
);
requireChoice(
  "scene_case01_hbf_luggage_incident_witch",
  "AUTO_WITCH_HBF_SASHA_SOFT",
  "scene_case01_hbf_luggage_sasha_soft",
);
requireChoice(
  "scene_case01_hbf_luggage_incident_witch",
  "AUTO_WITCH_HBF_SASHA_THIRST",
  "scene_case01_hbf_luggage_sasha_thirst",
);
requireChoice(
  "scene_case01_hbf_luggage_sasha_soft",
  "WITCH_HBF_SASHA_ACCEPT_COVER",
  "scene_case01_hbf_departure",
);
requireChoice(
  "scene_case01_hbf_luggage_sasha_soft",
  "WITCH_HBF_SASHA_THANK_QUIETLY",
  "scene_case01_hbf_luggage_sasha_thank_quietly",
);
requireChoice(
  "scene_case01_hbf_luggage_sasha_thank_quietly",
  "AUTO_CONTINUE_WITCH_HBF_SASHA_THANK_QUIETLY",
  "scene_case01_hbf_departure",
);
requireChoice(
  "scene_case01_hbf_luggage_sasha_soft",
  "WITCH_HBF_SASHA_DISMISS_CONCERN",
  "scene_case01_hbf_luggage_sasha_dismiss_concern",
);
requireChoice(
  "scene_case01_hbf_luggage_sasha_dismiss_concern",
  "AUTO_CONTINUE_WITCH_HBF_SASHA_DISMISS_CONCERN",
  "scene_case01_hbf_departure",
);
requireChoice(
  "scene_case01_hbf_luggage_sasha_thirst",
  "WITCH_HBF_BLOOD_IGNORE",
  "scene_case01_hbf_departure",
);
requireChoice(
  "scene_case01_hbf_luggage_sasha_thirst",
  "WITCH_HBF_SEND_FELIX_AWAY",
  "scene_case01_hbf_luggage_sasha_send_felix_away",
);
requireChoice(
  "scene_case01_hbf_luggage_sasha_send_felix_away",
  "AUTO_CONTINUE_WITCH_HBF_SASHA_SEND_FELIX_AWAY",
  "scene_case01_hbf_departure",
);
requireChoice(
  "scene_case01_hbf_departure",
  "CASE01_HBF_EXIT_WITCH_HOTEL_CHECKIN",
  "scene_case01_witch_hotel_checkin",
);
requireChoice(
  "scene_case01_witch_hotel_checkin",
  "AUTO_CONTINUE_WITCH_HOTEL_TO_BUREAU",
  "scene_case01_witch_bureau_entry",
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
  "WITCH_BUREAU_MASTER_DRINK_SUPPRESSANT_NOTICED",
  "scene_case01_witch_bureau_master_noticed_hbf_blood",
);
requireChoice(
  "scene_case01_witch_bureau_master_noticed_hbf_blood",
  "AUTO_CONTINUE_WITCH_BUREAU_MASTER_NOTICED_HBF_BLOOD",
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
  "scene_case01_witch_estate_epilogue",
);
requireChoice(
  "scene_case01_witch_estate_epilogue",
  "WITCH_FINALE_CLOSE",
  "scene_case01_witch_finale_closed",
);
requireChoice(
  "scene_case01_witch_estate_epilogue",
  "WITCH_FINALE_ENTER_SANDBOX",
  "scene_case01_witch_finale_to_sandbox",
);
requireNode("scene_case01_witch_finale_closed");
requireNode("scene_case01_witch_finale_to_sandbox");

const enterSandboxChoice = requireNode(
  "scene_case01_witch_estate_epilogue",
).choices.find((choice) => choice.id === "WITCH_FINALE_ENTER_SANDBOX");
if (
  !enterSandboxChoice?.effects?.some(
    (effect) =>
      effect.type === "set_flag" &&
      effect.key === "witch_enter_ghost_sandbox" &&
      effect.value === true,
  )
) {
  throw new Error(
    "WITCH_FINALE_ENTER_SANDBOX must set the witch_enter_ghost_sandbox opt-in flag.",
  );
}

requireChoice("scene_evidence_collection", "GHOST_WITCH_VEIL_FOCUS");
requireChoice("scene_evidence_collection", "GHOST_WITCH_BLOOD_TEMPTATION");

const hbfScenario = snapshot.scenarios.find(
  (scenario) => scenario.id === "case01_hbf_arrival",
);
if (
  !hbfScenario?.completionRoutes?.some(
    (route) =>
      route.nextScenarioId === "sandbox_ghost_pilot" &&
      route.requiredFlagsAll?.includes("origin_witch_handoff_done") &&
      route.requiredFlagsAll?.includes("witch_enter_ghost_sandbox"),
  )
) {
  throw new Error(
    "Witch HBF scenario must expose a completion route to sandbox_ghost_pilot gated by both origin_witch_handoff_done and the witch_enter_ghost_sandbox opt-in flag.",
  );
}

const witchStart = requireNode(
  "scene_case01_opening_arrival_video",
).choices.find((choice) => choice.id === "CASE01_WITCH_START_TO_DROWSE");
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
