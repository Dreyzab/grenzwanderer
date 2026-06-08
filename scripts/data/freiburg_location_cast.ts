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
    publicRole: "Bankdirektor",
    sceneNote:
      "Figurehead Director of Bankhaus J.A. Krebs — guarded, calculating, never off-duty. Chairs the house; his Prokurist Galdermann signs and conceals.",
  },
  {
    id: "npc_vetter_clerk",
    displayName: "Irmgard Vetter",
    publicRole: "Ledger Clerk",
    sceneNote:
      "Monitors intake logs; alert to anything that breaks the daily pattern.",
  },
  {
    id: "npc_heinrich_galdermann",
    displayName: "Heinrich Galdermann",
    publicRole: "Prokurist",
    sceneNote:
      "Respectable culprit of Bankhaus J.A. Krebs: wide, polished, and sweating at the hairline while the official report covers the grossbuch.",
  },
  {
    id: "npc_albrecht_stoll",
    displayName: "Oberleutnant Albrecht Stoll",
    publicRole: "Pioneer Officer",
    sceneNote:
      "The Sapper: a serving engineer whose postal disguise fits badly because the uniform keeps leaking through.",
  },
  {
    id: "npc_emil_roth",
    displayName: "Emil Roth",
    publicRole: "Book Restorer",
    sceneNote:
      "False center of the Razlom trail. Supplied measurements, not the knife.",
  },
  {
    id: "npc_anton_weber",
    displayName: "Anton Weber",
    publicRole: "Reichspost Route Clerk",
    sceneNote:
      "His genuine route and black-yellow twine were bent into cover by a forged military order.",
  },
  {
    id: "npc_rudi_kempf",
    displayName: "Rudi Kempf",
    publicRole: "Rail Yard Worker",
    sceneNote:
      "Protest noise made useful by someone else's plan. Angry, loud, and not the vault mind.",
  },
  {
    id: "npc_konrad_vossler",
    displayName: "Konrad Vossler",
    publicRole: "Chemistry Teacher",
    sceneNote:
      "Dead Registry / Case02 mirror to Stoll: same school of demolition, one refusal away from a different life.",
  },
  {
    id: "npc_weber_dispatcher",
    displayName: "Lotte Weber",
    publicRole: "Chief Telephone Operator",
    sceneNote:
      "Manages the switchboard, supervises the telephone women, and quietly sells city notes to a newspaper. Reads line traffic the way a hunter reads tracks.",
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
  {
    id: "npc_sasha_hartmann_servant",
    displayName: 'Alexander "Sasha"',
    publicRole: "Hartmann Family Servant",
    sceneNote:
      "Private Hartmann household support: service routes, luggage, and quiet crisis handling. Reads Eleonora's symptoms but not the occult truth behind them.",
  },
];

const LOCATION_CAST_ENTRIES: LocationCastEntry[] = [
  {
    locationId: "loc_freiburg_bank",
    tone: "tense",
    dramaticFunction: "evidence_hub",
    primaryNpcId: "npc_heinrich_galdermann",
    supportNpcIds: ["npc_kessler_banker", "npc_vetter_clerk"],
  },
  {
    locationId: "loc_freiburg_warehouse",
    tone: "dangerous",
    dramaticFunction: "finale_pressure",
    primaryNpcId: "npc_heinrich_galdermann",
    supportNpcIds: ["npc_albrecht_stoll"],
  },
  {
    locationId: "loc_munster",
    tone: "scholarly",
    dramaticFunction: "false_trail_grimoire",
    primaryNpcId: "npc_emil_roth",
    supportNpcIds: [],
  },
  {
    locationId: "loc_workers_pub",
    tone: "volatile",
    dramaticFunction: "false_trail_noise",
    primaryNpcId: "npc_rudi_kempf",
    supportNpcIds: [],
  },
  {
    locationId: "loc_hbf",
    tone: "busy",
    dramaticFunction: "route_and_pressure",
    primaryNpcId: "npc_anton_weber",
    supportNpcIds: ["npc_krebs_mugger"],
  },
  {
    locationId: "loc_uni_chem",
    tone: "guarded",
    dramaticFunction: "case02_mirror",
    primaryNpcId: "npc_konrad_vossler",
    supportNpcIds: [],
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
  {
    locationId: "loc_freiburg_estate",
    tone: "contained",
    dramaticFunction: "household_support",
    primaryNpcId: "npc_mother_hartmann",
    supportNpcIds: ["npc_sasha_hartmann_servant", "npc_felix_hartmann"],
  },
];

export const FREIBURG_NPC_REGISTRY_BY_ID = new Map<string, NpcCastProfile>(
  NPC_PROFILES.map((npc) => [npc.id, npc]),
);

export const FREIBURG_LOCATION_CAST_BY_ID = new Map<string, LocationCastEntry>(
  LOCATION_CAST_ENTRIES.map((entry) => [entry.locationId, entry]),
);
