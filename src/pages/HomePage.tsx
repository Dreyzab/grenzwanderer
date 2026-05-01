import { useEffect, useMemo, useRef, useState } from "react";
import { useReducer, useTable } from "spacetimedb/react";
import { Building2, Landmark, Map as MapIcon, QrCode } from "lucide-react";
import {
  getOriginProfileById,
  originProfiles,
} from "../features/character/originProfiles";
import { OriginSelectionScreen } from "../features/origin/ui/OriginSelectionScreen";
import {
  resolveFreiburgEntryTarget,
  type FreiburgEntryTarget,
} from "../features/vn/entry/freiburgEntry";
import { parseSnapshot } from "../features/vn/vnContent";
import { reducers, tables } from "../shared/spacetime/bindings";
import { useIdentity } from "../shared/spacetime/useIdentity";
import { ConfirmationModal } from "../shared/ui/ConfirmationModal";
import type { OpenVnScenarioOptions } from "../app/AppShell";
import { useI18n } from "../features/i18n/I18nContext";
import { getHomeStrings, getSharedStrings } from "../features/i18n/uiStrings";

interface HomePageProps {
  onNavigate: (
    target:
      | "home"
      | "vn"
      | "character"
      | "map"
      | "mind_palace"
      | "command"
      | "battle",
    options?: { mapPanel?: "qr" },
  ) => void;
  onOpenVnScenario: (
    scenarioId: string,
    options?: OpenVnScenarioOptions,
  ) => void;
}

type CitySelection = "freiburg_1905" | "karlsruhe_1905";
type FreiburgFlowState = "idle" | "confirm_reset" | "select_origin";
const buildPlayerFlags = (
  isReady: boolean,
  flagsRows: readonly {
    key: string;
    value: boolean;
  }[],
): Record<string, boolean> => {
  if (!isReady) {
    return {};
  }

  const result: Record<string, boolean> = {};
  for (const row of flagsRows) {
    result[row.key] = row.value;
  }
  return result;
};

const resolveSyncStatus = (
  isConnected: boolean,
  contentReady: boolean,
  playerStateReady: boolean,
  hasConnectionError: boolean,
  home: ReturnType<typeof getHomeStrings>,
): string => {
  if (hasConnectionError) {
    return home.connectionError;
  }
  if (!isConnected) {
    return home.connecting;
  }
  if (!contentReady) {
    return home.syncingContent;
  }
  if (!playerStateReady) {
    return home.syncingPlayer;
  }
  return home.syncingRecords;
};

const hasFreiburgProgressHeuristic = (
  sessions: readonly unknown[],
  flags: Record<string, boolean>,
  inventory: readonly unknown[],
  vars: readonly unknown[],
  quests: readonly unknown[],
  evidence: readonly unknown[],
): boolean => {
  if (
    sessions.length === 0 &&
    Object.keys(flags).length === 0 &&
    inventory.length === 0 &&
    vars.length === 0 &&
    quests.length === 0 &&
    evidence.length === 0
  ) {
    return false;
  }

  if (
    sessions.length > 0 ||
    inventory.length > 0 ||
    vars.length > 0 ||
    quests.length > 0 ||
    evidence.length > 0
  ) {
    return true;
  }

  if (flags.char_creation_complete) {
    return true;
  }

  return originProfiles.some(
    (profile) =>
      Boolean(flags[profile.originFlagKey]) ||
      profile.handoffDoneFlagKeys.some((flagKey) => Boolean(flags[flagKey])),
  );
};

export const HomePage = ({ onNavigate, onOpenVnScenario }: HomePageProps) => {
  const { identityHex, isConnected, connectionError } = useIdentity();
  const beginFreiburgOrigin = useReducer(reducers.beginFreiburgOrigin);

  const [versions, versionsReady] = useTable(tables.contentVersion);
  const [snapshots, snapshotsReady] = useTable(tables.contentSnapshot);
  const [sessions, sessionsReady] = useTable(tables.myVnSessions);
  const [flagsRows, flagsReady] = useTable(tables.myPlayerFlags);
  const [inventory, inventoryReady] = useTable(tables.myPlayerInventory);
  const [vars, varsReady] = useTable(tables.myPlayerVars);
  const [quests, questsReady] = useTable(tables.myQuests);
  const [evidence, evidenceReady] = useTable(tables.myEvidence);

  const [flowState, setFlowState] = useState<FreiburgFlowState>("idle");
  const [flowStatus, setFlowStatus] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [selectedCity, setSelectedCity] =
    useState<CitySelection>("freiburg_1905");
  const [pendingResetOnBegin, setPendingResetOnBegin] = useState(false);
  const { isLoaded, language } = useI18n();
  const home = getHomeStrings(language);
  const shared = getSharedStrings(language);
  const launchInFlightRef = useRef(false);
  const launchResetTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(
    () => () => {
      isMountedRef.current = false;
      if (launchResetTimeoutRef.current) {
        window.clearTimeout(launchResetTimeoutRef.current);
      }
    },
    [],
  );

  const activeVersion = useMemo(
    () => versions.find((entry) => entry.isActive) ?? null,
    [versions],
  );

  const snapshot = useMemo(() => {
    if (!activeVersion) {
      return null;
    }

    const snapshotRow = snapshots.find(
      (entry) => entry.checksum === activeVersion.checksum,
    );
    if (!snapshotRow) {
      return null;
    }

    return parseSnapshot(snapshotRow.payloadJson);
  }, [activeVersion, snapshots]);
  const contentReady =
    (versionsReady && snapshotsReady) || Boolean(activeVersion && snapshot);
  const playerStateReady =
    (sessionsReady &&
      flagsReady &&
      inventoryReady &&
      varsReady &&
      questsReady &&
      evidenceReady) ||
    Boolean(isConnected && identityHex);

  const playerFlags = useMemo(
    () => buildPlayerFlags(Boolean(identityHex), flagsRows),
    [flagsRows, identityHex],
  );
  const hasAnyPlayerProgress = useMemo(
    () =>
      hasFreiburgProgressHeuristic(
        sessions,
        playerFlags,
        inventory,
        vars,
        quests,
        evidence,
      ),
    [playerFlags, sessions, inventory, vars, quests, evidence],
  );
  const entryTarget = useMemo<FreiburgEntryTarget>(
    () =>
      resolveFreiburgEntryTarget({
        isConnected,
        contentReady,
        sessionReady: playerStateReady,
        flagsReady: playerStateReady,
        identityHex,
        snapshot,
        sessions,
        flags: playerFlags,
      }),
    [
      contentReady,
      identityHex,
      isConnected,
      playerFlags,
      playerStateReady,
      sessions,
      snapshot,
    ],
  );

  const syncStatus = resolveSyncStatus(
    isConnected,
    contentReady,
    playerStateReady,
    Boolean(connectionError),
    home,
  );
  const isEntryBlocked = entryTarget.kind === "blocked_sync";
  const isFreiburgSelected = selectedCity === "freiburg_1905";
  const pageStatus = isEntryBlocked ? syncStatus : flowStatus;

  if (!isLoaded) {
    return (
      <div className="min-h-[100dvh] bg-stone-950 flex items-center justify-center">
        <div className="animate-pulse text-primary font-serif italic text-lg">
          {home.syncingRecords}
        </div>
      </div>
    );
  }

  const closeOriginFlow = () => {
    setFlowState("idle");
    setPendingResetOnBegin(false);
    setFlowStatus(null);
  };

  const openOriginSelection = (nextPendingReset: boolean) => {
    setPendingResetOnBegin(nextPendingReset);
    setFlowStatus(null);
    setFlowState("select_origin");
  };

  const handleOpenScenario = (
    scenarioId: string,
    options?: OpenVnScenarioOptions,
  ) => {
    if (options === undefined) {
      onOpenVnScenario(scenarioId);
      return;
    }
    onOpenVnScenario(scenarioId, options);
  };

  const handleContinue = async () => {
    if (!isFreiburgSelected) {
      setFlowStatus(home.karlsruheNotAvailable);
      return;
    }

    if (entryTarget.kind === "blocked_sync") {
      setFlowStatus(syncStatus);
      return;
    }

    if (entryTarget.kind === "resume" || entryTarget.kind === "start") {
      handleOpenScenario(entryTarget.scenarioId);
      return;
    }

    openOriginSelection(false);
  };

  const handleNewGame = async () => {
    if (!isFreiburgSelected) {
      setFlowStatus(home.karlsruheNotAvailable);
      return;
    }

    if (entryTarget.kind === "blocked_sync") {
      setFlowStatus(syncStatus);
      return;
    }

    if (hasAnyPlayerProgress) {
      setFlowStatus(null);
      setFlowState("confirm_reset");
      return;
    }

    openOriginSelection(false);
  };

  const handleOriginConfirm = async (profileId: string) => {
    const profile = getOriginProfileById(profileId);
    if (launchInFlightRef.current || !profile) {
      return;
    }

    if (entryTarget.kind === "blocked_sync") {
      setFlowStatus(syncStatus);
      return;
    }

    launchInFlightRef.current = true;
    setIsLaunching(true);
    setFlowStatus(null);

    try {
      await beginFreiburgOrigin({
        requestId: `home_begin_freiburg_${Date.now()}`,
        profileId: profile.id,
        resetProgress: pendingResetOnBegin,
      });
      handleOpenScenario(profile.scenarioId, { launchCurtain: true });
      closeOriginFlow();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to begin Freiburg origin. Please retry.";

      if (message.includes("resetProgress=true")) {
        setFlowState("confirm_reset");
        setPendingResetOnBegin(true);
        setFlowStatus(null);
        return;
      }

      setFlowStatus(message);
    } finally {
      if (!isMountedRef.current) {
        launchInFlightRef.current = false;
      } else {
        if (launchResetTimeoutRef.current) {
          window.clearTimeout(launchResetTimeoutRef.current);
        }

        launchResetTimeoutRef.current = window.setTimeout(() => {
          launchInFlightRef.current = false;
          launchResetTimeoutRef.current = null;
          if (isMountedRef.current) {
            setIsLaunching(false);
          }
        }, 350);
      }
    }
  };

  return (
    <div className="min-h-[100dvh] bg-stone-950 text-stone-200 flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 bg-[url('/images/paper-texture.png')] opacity-[0.05] mix-blend-overlay pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-stone-950 via-transparent to-stone-950/80 pointer-events-none" />

      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-10 pb-24 relative z-10 pt-14">
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            <h1 className="text-5xl md:text-7xl font-sans text-primary tracking-tighter drop-shadow-lg relative z-10">
              Grenzwanderer 4
            </h1>
            <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-full -z-10" />
          </div>

          <div className="h-[2px] w-16 bg-gradient-to-r from-transparent via-primary/80 to-transparent mx-auto opacity-70" />

          <p className="text-gray-500 font-serif italic text-base md:text-lg tracking-wide">
            Shadows of the Black Forest
          </p>
        </div>

        <div className="w-full max-w-lg bg-[#1c1917] border border-[#292524] p-6 rounded-2xl shadow-2xl text-left">
          <div className="flex items-center gap-3 mb-2">
            <MapIcon className="w-5 h-5 text-primary" strokeWidth={2.5} />
            <h2 className="text-2xl font-sans text-primary/90 font-bold m-0 tracking-wide">
              {home.selectCity}
            </h2>
          </div>
          <p className="text-gray-400 text-sm mb-6 m-0">
            {home.selectCityDescription}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => {
                setSelectedCity("freiburg_1905");
                setFlowStatus(null);
              }}
              className={`h-12 border flex items-center justify-center gap-2 rounded-lg transition-colors ${
                isFreiburgSelected
                  ? "bg-[#57534e] text-[#f5f5f4] border-[#a16207]"
                  : "bg-[#292524] hover:bg-[#44403c] text-[#f5f5f4] border-[#44403c]"
              }`}
            >
              <Building2 className="w-4 h-4" strokeWidth={2.5} />
              {home.freiburg1905}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCity("karlsruhe_1905");
                closeOriginFlow();
              }}
              className={`h-12 border flex items-center justify-center gap-2 rounded-lg transition-colors ${
                !isFreiburgSelected
                  ? "bg-[#57534e] text-[#f5f5f4] border-[#a16207]"
                  : "bg-[#292524] hover:bg-[#44403c] text-[#f5f5f4] border-[#44403c]"
              }`}
            >
              <Landmark className="w-4 h-4" strokeWidth={2.5} />
              {home.karlsruhe1905}
            </button>
          </div>

          {pageStatus ? (
            <p className="text-[12px] text-amber-200/80 mb-4">{pageStatus}</p>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => void handleContinue()}
              disabled={isLaunching}
              className="h-12 bg-[#44403c] hover:bg-[#57534e] text-[#f5f5f4] border border-[#57534e] flex items-center justify-center gap-2 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLaunching ? home.opening : home.continue}
            </button>
            <button
              type="button"
              onClick={() => void handleNewGame()}
              disabled={isLaunching}
              className="h-12 bg-[#a16207] hover:bg-[#b45309] text-[#f5f5f4] border border-[#b45309] flex items-center justify-center gap-2 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {home.newGame}
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("map", { mapPanel: "qr" })}
            className="w-full h-11 bg-primary/80 hover:bg-primary text-[#f5f5f4] font-bold flex items-center justify-center gap-2 rounded-lg transition-colors"
          >
            <QrCode className="w-4 h-4" strokeWidth={2.5} />
            {home.scanStartCode}
          </button>
        </div>
      </main>

      {flowState === "confirm_reset" ? (
        <ConfirmationModal
          title={home.startNewGameTitle}
          description={home.startNewGameDescription}
          confirmLabel={home.confirmReset}
          cancelLabel={shared.cancel}
          onCancel={closeOriginFlow}
          onConfirm={() => openOriginSelection(true)}
        />
      ) : null}

      {flowState === "select_origin" ? (
        <OriginSelectionScreen
          disabled={isEntryBlocked || isLaunching}
          status={isEntryBlocked ? syncStatus : flowStatus}
          onCancel={closeOriginFlow}
          onReset={() => openOriginSelection(true)}
          onConfirmOrigin={(profileId) => void handleOriginConfirm(profileId)}
        />
      ) : null}
    </div>
  );
};
