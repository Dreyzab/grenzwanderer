import { useMemo, useRef, useState } from "react";
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
  onOpenVnScenario: (scenarioId: string) => void;
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
): string => {
  if (hasConnectionError) {
    return "Connection error. Reconnecting...";
  }
  if (!isConnected) {
    return "Connecting to SpacetimeDB...";
  }
  if (!contentReady) {
    return "Syncing content snapshot...";
  }
  if (!playerStateReady) {
    return "Syncing player state...";
  }
  return "Syncing...";
};

const hasFreiburgProgressHeuristic = (
  sessions: readonly unknown[],
  flags: Record<string, boolean>,
): boolean => {
  if (sessions.length === 0 && Object.keys(flags).length === 0) {
    return false;
  }

  if (sessions.length > 0) {
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

const postDebugLog = (
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
  runId = "run1",
): void => {
  // #region agent log
  fetch("http://127.0.0.1:7827/ingest/516e26f3-8222-4f1d-b4fe-801d6fa79ab1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "f85e6b",
    },
    body: JSON.stringify({
      sessionId: "f85e6b",
      runId,
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
};

export const HomePage = ({ onNavigate, onOpenVnScenario }: HomePageProps) => {
  const { identityHex, isConnected, connectionError } = useIdentity();
  const beginFreiburgOrigin = useReducer(reducers.beginFreiburgOrigin);

  const [versions, versionsReady] = useTable(tables.contentVersion);
  const [snapshots, snapshotsReady] = useTable(tables.contentSnapshot);
  const [sessions, sessionsReady] = useTable(tables.myVnSessions);
  const [flagsRows, flagsReady] = useTable(tables.myPlayerFlags);

  const [flowState, setFlowState] = useState<FreiburgFlowState>("idle");
  const [flowStatus, setFlowStatus] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [selectedCity, setSelectedCity] =
    useState<CitySelection>("freiburg_1905");
  const [pendingResetOnBegin, setPendingResetOnBegin] = useState(false);
  const launchInFlightRef = useRef(false);

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
    (sessionsReady && flagsReady) || Boolean(isConnected && identityHex);

  const playerFlags = useMemo(
    () => buildPlayerFlags(Boolean(identityHex), flagsRows),
    [flagsRows, identityHex],
  );
  const hasAnyPlayerProgress = useMemo(
    () => hasFreiburgProgressHeuristic(sessions, playerFlags),
    [playerFlags, sessions],
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
  );
  const isEntryBlocked = entryTarget.kind === "blocked_sync";
  const isFreiburgSelected = selectedCity === "freiburg_1905";
  const pageStatus = isEntryBlocked ? syncStatus : flowStatus;

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

  const handleOpenScenario = (scenarioId: string) => {
    onOpenVnScenario(scenarioId);
  };

  const handleContinue = async () => {
    postDebugLog(
      "HomePage.tsx:handleContinue",
      "Continue pressed",
      {
        selectedCity,
        entryTargetKind: entryTarget.kind,
        entryScenarioId:
          entryTarget.kind === "start" || entryTarget.kind === "resume"
            ? entryTarget.scenarioId
            : null,
      },
      "H1",
    );
    if (!isFreiburgSelected) {
      setFlowStatus("Karlsruhe flow is not available yet.");
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
      setFlowStatus("Karlsruhe flow is not available yet.");
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
      handleOpenScenario(profile.scenarioId);
      closeOriginFlow();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to begin Freiburg origin. Please retry.";
      setFlowStatus(message);
    } finally {
      window.setTimeout(() => {
        launchInFlightRef.current = false;
        setIsLaunching(false);
      }, 350);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-stone-950 text-stone-200 flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 bg-[url('/images/paper-texture.png')] opacity-[0.05] mix-blend-overlay pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-stone-950 via-transparent to-stone-950/80 pointer-events-none" />

      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-10 pb-24 relative z-10">
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
              Select City
            </h2>
          </div>
          <p className="text-gray-400 text-sm mb-6 m-0">
            Choose your active region or enter through a gateway QR.
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
              Freiburg 1905
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
              Karlsruhe 1905
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
              {isLaunching ? "Opening..." : "Continue"}
            </button>
            <button
              type="button"
              onClick={() => void handleNewGame()}
              disabled={isLaunching}
              className="h-12 bg-[#a16207] hover:bg-[#b45309] text-[#f5f5f4] border border-[#b45309] flex items-center justify-center gap-2 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              New Game
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("map", { mapPanel: "qr" })}
            className="w-full h-11 bg-primary/80 hover:bg-primary text-[#f5f5f4] font-bold flex items-center justify-center gap-2 rounded-lg transition-colors"
          >
            <QrCode className="w-4 h-4" strokeWidth={2.5} />
            Scan Start Code
          </button>
        </div>
      </main>

      {flowState === "confirm_reset" ? (
        <ConfirmationModal
          title="Start New Game?"
          description="This will wipe current Freiburg progress and begin a fresh origin route after dossier confirmation."
          confirmLabel="Confirm Reset"
          onCancel={closeOriginFlow}
          onConfirm={() => openOriginSelection(true)}
        />
      ) : null}

      {flowState === "select_origin" ? (
        <OriginSelectionScreen
          disabled={isEntryBlocked || isLaunching}
          status={isEntryBlocked ? syncStatus : flowStatus}
          onCancel={closeOriginFlow}
          onConfirmOrigin={(profileId) => void handleOriginConfirm(profileId)}
        />
      ) : null}
    </div>
  );
};
