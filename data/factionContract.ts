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
