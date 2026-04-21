export type FactionLayer = "daylight" | "political" | "shadow";
export type FactionVisibility = "public" | "hidden";

export interface FactionDefinition {
  id: string;
  label: string;
  order: number;
  color: string;
  layer: FactionLayer;
  visibility: FactionVisibility;
  signalStateLabels: readonly [string, string, string];
}

export const LEGACY_REPUTATION_VAR_BY_FACTION_ID = {
  civic_order: "rep_civic",
  financial_bloc: "rep_finance",
  underworld: "rep_underworld",
} as const;

export const LEGACY_LAYER_BY_FACTION_ID = {
  civic_order: "daylight",
  financial_bloc: "political",
  underworld: "shadow",
} as const satisfies Record<
  keyof typeof LEGACY_REPUTATION_VAR_BY_FACTION_ID,
  FactionLayer
>;

export const MIN_FACTION_PRESSURE_REVEAL = 15;
export const MAX_ALIGNMENT_CONTRIBUTION = 40;
export const MAX_ALIGNMENT_FACTIONS_PER_LAYER = 2;

export type FactionRevealReason = "contact" | "pressure";
export type FactionCatalogSource =
  | { factions?: FactionDefinition[] }
  | { socialCatalog?: { factions?: FactionDefinition[] } }
  | undefined;

export const CANONICAL_FACTION_REGISTRY: FactionDefinition[] = [
  {
    id: "city_chancellery",
    label: "City Chancellery",
    order: 10,
    color: "#4B6CB7",
    layer: "daylight",
    visibility: "public",
    signalStateLabels: ["Cold reception", "Working contact", "Trusted source"],
  },
  {
    id: "masters_union",
    label: "Masters Union",
    order: 20,
    color: "#92400E",
    layer: "daylight",
    visibility: "public",
    signalStateLabels: [
      "Outside the guild",
      "Known craft hand",
      "Shop-floor ally",
    ],
  },
  {
    id: "college_of_reason",
    label: "College of Reason",
    order: 30,
    color: "#0F766E",
    layer: "daylight",
    visibility: "public",
    signalStateLabels: ["Outsider", "Recognized listener", "Trusted colleague"],
  },
  {
    id: "chapter_of_mercy",
    label: "Chapter of Mercy",
    order: 40,
    color: "#B45309",
    layer: "daylight",
    visibility: "public",
    signalStateLabels: [
      "Unknown petitioner",
      "Under shelter",
      "Trusted in the ward",
    ],
  },
  {
    id: "house_of_pledges",
    label: "House of Pledges",
    order: 50,
    color: "#CA8A04",
    layer: "political",
    visibility: "public",
    signalStateLabels: [
      "Measured response",
      "Working courtesy",
      "Doors held open",
    ],
  },
  {
    id: "city_network",
    label: "City Network",
    order: 60,
    color: "#7C3AED",
    layer: "shadow",
    visibility: "public",
    signalStateLabels: ["Unknown face", "Recognized regular", "One of ours"],
  },
  {
    id: "free_yards",
    label: "Free Yards",
    order: 70,
    color: "#DC2626",
    layer: "shadow",
    visibility: "public",
    signalStateLabels: [
      "From the street",
      "Marked by the yards",
      "Claimed by the yards",
    ],
  },
  {
    id: "the_returned",
    label: "The Returned",
    order: 80,
    color: "#374151",
    layer: "shadow",
    visibility: "hidden",
    signalStateLabels: ["Unseen", "Marked", "Recognized"],
  },
];

export const COMPATIBILITY_FACTION_IDS = [
  "civic_order",
  "financial_bloc",
  "underworld",
] as const;

export const CANONICAL_FACTION_IDS = new Set(
  CANONICAL_FACTION_REGISTRY.map((entry) => entry.id),
);
export const ALLOWED_FACTION_IDS = new Set([
  ...CANONICAL_FACTION_REGISTRY.map((entry) => entry.id),
  ...COMPATIBILITY_FACTION_IDS,
]);

function isFactionLayer(value: unknown): value is FactionLayer {
  return value === "daylight" || value === "political" || value === "shadow";
}

function isFactionVisibility(value: unknown): value is FactionVisibility {
  return value === "public" || value === "hidden";
}

export function isCanonicalFactionId(value: unknown): value is string {
  return typeof value === "string" && CANONICAL_FACTION_IDS.has(value);
}

export function isAllowedFactionId(value: unknown): value is string {
  return typeof value === "string" && ALLOWED_FACTION_IDS.has(value);
}

export function isFactionDefinition(
  value: unknown,
): value is FactionDefinition {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    isCanonicalFactionId(entry.id) &&
    typeof entry.label === "string" &&
    typeof entry.order === "number" &&
    Number.isFinite(entry.order) &&
    typeof entry.color === "string" &&
    isFactionLayer(entry.layer) &&
    isFactionVisibility(entry.visibility) &&
    Array.isArray(entry.signalStateLabels) &&
    entry.signalStateLabels.length === 3 &&
    entry.signalStateLabels.every((label) => typeof label === "string")
  );
}

const getSourceFactions = (
  source?: FactionCatalogSource,
): FactionDefinition[] | undefined => {
  if (!source) {
    return undefined;
  }

  if ("factions" in source && Array.isArray(source.factions)) {
    return source.factions.filter(isFactionDefinition);
  }

  if (
    "socialCatalog" in source &&
    source.socialCatalog &&
    Array.isArray(source.socialCatalog.factions)
  ) {
    return source.socialCatalog.factions.filter(isFactionDefinition);
  }

  return undefined;
};

export const getFactionCatalog = (
  source?: FactionCatalogSource,
): FactionDefinition[] => {
  const snapshotFactions = getSourceFactions(source);
  if (!snapshotFactions || snapshotFactions.length === 0) {
    return [...CANONICAL_FACTION_REGISTRY];
  }

  const snapshotById = new Map(
    snapshotFactions.map((entry) => [entry.id, entry] as const),
  );

  return CANONICAL_FACTION_REGISTRY.map(
    (entry) => snapshotById.get(entry.id) ?? entry,
  );
};

export const getPublicFactionCatalog = (
  source?: FactionCatalogSource,
): FactionDefinition[] =>
  getFactionCatalog(source).filter((entry) => entry.visibility === "public");

export const getFactionDefinition = (
  factionId: string,
  source?: FactionCatalogSource,
): FactionDefinition | undefined =>
  getFactionCatalog(source).find((entry) => entry.id === factionId);
