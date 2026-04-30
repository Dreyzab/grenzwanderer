interface NpcCastProfile {
  id: string;
  displayName: string;
  publicRole: string;
  sceneNote: string;
}

interface LocationCastEntry {
  locationId: string;
  tone: string;
  dramaticFunction: string;
  primaryNpcId: string;
  supportNpcIds: string[];
}

const NPC_PROFILES: NpcCastProfile[] = [
  {
    id: "npc_kessler_banker",
    displayName: "Johann Kessler",
    publicRole: "Bank Director",
    sceneNote: "Runs the bank floor — guarded, calculating, never off-duty.",
  },
  {
    id: "npc_vetter_clerk",
    displayName: "Irmgard Vetter",
    publicRole: "Ledger Clerk",
    sceneNote:
      "Monitors intake logs; alert to anything that breaks the daily pattern.",
  },
  {
    id: "npc_weber_dispatcher",
    displayName: "Lotte Weber",
    publicRole: "Chief Telephone Operator",
    sceneNote:
      "Manages the switchboard and incoming contract files. Reads line traffic the way a hunter reads tracks.",
  },
  {
    id: "npc_klein_analyst",
    displayName: "Marta Klein",
    publicRole: "Case Analyst",
    sceneNote: "Cross-references open files and tracks unresolved threads.",
  },
  {
    id: "npc_felix_hartmann",
    displayName: "Felix Hartmann",
    publicRole: "Junior Field Partner",
    sceneNote:
      "Legitimate Hartmann son. Legal aspirant torn between procedure and field reality. Subject to apathy under sustained pressure.",
  },
  {
    id: "npc_mother_hartmann",
    displayName: "Eleonora Hartmann",
    publicRole: "Aristocratic Patron",
    sceneNote:
      "Manages access and reputation through implicit obligation. Never commands — arranges inevitability.",
  },
];

const LOCATION_CAST_ENTRIES: LocationCastEntry[] = [
  {
    locationId: "loc_freiburg_bank",
    tone: "tense",
    dramaticFunction: "evidence_hub",
    primaryNpcId: "npc_kessler_banker",
    supportNpcIds: ["npc_vetter_clerk"],
  },
  {
    locationId: "loc_agency",
    tone: "operational",
    dramaticFunction: "briefing_hub",
    primaryNpcId: "npc_klein_analyst",
    supportNpcIds: [
      "npc_weber_dispatcher",
      "npc_felix_hartmann",
      "npc_mother_hartmann",
    ],
  },
  {
    locationId: "loc_telephone",
    tone: "guarded",
    dramaticFunction: "information_relay",
    primaryNpcId: "npc_weber_dispatcher",
    supportNpcIds: [],
  },
];

export const FREIBURG_NPC_REGISTRY_BY_ID = new Map<string, NpcCastProfile>(
  NPC_PROFILES.map((npc) => [npc.id, npc]),
);

export const FREIBURG_LOCATION_CAST_BY_ID = new Map<string, LocationCastEntry>(
  LOCATION_CAST_ENTRIES.map((entry) => [entry.locationId, entry]),
);
