import type { NodeBlueprint } from "../../vn-blueprint-types";
import type { ScenarioBlueprint } from "../../vn-blueprint-types";

export const PACK_FREIBURG_SOCIAL_SCENARIOS: ScenarioBlueprint[] = [
  {
    id: "sandbox_agency_service_unlock",
    title: "Agency Service: Anna's Introduction",
    startNodeId: "scene_agency_service_unlock",
    mode: "overlay",
    packId: "freiburg_social",
    nodeIds: ["scene_agency_service_unlock", "scene_agency_service_unlock_end"],
  },
  {
    id: "sandbox_student_house_access",
    title: "Student House Access",
    startNodeId: "scene_student_house_access",
    mode: "overlay",
    packId: "freiburg_social",
    nodeIds: ["scene_student_house_access", "scene_student_house_access_end"],
  },
  {
    id: "sandbox_agency_promotion_review",
    title: "Agency Promotion Review",
    startNodeId: "scene_agency_promotion_review",
    mode: "overlay",
    packId: "freiburg_social",
    nodeIds: [
      "scene_agency_promotion_review",
      "scene_agency_promotion_review_end",
    ],
  },
];

export const PACK_FREIBURG_SOCIAL_NODES: NodeBlueprint[] = [
  {
    id: "scene_agency_service_unlock",
    scenarioId: "sandbox_agency_service_unlock",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_map_intro.md",
    titleOverride: "Agency Service: Anna's Introduction",
    bodyOverride:
      "Anna can still open the student house, but only if your ledger with her or the agency still carries enough weight.",
    characterId: "npc_anna_mahler",
    choices: [
      {
        id: "AGENCY_SERVICE_UNLOCK_CONFIRM",
        text: "Commit Anna's introduction to the banker file.",
        nextNodeId: "scene_agency_service_unlock_end",
        requireAll: [
          {
            type: "rumor_state_is",
            rumorId: "rumor_bank_rail_yard",
            status: "verified",
          },
          {
            type: "flag_equals",
            key: "service_anna_student_intro_unlocked",
            value: false,
          },
        ],
        requireAny: [
          {
            type: "favor_balance_gte",
            npcId: "npc_anna_mahler",
            value: 1,
          },
          {
            type: "agency_standing_gte",
            value: 15,
          },
        ],
        effects: [
          {
            type: "set_flag",
            key: "service_anna_student_intro_unlocked",
            value: true,
          },
          { type: "unlock_group", groupId: "loc_student_house" },
          {
            type: "change_favor_balance",
            npcId: "npc_anna_mahler",
            delta: -1,
            reason: "student_house_introduction",
          },
          {
            type: "change_agency_standing",
            delta: 5,
            reason: "source_network_preserved",
          },
          {
            type: "record_service_criterion",
            criterionId: "preserved_source_network",
          },
          {
            type: "track_event",
            eventName: "agency_service_student_intro_unlocked",
            tags: { serviceId: "svc_anna_student_intro" },
          },
        ],
      },
      {
        id: "AGENCY_SERVICE_UNLOCK_DELAY",
        text: "Hold the introduction in reserve for now.",
        nextNodeId: "scene_agency_service_unlock_end",
      },
    ],
  },
  {
    id: "scene_agency_service_unlock_end",
    scenarioId: "sandbox_agency_service_unlock",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_map_intro.md",
    titleOverride: "Agency Desk",
    bodyOverride:
      "The file returns to the board with Anna's channels either committed or kept in reserve.",
    terminal: true,
    choices: [],
  },
  {
    id: "scene_student_house_access",
    scenarioId: "sandbox_student_house_access",
    sourcePath:
      "40_GameViewer/Case01/Plot/03_Rumors/scene_workers_pub_rumor.md",
    titleOverride: "Student House Access",
    bodyOverride:
      "A fraternity porter weighs Anna's name against your badge before deciding whether the door opens.",
    characterId: "npc_anna_mahler",
    preconditions: [
      {
        type: "flag_equals",
        key: "service_anna_student_intro_unlocked",
        value: true,
      },
    ],
    choices: [
      {
        id: "STUDENT_HOUSE_PRESENT_INTRODUCTION",
        text: "Present Anna's introduction and enter the house.",
        nextNodeId: "scene_student_house_access_end",
        requireAll: [
          {
            type: "flag_equals",
            key: "service_anna_student_intro_unlocked",
            value: true,
          },
        ],
        requireAny: [
          {
            type: "favor_balance_gte",
            npcId: "npc_anna_mahler",
            value: 1,
          },
          {
            type: "agency_standing_gte",
            value: 15,
          },
        ],
        effects: [
          { type: "set_flag", key: "student_house_accessed", value: true },
          {
            type: "change_agency_standing",
            delta: 3,
            reason: "student_house_entry_logged",
          },
          {
            type: "track_event",
            eventName: "student_house_access_opened",
            tags: { pointId: "loc_student_house" },
          },
        ],
      },
      {
        id: "STUDENT_HOUSE_BACK_OUT",
        text: "Leave the introduction unused.",
        nextNodeId: "scene_student_house_access_end",
      },
    ],
  },
  {
    id: "scene_student_house_access_end",
    scenarioId: "sandbox_student_house_access",
    sourcePath:
      "40_GameViewer/Case01/Plot/03_Rumors/scene_workers_pub_rumor_end.md",
    titleOverride: "Back On The Street",
    bodyOverride:
      "You leave the student house route with its cost now written into the wider Freiburg file.",
    terminal: true,
    choices: [],
  },
  {
    id: "scene_agency_promotion_review",
    scenarioId: "sandbox_agency_promotion_review",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_map_intro.md",
    titleOverride: "Agency Promotion Review",
    bodyOverride:
      "The agency board finally reflects that the banker file, the rumor chain, and the source work all landed on one record.",
    choices: [
      {
        id: "AGENCY_PROMOTION_REVIEW_CONFIRM",
        text: "File the promotion review and return to operations.",
        nextNodeId: "scene_agency_promotion_review_end",
        requireAll: [
          { type: "career_rank_gte", rankId: "junior_detective" },
          {
            type: "flag_equals",
            key: "agency_promotion_review_complete",
            value: false,
          },
        ],
        effects: [
          {
            type: "set_flag",
            key: "agency_promotion_review_complete",
            value: true,
          },
          {
            type: "change_agency_standing",
            delta: 2,
            reason: "promotion_review_filed",
          },
          {
            type: "track_event",
            eventName: "agency_promotion_review_complete",
            tags: { rankId: "junior_detective" },
          },
        ],
      },
    ],
  },
  {
    id: "scene_agency_promotion_review_end",
    scenarioId: "sandbox_agency_promotion_review",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_map_intro.md",
    titleOverride: "Promotion Filed",
    bodyOverride:
      "The promotion file closes cleanly, and the next Freiburg route now sees the rank on your name.",
    terminal: true,
    choices: [],
  },
];
