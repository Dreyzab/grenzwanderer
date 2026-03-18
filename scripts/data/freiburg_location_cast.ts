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
    publicRole: "Bureau Dispatcher",
    sceneNote:
      "Manages incoming contract files and keeps the duty board current.",
  },
  {
    id: "npc_klein_analyst",
    displayName: "Marta Klein",
    publicRole: "Case Analyst",
    sceneNote: "Cross-references open files and tracks unresolved threads.",
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
    primaryNpcId: "npc_weber_dispatcher",
    supportNpcIds: ["npc_klein_analyst"],
  },
];

export const FREIBURG_NPC_REGISTRY_BY_ID = new Map<string, NpcCastProfile>(
  NPC_PROFILES.map((npc) => [npc.id, npc]),
);

export const FREIBURG_LOCATION_CAST_BY_ID = new Map<string, LocationCastEntry>(
  LOCATION_CAST_ENTRIES.map((entry) => [entry.locationId, entry]),
);
