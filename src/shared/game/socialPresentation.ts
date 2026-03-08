import type {
  CareerRankDefinition,
  FactionSignalTrend,
  NpcRuntimeIdentity,
  SocialCatalogSnapshot,
} from "../../features/vn/types";

export interface SocialBandPresentation {
  label: string;
  tone: "danger" | "warning" | "neutral" | "success" | "highlight";
}

export interface FavorPresentation {
  label: string;
  tone: SocialBandPresentation["tone"];
}

export interface FactionSignalPresentation {
  factionId: string;
  label: string;
  stateLabel: string;
  trendLabel: string;
  color: string;
  intensityPercent: number;
}

const TRUST_BANDS: Array<{
  min: number;
  label: string;
  tone: SocialBandPresentation["tone"];
}> = [
  { min: 60, label: "Союзник", tone: "highlight" },
  { min: 25, label: "Надёжный контакт", tone: "success" },
  { min: -9, label: "Рабочий контакт", tone: "neutral" },
  { min: -39, label: "Напряжённое знакомство", tone: "warning" },
  { min: Number.NEGATIVE_INFINITY, label: "Чужой", tone: "danger" },
];

const AGENCY_STANDING_BANDS: Array<{
  min: number;
  label: string;
  tone: SocialBandPresentation["tone"];
}> = [
  { min: 70, label: "Лицо агентства", tone: "highlight" },
  { min: 40, label: "Ценный агент", tone: "success" },
  { min: 15, label: "Надёжный сотрудник", tone: "neutral" },
  { min: -19, label: "На испытании", tone: "warning" },
  { min: Number.NEGATIVE_INFINITY, label: "Под наблюдением", tone: "danger" },
];

const FACTION_META: Record<
  string,
  { label: string; color: string; positive: [string, string, string] }
> = {
  civic_order: {
    label: "Civic Order",
    color: "#2563eb",
    positive: ["Закрыт", "Осторожный канал", "Открытый канал"],
  },
  underworld: {
    label: "Underworld",
    color: "#ea580c",
    positive: ["Холодный след", "Тонкий контакт", "Глубокий доступ"],
  },
  financial_bloc: {
    label: "Financial Bloc",
    color: "#ca8a04",
    positive: ["Сдержанная реакция", "Рабочая вежливость", "Открытые двери"],
  },
};

const FALLBACK_RANKS: CareerRankDefinition[] = [
  {
    id: "trainee",
    label: "Стажёр",
    order: 0,
    standingRequired: -100,
    serviceCriteriaNeeded: 0,
    privileges: [],
  },
  {
    id: "junior_detective",
    label: "Младший детектив",
    order: 1,
    standingRequired: 15,
    qualifyingCaseId: "quest_banker",
    serviceCriteriaNeeded: 2,
    privileges: [],
  },
  {
    id: "agency_detective",
    label: "Детектив агентства",
    order: 2,
    standingRequired: 35,
    serviceCriteriaNeeded: 2,
    privileges: [],
  },
  {
    id: "senior_detective",
    label: "Старший детектив",
    order: 3,
    standingRequired: 55,
    serviceCriteriaNeeded: 2,
    privileges: [],
  },
  {
    id: "lead_investigator",
    label: "Ведущий следователь",
    order: 4,
    standingRequired: 75,
    serviceCriteriaNeeded: 2,
    privileges: [],
  },
];

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const formatIdentifier = (value: string): string =>
  value
    .replace(/^npc_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (entry) => entry.toUpperCase());

export const getNpcIdentity = (
  socialCatalog: SocialCatalogSnapshot | undefined,
  npcId: string,
): NpcRuntimeIdentity | undefined =>
  socialCatalog?.npcIdentities.find((entry) => entry.id === npcId);

export const getNpcDisplayName = (
  socialCatalog: SocialCatalogSnapshot | undefined,
  npcId: string,
): string => getNpcIdentity(socialCatalog, npcId)?.displayName ?? formatIdentifier(npcId);

export const getTrustBandPresentation = (
  score: number,
): SocialBandPresentation =>
  TRUST_BANDS.find((entry) => score >= entry.min) ?? TRUST_BANDS[TRUST_BANDS.length - 1];

export const getAgencyStandingPresentation = (
  score: number,
): SocialBandPresentation =>
  AGENCY_STANDING_BANDS.find((entry) => score >= entry.min) ??
  AGENCY_STANDING_BANDS[AGENCY_STANDING_BANDS.length - 1];

export const getTrendLabel = (trend: FactionSignalTrend | string | null | undefined): string => {
  if (trend === "rising") {
    return "Тренд: растёт";
  }
  if (trend === "falling") {
    return "Тренд: падает";
  }
  return "Тренд: стабилен";
};

export const getFavorPresentation = (balance: number): FavorPresentation => {
  if (balance > 0) {
    return {
      label: balance === 1 ? "Персонаж вам должен" : `Долг перед вами: ${balance}`,
      tone: "success",
    };
  }
  if (balance < 0) {
    return {
      label: balance === -1 ? "Вы должны услугу" : `Ваш долг: ${Math.abs(balance)}`,
      tone: "warning",
    };
  }
  return {
    label: "Баланс услуг ровный",
    tone: "neutral",
  };
};

export const getFactionSignalPresentation = (
  factionId: string,
  value: number,
  trend?: FactionSignalTrend | string,
): FactionSignalPresentation => {
  const meta = FACTION_META[factionId] ?? {
    label: formatIdentifier(factionId),
    color: "#8a97a8",
    positive: ["Слабый сигнал", "Осторожный сигнал", "Открытый сигнал"] as [
      string,
      string,
      string,
    ],
  };
  const magnitude = Math.abs(value);
  const stateIndex = magnitude >= 40 ? 2 : magnitude >= 15 ? 1 : 0;

  return {
    factionId,
    label: meta.label,
    stateLabel: meta.positive[stateIndex],
    trendLabel: getTrendLabel(trend),
    color: meta.color,
    intensityPercent: clamp(Math.round((magnitude / 100) * 100), 12, 100),
  };
};

export const getCareerRanks = (
  socialCatalog: SocialCatalogSnapshot | undefined,
): CareerRankDefinition[] =>
  [...(socialCatalog?.careerRanks ?? FALLBACK_RANKS)].sort(
    (left, right) => left.order - right.order,
  );

export const getCareerRankDefinition = (
  socialCatalog: SocialCatalogSnapshot | undefined,
  rankId: string | null | undefined,
): CareerRankDefinition | undefined =>
  getCareerRanks(socialCatalog).find((entry) => entry.id === rankId);

export const getCareerRankLabel = (
  socialCatalog: SocialCatalogSnapshot | undefined,
  rankId: string | null | undefined,
): string => getCareerRankDefinition(socialCatalog, rankId)?.label ?? "Стажёр";

export const getCareerRankOrder = (
  socialCatalog: SocialCatalogSnapshot | undefined,
  rankId: string | null | undefined,
): number => getCareerRankDefinition(socialCatalog, rankId)?.order ?? -1;
