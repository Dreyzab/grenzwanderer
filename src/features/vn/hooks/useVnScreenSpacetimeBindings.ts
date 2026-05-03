import { useReducer, useTable } from "spacetimedb/react";
import type { ParamsType } from "spacetimedb";
import { reducers, tables } from "../../../shared/spacetime/bindings";
import type {
  AiRequest,
  PlayerAgencyCareer,
  PlayerEvidence,
  PlayerInventory,
  PlayerMindFact,
  PlayerNpcFavor,
  PlayerNpcState,
  PlayerQuest,
  PlayerRumorState,
  VnSession,
  VnSkillCheckResult,
  ContentSnapshot,
  ContentVersion,
} from "../../../shared/spacetime/bindings";

type ReducerDef = Parameters<typeof useReducer>[0];

type ReducerCall<TReducerDef extends ReducerDef> = (
  ...params: ParamsType<TReducerDef>
) => Promise<void>;

interface VnScreenSpacetimeBindings {
  versions: readonly ContentVersion[];
  versionsReady: boolean;
  snapshots: readonly ContentSnapshot[];
  snapshotsReady: boolean;
  sessions: readonly VnSession[];
  sessionsReady: boolean;
  skillResults: readonly VnSkillCheckResult[];
  aiRequests: readonly AiRequest[];
  questRows: readonly PlayerQuest[];
  npcStateRows: readonly PlayerNpcState[];
  npcStateReady: boolean;
  npcFavorRows: readonly PlayerNpcFavor[];
  agencyCareerRows: readonly PlayerAgencyCareer[];
  rumorStateRows: readonly PlayerRumorState[];
  mindFactRows: readonly PlayerMindFact[];
  evidenceRows: readonly PlayerEvidence[];
  inventoryRows: readonly PlayerInventory[];
  startScenario: ReducerCall<typeof reducers.startScenario>;
  recordChoice: ReducerCall<typeof reducers.recordChoice>;
  performSkillCheckReducer: ReducerCall<typeof reducers.performSkillCheck>;
  enqueueAiRequest: ReducerCall<typeof reducers.enqueueAiRequest>;
  enqueueProvidenceDialogue: ReducerCall<
    typeof reducers.enqueueProvidenceDialogue
  >;
  discoverFact: ReducerCall<typeof reducers.discoverFact>;
  grantEvidence: ReducerCall<typeof reducers.grantEvidence>;
  grantItem: ReducerCall<typeof reducers.grantItem>;
}

export function useVnScreenSpacetimeBindings(): VnScreenSpacetimeBindings {
  const [versions, versionsReady] = useTable(tables.contentVersion);
  const [snapshots, snapshotsReady] = useTable(tables.contentSnapshot);
  const [sessions, sessionsReady] = useTable(tables.myVnSessions);
  const [skillResults] = useTable(tables.myVnSkillResults);
  const [aiRequests] = useTable(tables.myAiRequests);
  const [questRows] = useTable(tables.myQuests);
  const [npcStateRows, npcStateReady] = useTable(tables.myNpcState);
  const [npcFavorRows] = useTable(tables.myNpcFavors);
  const [agencyCareerRows] = useTable(tables.myAgencyCareer);
  const [rumorStateRows] = useTable(tables.myRumorState);
  const [mindFactRows] = useTable(tables.myMindFacts);
  const [evidenceRows] = useTable(tables.myEvidence);
  const [inventoryRows] = useTable(tables.myPlayerInventory);

  const startScenario = useReducer(reducers.startScenario);
  const recordChoice = useReducer(reducers.recordChoice);
  const performSkillCheckReducer = useReducer(reducers.performSkillCheck);
  const enqueueAiRequest = useReducer(reducers.enqueueAiRequest);
  const enqueueProvidenceDialogue = useReducer(
    reducers.enqueueProvidenceDialogue,
  );
  const discoverFact = useReducer(reducers.discoverFact);
  const grantEvidence = useReducer(reducers.grantEvidence);
  const grantItem = useReducer(reducers.grantItem);

  return {
    versions,
    versionsReady,
    snapshots,
    snapshotsReady,
    sessions,
    sessionsReady,
    skillResults,
    aiRequests,
    questRows,
    npcStateRows,
    npcStateReady,
    npcFavorRows,
    agencyCareerRows,
    rumorStateRows,
    mindFactRows,
    evidenceRows,
    inventoryRows,
    startScenario,
    recordChoice,
    performSkillCheckReducer,
    enqueueAiRequest,
    enqueueProvidenceDialogue,
    discoverFact,
    grantEvidence,
    grantItem,
  };
}
