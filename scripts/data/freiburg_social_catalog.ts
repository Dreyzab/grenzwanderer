import { CANONICAL_FACTION_REGISTRY } from "../../data/factionContract";
import type { SocialCatalogSnapshot } from "../../src/features/vn/types";

export const FREIBURG_SOCIAL_CATALOG: SocialCatalogSnapshot = {
  factions: CANONICAL_FACTION_REGISTRY,
  npcIdentities: [
    {
      id: "npc_weber_dispatcher",
      displayName: "Lotte Weber",
      factionId: "city_chancellery",
      publicRole: "Chief telephone operator",
      rosterTier: "major",
      introFlag: "met_redhead_intro",
      homePointId: "loc_agency",
      workPointId: "loc_telephone",
      serviceIds: ["svc_lotte_switchboard_trace"],
    },
    {
      id: "npc_anna_mahler",
      displayName: "Anna Mahler",
      factionId: "city_network",
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
      factionId: "city_chancellery",
      publicRole: "Records specialist",
      rosterTier: "functional",
      introFlag: "met_archivist_intro",
      homePointId: "loc_rathaus",
      workPointId: "loc_rathaus",
      serviceIds: ["svc_otto_archive_packet"],
    },
    {
      id: "npc_mother_hartmann",
      displayName: "Eleonora Hartmann",
      factionId: "house_of_pledges",
      publicRole: "Aristocratic patron",
      rosterTier: "major",
      introFlag: "met_mother_intro",
      homePointId: "loc_agency",
      workPointId: "loc_agency",
      serviceIds: [
        "svc_eleonora_social_introduction",
        "svc_eleonora_political_cover",
      ],
    },
    {
      id: "npc_felix_hartmann",
      displayName: "Felix Hartmann",
      factionId: "house_of_pledges",
      publicRole: "Junior field partner",
      rosterTier: "major",
      introFlag: "met_felix_intro",
      homePointId: "loc_agency",
      workPointId: "loc_agency",
      serviceIds: ["svc_felix_legal_analysis"],
    },
    {
      id: "npc_bureau_master",
      displayName: "The Master",
      factionId: "the_returned",
      publicRole: "Bureau occult supervisor",
      rosterTier: "functional",
      portraitUrl: "/images/characters/bureau_master/bureau_master.webp",
      introFlag: "met_bureau_master_intro",
      workPointId: "loc_hbf",
      serviceIds: ["svc_bureau_occult_protocol"],
    },
    {
      id: "npc_karl_servant",
      displayName: "Karl",
      factionId: "house_of_pledges",
      publicRole: "Grand Estate servant",
      rosterTier: "functional",
      portraitUrl: "/images/characters/karl_servant/karl_servant.webp",
      introFlag: "met_karl_servant_intro",
      workPointId: "loc_freiburg_estate",
      serviceIds: ["svc_karl_service_corridors"],
    },
    {
      id: "npc_friedrich_wagner",
      displayName: "Friedrich Wagner",
      factionId: "the_returned",
      publicRole: "Dead estate accountant",
      rosterTier: "major",
      portraitUrl: "/images/characters/friedrich_wagner/friedrich_wagner.webp",
      introFlag: "met_friedrich_wagner_intro",
      workPointId: "loc_freiburg_estate",
      serviceIds: ["svc_friedrich_ledger_memory"],
    },
    {
      id: "npc_krebs_mugger",
      displayName: "Krebs Mugger",
      factionId: "free_yards",
      publicRole: "Street enforcer",
      rosterTier: "functional",
      portraitUrl: "/images/characters/krebs_mugger/krebs_mugger.webp",
      introFlag: "met_krebs_mugger_intro",
      workPointId: "loc_hbf",
    },
    {
      id: "npc_hotel_maid",
      displayName: "Hotel Maid",
      factionId: "city_network",
      publicRole: "Zum Goldenen Adler maid",
      rosterTier: "functional",
      portraitUrl: "/images/characters/hotel_maid/hotel_maid.webp",
      introFlag: "met_hotel_maid_intro",
      workPointId: "loc_pub_deutsche",
      serviceIds: ["svc_hotel_discretion"],
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
    {
      id: "svc_eleonora_social_introduction",
      npcId: "npc_mother_hartmann",
      role: "social_introduction",
      label: "Hartmann Salon Introduction",
      baseAccess:
        "Available when Eleonora considers the detective a working contact. Requires at least one completed favor or demonstrated discretion.",
      costNote:
        "No explicit price. Eleonora remembers every door she opens and expects the detective to remember too.",
      qualityNote:
        "Opens house_of_pledges-adjacent events: patronage circles, archival permissions held by aristocratic families, and salon introductions.",
      consequenceNote:
        "Creates implicit obligation. Eleonora tracks debts as social architecture, not accounting.",
    },
    {
      id: "svc_eleonora_political_cover",
      npcId: "npc_mother_hartmann",
      role: "political_cover",
      label: "Political Cover",
      baseAccess:
        "Available only when active evidence threatens Hartmann family interests or house_of_pledges standing. Case02 and beyond.",
      unlockFlag: "hartmann_interests_threatened",
      costNote:
        "Suppression, redirection, or reframing of damaging material. Price: case integrity, moral stress, and Felix trust if he discovers the arrangement.",
      qualityNote:
        "Neutralizes institutional fallout from evidence that would damage Hartmann-adjacent networks.",
      consequenceNote:
        "Accepting cover compromises investigative independence. Refusing it damages Eleonora relations and may close house_of_pledges access.",
    },
    {
      id: "svc_lotte_switchboard_trace",
      npcId: "npc_weber_dispatcher",
      role: "information",
      label: "Switchboard Trace",
      baseAccess:
        "Available once Lotte trusts the detective enough to share operational patterns. Requires lotte_warning_heeded or equivalent trust threshold.",
      unlockFlag: "lotte_warning_heeded",
      qualityNote:
        "Pattern analysis of telephone traffic reveals communication anomalies around suspects — who called whom, which lines went quiet, which offices redirected.",
      consequenceNote:
        "Using switchboard intelligence risks exposing Lotte's access. Careless handling may burn her position.",
    },
    {
      id: "svc_felix_legal_analysis",
      npcId: "npc_felix_hartmann",
      role: "information",
      label: "Legal Analysis",
      baseAccess:
        "Available while Felix is an active partner with stable or higher trust. Degrades or becomes unavailable during apathy episodes.",
      qualityNote:
        "Cross-references legal precedent, procedural requirements, and institutional jurisdiction. Turns bureaucratic obstacles into investigative leverage.",
      consequenceNote:
        "Quality depends on Felix mental state. Instrumentalization without reciprocal investment degrades output over time.",
    },
    {
      id: "svc_bureau_occult_protocol",
      npcId: "npc_bureau_master",
      role: "political_cover",
      label: "Bureau Occult Protocol",
      baseAccess:
        "Available to Witch agents who kept the Maskerade in the Bureau induction (suppressant taken or composure held).",
      unlockFlag: "met_bureau_master_intro",
      qualityNote:
        "Provides sanctioned occult cover for field incidents and Bureau-side rationing of curse suppressant.",
      consequenceNote:
        "Cover is revoked if the Bureau reads the agent as undisciplined; a flagged Master suspends the protocol.",
    },
    {
      id: "svc_karl_service_corridors",
      npcId: "npc_karl_servant",
      role: "transport",
      label: "Estate Service Corridors",
      baseAccess:
        "Available only when Karl trusts the detective — kindness at HBF and no feeding incident at the estate.",
      unlockFlag: "met_karl_servant_intro",
      qualityNote:
        "Opens the Grand Estate's pantry-to-yard service corridors used by the Baroness's smuggling partners.",
      consequenceNote:
        "Compromised if Karl was fed on; he cannot be a quiet witness once the estate marks him as ghost-haunted.",
    },
    {
      id: "svc_friedrich_ledger_memory",
      npcId: "npc_friedrich_wagner",
      role: "archives",
      label: "Ledger Memory",
      baseAccess:
        "Available only when Friedrich was met with justice or bound to the witch's shadow; not from a banished outcome.",
      unlockFlag: "met_friedrich_wagner_intro",
      qualityNote:
        "Cross-references the smuggling ledger against the Krebs partners and dates back to the night of his murder.",
      consequenceNote:
        "Bound testimony degrades faster than freely given testimony and may invite Bureau scrutiny.",
    },
    {
      id: "svc_hotel_discretion",
      npcId: "npc_hotel_maid",
      role: "social_introduction",
      label: "Hotel Discretion",
      baseAccess:
        "Available once the maid is bribed at the Adler — clothing destroyed, staff quietly aligned.",
      unlockFlag: "flag_witch_maid_bribed",
      qualityNote:
        "Quiet back-channel through hotel staff: laundry vanishes, room logs stay clean, and Felix hears no rumor at breakfast.",
      consequenceNote:
        "Discretion lasts as long as nothing forces the maid to choose between her bribe and the police.",
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
    {
      id: "rumor_university_network",
      title: "Faculty Registry Anomaly",
      caseId: "quest_banker",
      leadPointId: "loc_student_house",
      sourceNpcId: "npc_felix_hartmann",
      verifiesOn: ["flag_set"],
      careerCriterionOnVerify: "university_contact_established",
    },
    {
      id: "rumor_witch_mugger_survivor",
      title: "Alley Survivor Whisper",
      caseId: "quest_banker",
      leadPointId: "loc_hbf",
      sourceNpcId: "npc_krebs_mugger",
      verifiesOn: ["flag_set"],
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

export const FREIBURG_SOCIAL_FACTION_IDS = new Set(
  (FREIBURG_SOCIAL_CATALOG.factions ?? []).map((entry) => entry.id),
);

export const AGENCY_SERVICE_CRITERION_IDS = new Set([
  "verified_rumor_chain",
  "preserved_source_network",
  "clean_closure",
]);
