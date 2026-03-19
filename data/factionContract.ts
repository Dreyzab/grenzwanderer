export type CanonicalFactionId =
  | "city_chancellery"
  | "masters_union"
  | "college_of_reason"
  | "chapter_of_mercy"
  | "house_of_pledges"
  | "city_network"
  | "free_yards"
  | "the_returned";

export type CompatibilityFactionId =
  | "civic_order"
  | "financial_bloc"
  | "underworld";

export type AllowedFactionId = CanonicalFactionId | CompatibilityFactionId;
export type FactionLayer = "daylight" | "political" | "shadow";
export type FactionVisibility = "public" | "hidden";
export type FactionRevealReason = "contact" | "pressure";

export interface FactionDefinition {
  id: CanonicalFactionId;
  label: string;
  order: number;
  color: string;
  layer: FactionLayer;
  visibility: FactionVisibility;
  signalStateLabels: [string, string, string];
}

type FactionCatalogCarrier =
  | {
      factions?: FactionDefinition[] | null;
    }
  | {
      socialCatalog?: {
        factions?: FactionDefinition[] | null;
      } | null;
    }
  | null
  | undefined;

export type FactionCatalogSource = FactionCatalogCarrier;

export const MIN_FACTION_PRESSURE_REVEAL = 15;
export const MAX_ALIGNMENT_CONTRIBUTION = 40;
export const MAX_ALIGNMENT_FACTIONS_PER_LAYER = 2;

export const LEGACY_LAYER_BY_FACTION_ID: Record<
  CompatibilityFactionId,
  FactionLayer
> = {
  civic_order: "daylight",
  financial_bloc: "political",
  underworld: "shadow",
};

export const LEGACY_REPUTATION_VAR_BY_FACTION_ID: Record<
  CompatibilityFactionId,
  string
> = {
  civic_order: "rep_civic",
  financial_bloc: "rep_finance",
  underworld: "rep_underworld",
};

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
] as const;

const cloneFactionDefinition = (
  definition: FactionDefinition,
): FactionDefinition => ({
  ...definition,
  signalStateLabels: [...definition.signalStateLabels] as [
    string,
    string,
    string,
  ],
});

const sortFactionCatalog = (
  catalog: readonly FactionDefinition[],
): FactionDefinition[] =>
  [...catalog]
    .sort((left, right) => left.order - right.order)
    .map(cloneFactionDefinition);

export const COMPATIBILITY_FACTION_IDS: CompatibilityFactionId[] = [
  "civic_order",
  "financial_bloc",
  "underworld",
];

export const CANONICAL_FACTION_IDS = new Set<CanonicalFactionId>(
  CANONICAL_FACTION_REGISTRY.map((entry) => entry.id),
);

export const ALLOWED_FACTION_IDS = new Set<AllowedFactionId>([
  ...CANONICAL_FACTION_REGISTRY.map((entry) => entry.id),
  ...COMPATIBILITY_FACTION_IDS,
]);

export const isFactionLayer = (value: unknown): value is FactionLayer =>
  value === "daylight" || value === "political" || value === "shadow";

export const isFactionVisibility = (
  value: unknown,
): value is FactionVisibility => value === "public" || value === "hidden";

export const isCanonicalFactionId = (
  value: unknown,
): value is CanonicalFactionId =>
  typeof value === "string" &&
  CANONICAL_FACTION_IDS.has(value as CanonicalFactionId);

export const isCompatibilityFactionId = (
  value: unknown,
): value is CompatibilityFactionId =>
  value === "civic_order" ||
  value === "financial_bloc" ||
  value === "underworld";

export const isAllowedFactionId = (value: unknown): value is AllowedFactionId =>
  typeof value === "string" &&
  ALLOWED_FACTION_IDS.has(value as AllowedFactionId);

export const isFactionDefinition = (
  value: unknown,
): value is FactionDefinition => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const entry = value as Partial<FactionDefinition>;
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
};

export const getFactionCatalog = (
  source?: FactionCatalogCarrier,
): FactionDefinition[] => {
  const catalog =
    source && "socialCatalog" in source
      ? source.socialCatalog?.factions
      : source && "factions" in source
        ? source.factions
        : undefined;

  if (Array.isArray(catalog) && catalog.length > 0) {
    return sortFactionCatalog(catalog);
  }

  return sortFactionCatalog(CANONICAL_FACTION_REGISTRY);
};

export const getFactionDefinition = (
  factionId: string,
  source?: FactionCatalogCarrier,
): FactionDefinition | undefined =>
  getFactionCatalog(source).find((entry) => entry.id === factionId);

export const getPublicFactionCatalog = (
  source?: FactionCatalogCarrier,
): FactionDefinition[] =>
  getFactionCatalog(source).filter((entry) => entry.visibility === "public");

export const getFactionLayerForId = (
  factionId: string,
  source?: FactionCatalogCarrier,
): FactionLayer | undefined => {
  if (isCompatibilityFactionId(factionId)) {
    return LEGACY_LAYER_BY_FACTION_ID[factionId];
  }

  return getFactionDefinition(factionId, source)?.layer;
};
