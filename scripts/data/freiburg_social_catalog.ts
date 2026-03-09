import type { SocialCatalogSnapshot } from "../../src/features/vn/types";

export const FREIBURG_SOCIAL_CATALOG: SocialCatalogSnapshot = {
  npcIdentities: [
    {
      id: "npc_anna_mahler",
      displayName: "Anna Mahler",
      factionId: "underworld",
      publicRole: "Railway fixer",
      rosterTier: "major",
      introFlag: "met_anna_intro",
      homePointId: "loc_workers_pub",
      workPointId: "loc_agency",
      serviceIds: ["svc_anna_whispers", "svc_anna_student_intro"],
    },
    {
      id: "npc_archivist_otto",
      displayName: "Archivist Otto",
      factionId: "civic_order",
      publicRole: "Records specialist",
      rosterTier: "functional",
      introFlag: "met_archivist_intro",
      homePointId: "loc_rathaus",
      workPointId: "loc_rathaus",
      serviceIds: ["svc_otto_archive_packet"],
    },
  ],
  services: [
    {
      id: "svc_anna_whispers",
      npcId: "npc_anna_mahler",
      role: "information",
      label: "Rail Yard Whispers",
      baseAccess:
        "Available once the Workers' Pub lead is active and Anna's channels trust you.",
      qualityNote:
        "Fast rumor triage through station messengers and tavern staff.",
      consequenceNote:
        "Loose handling can burn a source and push the network underground.",
    },
    {
      id: "svc_anna_student_intro",
      npcId: "npc_anna_mahler",
      role: "social_introduction",
      label: "Student House Introduction",
      baseAccess:
        "Requires a verified rumor chain plus either one favor in reserve or agency standing.",
      unlockFlag: "service_anna_student_intro_unlocked",
      costNote:
        "Usually costs one favor unless your standing is already carrying the weight.",
      qualityNote:
        "Turns a closed fraternity house into a supported Freiburg route instead of a blind trespass.",
      consequenceNote:
        "Commits part of Anna's network to your banker file and is tracked as agency service work.",
    },
    {
      id: "svc_otto_archive_packet",
      npcId: "npc_archivist_otto",
      role: "archives",
      label: "Archive Packet",
      baseAccess:
        "Used from Freiburg civic contacts once the Rathaus route is already warm.",
      qualityNote:
        "Provides cross-indexed filing movement notes for follow-up checks.",
    },
  ],
  rumors: [
    {
      id: "rumor_bank_rail_yard",
      title: "Rail Yard Ledger Whisper",
      caseId: "quest_banker",
      leadPointId: "loc_hbf",
      sourceNpcId: "npc_anna_mahler",
      verifiesOn: ["service_unlock"],
      careerCriterionOnVerify: "verified_rumor_chain",
    },
  ],
  careerRanks: [
    {
      id: "trainee",
      label: "Trainee",
      order: 0,
      standingRequired: -100,
      serviceCriteriaNeeded: 0,
      privileges: [],
    },
    {
      id: "junior_detective",
      label: "Junior Detective",
      order: 1,
      standingRequired: 15,
      qualifyingCaseId: "quest_banker",
      serviceCriteriaNeeded: 2,
      privileges: ["Field warrant"],
    },
    {
      id: "agency_detective",
      label: "Agency Detective",
      order: 2,
      standingRequired: 35,
      serviceCriteriaNeeded: 2,
      privileges: ["Priority filing access"],
    },
    {
      id: "senior_detective",
      label: "Senior Detective",
      order: 3,
      standingRequired: 55,
      serviceCriteriaNeeded: 2,
      privileges: ["Discretionary field command"],
    },
    {
      id: "lead_investigator",
      label: "Lead Investigator",
      order: 4,
      standingRequired: 75,
      serviceCriteriaNeeded: 2,
      privileges: ["Agency-wide mandate"],
    },
  ],
};

export const FREIBURG_SOCIAL_NPC_IDS = new Set(
  FREIBURG_SOCIAL_CATALOG.npcIdentities.map((entry) => entry.id),
);

export const FREIBURG_SOCIAL_RUMOR_IDS = new Set(
  FREIBURG_SOCIAL_CATALOG.rumors.map((entry) => entry.id),
);

export const FREIBURG_SOCIAL_CAREER_RANK_IDS = new Set(
  FREIBURG_SOCIAL_CATALOG.careerRanks.map((entry) => entry.id),
);

export const AGENCY_SERVICE_CRITERION_IDS = new Set([
  "verified_rumor_chain",
  "preserved_source_network",
  "clean_closure",
]);
