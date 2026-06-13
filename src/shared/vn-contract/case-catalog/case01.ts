import type { QuestArchetype, TriggerRule } from "../types";

export const CASE01_TRIGGER_RULES: TriggerRule[] = [
  {
    id: "trig.case01.newsboy_rumor",
    schemaVersion: 1,
    kindVersion: 1,
    status: "active",
    eventName: "case.entered",
    caseId: "case01_mainline",
    cooldownGroup: "case01.proc",
    budgetKey: "case01.proc.daily",
    generatedNamespace: "overlay.proc.case01.newsboy",
    allowedArchetypeIds: ["arch.case01.newsboy_rumor"],
    plannerConstraints: {
      districtIds: ["rail_hub"],
      poiCategories: ["PUBLIC"],
      resourceGates: [{ resourceId: "providence", spend: 1, optional: true }],
      tone: "street-level witness follow-up",
      durationWindow: { minSteps: 2, maxSteps: 3, timeBand: "day" },
      threatLevel: "low",
      rewardClass: "information",
    },
  },
  // Freiburg depth: authoritative consequences for the four supported flows.
  // Effects-only rules; quest archetypes stay reserved for scene-backed quests.
  {
    id: "trig.freiburg.rail_yard_route",
    schemaVersion: 1,
    kindVersion: 1,
    status: "active",
    eventName: "rumor.verified",
    conditions: [
      {
        type: "rumor_state_is",
        rumorId: "rumor_bank_rail_yard",
        status: "verified",
      },
    ],
    effects: [
      { type: "set_flag", key: "route_rail_yard_revealed", value: true },
      {
        type: "track_event",
        eventName: "freiburg_rail_yard_route_revealed",
      },
    ],
  },
  {
    id: "trig.freiburg.archive_access",
    schemaVersion: 1,
    kindVersion: 1,
    status: "active",
    eventName: "career.promoted",
    conditions: [{ type: "career_rank_gte", rankId: "junior_detective" }],
    effects: [
      { type: "set_flag", key: "agency_archive_access", value: true },
      { type: "track_event", eventName: "freiburg_archive_access_granted" },
    ],
  },
  {
    id: "trig.freiburg.informant_meeting",
    schemaVersion: 1,
    kindVersion: 1,
    status: "active",
    eventName: "career.criterion_recorded",
    effects: [
      {
        type: "spawn_map_event",
        templateId: "evt_informant_meeting",
        ttlMinutes: 30,
      },
      {
        type: "track_event",
        eventName: "freiburg_informant_meeting_spawned",
      },
    ],
  },
  {
    id: "trig.freiburg.pub_backroom",
    schemaVersion: 1,
    kindVersion: 1,
    status: "active",
    eventName: "map.interacted",
    conditions: [
      { type: "flag_equals", key: "agency_briefing_complete", value: true },
      { type: "favor_balance_gte", npcId: "npc_rudi_kempf", value: 1 },
    ],
    effects: [
      { type: "set_flag", key: "pub_backroom_access", value: true },
      { type: "track_event", eventName: "freiburg_pub_backroom_unlocked" },
    ],
  },
];

export const CASE01_QUEST_ARCHETYPES: QuestArchetype[] = [
  {
    id: "arch.case01.newsboy_rumor",
    version: 1,
    kind: "rumor_followup",
    title: "Newsboy rumor follow-up",
    triggerRuleIds: ["trig.case01.newsboy_rumor"],
    stepNodeIds: [
      "scene_case01_hbf_newsboy_approach",
      "scene_case01_hbf_newsboy_handoff",
      "scene_case01_hbf_newsboy_release",
    ],
    plannerConstraints: {
      districtIds: ["rail_hub"],
      poiCategories: ["PUBLIC"],
      tone: "procedural empathy",
      durationWindow: { minSteps: 2, maxSteps: 3, timeBand: "day" },
      threatLevel: "low",
      rewardClass: "information",
    },
  },
];
