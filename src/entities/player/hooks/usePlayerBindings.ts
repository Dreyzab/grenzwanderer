import {
  createContext,
  createElement,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useTable } from "spacetimedb/react";
import { tables } from "../../../shared/spacetime/bindings";
import { useIdentity } from "../../../shared/spacetime/useIdentity";
import { mapPlayerFlags, mapPlayerVars } from "./playerRows";

interface PlayerAgencyCareerRow {
  standingScore: number;
  standingTrend: string;
  rankId: string;
  qualifyingCaseId?: unknown;
  rumorCriterionComplete: boolean;
  sourceCriterionComplete: boolean;
  cleanClosureCriterionComplete: boolean;
}

interface PlayerFactionSignalRow {
  factionId: string;
  value: number;
  trend: string;
}

interface PlayerFlagRow {
  key: string;
  value: boolean;
}

interface PlayerInventoryRow {
  itemId: string;
  quantity: number | bigint;
}

interface PlayerLocationRow {
  locationId: string;
}

interface PlayerNpcFavorRow {
  npcId: string;
  balance: number | bigint;
}

interface PlayerNpcStateRow {
  npcId: string;
  trustScore: number;
  availabilityState?: string;
}

interface PlayerProfileRow {
  nickname?: unknown;
}

interface PlayerQuestRow {
  questId: string;
  stage: number | bigint;
}

interface PlayerRelationshipRow {
  characterId: string;
  value: number;
}

interface PlayerVarRow {
  key: string;
  floatValue: number;
}

export interface PlayerBindings {
  identityHex: string;
  flags: Record<string, boolean>;
  vars: Record<string, number>;
  profile: PlayerProfileRow | null;
  location: PlayerLocationRow | null;
  inventory: readonly PlayerInventoryRow[];
  quests: readonly PlayerQuestRow[];
  relationships: readonly PlayerRelationshipRow[];
  npcState: readonly PlayerNpcStateRow[];
  npcFavors: readonly PlayerNpcFavorRow[];
  factionSignals: readonly PlayerFactionSignalRow[];
  agencyCareer: PlayerAgencyCareerRow | null;
  rows: {
    flags: readonly PlayerFlagRow[];
    vars: readonly PlayerVarRow[];
    profiles: readonly PlayerProfileRow[];
    locations: readonly PlayerLocationRow[];
    inventory: readonly PlayerInventoryRow[];
    quests: readonly PlayerQuestRow[];
    relationships: readonly PlayerRelationshipRow[];
    npcState: readonly PlayerNpcStateRow[];
    npcFavors: readonly PlayerNpcFavorRow[];
    factionSignals: readonly PlayerFactionSignalRow[];
    agencyCareer: readonly PlayerAgencyCareerRow[];
  };
}

const EMPTY_PLAYER_BINDINGS: PlayerBindings = {
  identityHex: "",
  flags: {},
  vars: {},
  profile: null,
  location: null,
  inventory: [],
  quests: [],
  relationships: [],
  npcState: [],
  npcFavors: [],
  factionSignals: [],
  agencyCareer: null,
  rows: {
    flags: [],
    vars: [],
    profiles: [],
    locations: [],
    inventory: [],
    quests: [],
    relationships: [],
    npcState: [],
    npcFavors: [],
    factionSignals: [],
    agencyCareer: [],
  },
};

const PlayerBindingsContext = createContext<PlayerBindings>(
  EMPTY_PLAYER_BINDINGS,
);

const usePlayerBindingsFromTables = (): PlayerBindings => {
  const { identityHex } = useIdentity();
  const [flagRows] = useTable(tables.myPlayerFlags);
  const [varRows] = useTable(tables.myPlayerVars);
  const [profileRows] = useTable(tables.myPlayerProfile);
  const [locationRows] = useTable(tables.myPlayerLocation);
  const [inventoryRows] = useTable(tables.myPlayerInventory);
  const [questRows] = useTable(tables.myQuests);
  const [relationshipRows] = useTable(tables.myRelationships);
  const [npcStateRows] = useTable(tables.myNpcState);
  const [npcFavorRows] = useTable(tables.myNpcFavors);
  const [factionSignalRows] = useTable(tables.myFactionSignals);
  const [agencyCareerRows] = useTable(tables.myAgencyCareer);
  const hasIdentity = Boolean(identityHex);

  const flags = useMemo(
    () => mapPlayerFlags(flagRows, hasIdentity),
    [flagRows, hasIdentity],
  );
  const vars = useMemo(
    () => mapPlayerVars(varRows, hasIdentity),
    [hasIdentity, varRows],
  );

  return useMemo(
    () => ({
      identityHex,
      flags,
      vars,
      profile: hasIdentity ? (profileRows[0] ?? null) : null,
      location: hasIdentity ? (locationRows[0] ?? null) : null,
      inventory: hasIdentity ? inventoryRows : [],
      quests: hasIdentity ? questRows : [],
      relationships: hasIdentity ? relationshipRows : [],
      npcState: hasIdentity ? npcStateRows : [],
      npcFavors: hasIdentity ? npcFavorRows : [],
      factionSignals: hasIdentity ? factionSignalRows : [],
      agencyCareer: hasIdentity ? (agencyCareerRows[0] ?? null) : null,
      rows: {
        flags: hasIdentity ? flagRows : [],
        vars: hasIdentity ? varRows : [],
        profiles: hasIdentity ? profileRows : [],
        locations: hasIdentity ? locationRows : [],
        inventory: hasIdentity ? inventoryRows : [],
        quests: hasIdentity ? questRows : [],
        relationships: hasIdentity ? relationshipRows : [],
        npcState: hasIdentity ? npcStateRows : [],
        npcFavors: hasIdentity ? npcFavorRows : [],
        factionSignals: hasIdentity ? factionSignalRows : [],
        agencyCareer: hasIdentity ? agencyCareerRows : [],
      },
    }),
    [
      agencyCareerRows,
      factionSignalRows,
      flagRows,
      flags,
      hasIdentity,
      identityHex,
      inventoryRows,
      locationRows,
      npcFavorRows,
      npcStateRows,
      profileRows,
      questRows,
      relationshipRows,
      varRows,
      vars,
    ],
  );
};

export const PlayerBindingsProvider = ({
  children,
}: {
  children: ReactNode;
}): ReactNode => {
  const bindings = usePlayerBindingsFromTables();

  return createElement(
    PlayerBindingsContext.Provider,
    { value: bindings },
    children,
  );
};

export const usePlayerBindings = (): PlayerBindings =>
  useContext(PlayerBindingsContext);
