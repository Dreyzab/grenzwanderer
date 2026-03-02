import { useMemo, useRef, useState } from "react";
import { useReducer, useTable } from "spacetimedb/react";
import { Building2, Landmark, Map as MapIcon, QrCode } from "lucide-react";
import { getOriginProfileById } from "../features/character/originProfiles";
import { OriginDossierScreen } from "../features/origin/ui/JournalistDossierScreen";
import {
  resolveFreiburgEntryTarget,
  type FreiburgEntryTarget,
} from "../features/vn/entry/freiburgEntry";
import { parseSnapshot } from "../features/vn/vnContent";
import { reducers, tables } from "../shared/spacetime/bindings";
import { useIdentity } from "../shared/spacetime/useIdentity";

interface HomePageProps {
  onNavigate: (
    target: "vn" | "character" | "map" | "mind_palace" | "dev",
  ) => void;
  onOpenVnScenario: (scenarioId: string) => void;
}

type CitySelection = "freiburg_1905" | "karlsruhe_1905";

const JOURNALIST_PROFILE_ID = "journalist";
const BOOTSTRAP_SCENARIO_ID = "origin_journalist_bootstrap";

const buildPlayerFlags = (
  identityHex: string,
  flagsRows: readonly {
    playerId: { toHexString(): string };
    key: string;
    value: boolean;
  }[],
): Record<string, boolean> => {
  if (!identityHex) {
    return {};
  }

  const result: Record<string, boolean> = {};
  for (const row of flagsRows) {
    if (row.playerId.toHexString() !== identityHex) {
      continue;
    }
    result[row.key] = row.value;
  }
  return result;
};

const resolveSyncStatus = (
  isConnected: boolean,
  contentReady: boolean,
  sessionReady: boolean,
  flagsReady: boolean,
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
  if (!sessionReady || !flagsReady) {
    return "Syncing player state...";
  }
  return "Syncing...";
};

export const HomePage = ({ onNavigate, onOpenVnScenario }: HomePageProps) => {
  const { identityHex, isConnected, connectionError } = useIdentity();
  const startScenario = useReducer(reducers.startScenario);

  const [versions, versionsReady] = useTable(tables.contentVersion);
  const [snapshots, snapshotsReady] = useTable(tables.contentSnapshot);
  const [sessions, sessionsReady] = useTable(tables.vnSession);
  const [flagsRows, flagsReady] = useTable(tables.playerFlag);

  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [dossierStatus, setDossierStatus] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [selectedCity, setSelectedCity] =
    useState<CitySelection>("freiburg_1905");
  const launchInFlightRef = useRef(false);

  const contentReady = versionsReady && snapshotsReady;
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

  const playerFlags = useMemo(
    () => buildPlayerFlags(identityHex, flagsRows),
    [flagsRows, identityHex],
  );
  const hasAnyPlayerProgress = useMemo(
    () =>
      sessions.some(
        (session) => session.playerId.toHexString() === identityHex,
      ),
    [identityHex, sessions],
  );

  const originProfile = useMemo(
    () => getOriginProfileById(JOURNALIST_PROFILE_ID),
    [],
  );

  const entryTarget = useMemo<FreiburgEntryTarget>(
    () =>
      resolveFreiburgEntryTarget({
        isConnected,
        contentReady,
        sessionReady: sessionsReady,
        flagsReady,
        identityHex,
        snapshot,
        sessions,
        flags: playerFlags,
        originProfile,
      }),
    [
      contentReady,
      flagsReady,
      identityHex,
      isConnected,
      originProfile,
      playerFlags,
      sessions,
      sessionsReady,
      snapshot,
    ],
  );

  const syncStatus = resolveSyncStatus(
    isConnected,
    contentReady,
    sessionsReady,
    flagsReady,
    Boolean(connectionError),
  );
  const isEntryBlocked = entryTarget.kind === "blocked_sync";
  const isFreiburgSelected = selectedCity === "freiburg_1905";

  const handleOpenScenario = (scenarioId: string) => {
    onOpenVnScenario(scenarioId);
  };

  const handleFreshStart = async (scenarioId: string) => {
    if (launchInFlightRef.current) {
      return;
    }

    launchInFlightRef.current = true;
    setIsLaunching(true);
    setDossierStatus(null);

    try {
      await startScenario({
        requestId: `home_restart_${Date.now()}`,
        scenarioId,
      });
      handleOpenScenario(scenarioId);
    } catch (_error) {
      setDossierStatus("Failed to start scenario. Please retry.");
    } finally {
      window.setTimeout(() => {
        launchInFlightRef.current = false;
        setIsLaunching(false);
      }, 350);
    }
  };

  const handleFreiburgClick = async () => {
    if (!originProfile) {
      return;
    }

    if (entryTarget.kind === "blocked_sync") {
      setDossierStatus(syncStatus);
      return;
    }

    if (entryTarget.kind === "resume" || entryTarget.kind === "start") {
      handleOpenScenario(entryTarget.scenarioId);
      return;
    }

    setDossierStatus(null);
    setIsDossierOpen(true);
  };

  const handleContinue = async () => {
    if (!isFreiburgSelected) {
      setDossierStatus("Karlsruhe flow is not available yet.");
      return;
    }
    await handleFreiburgClick();
  };

  const handleNewGame = async () => {
    if (!isFreiburgSelected) {
      setDossierStatus("Karlsruhe flow is not available yet.");
      return;
    }

    if (entryTarget.kind === "blocked_sync") {
      setDossierStatus(syncStatus);
      return;
    }

    if (hasAnyPlayerProgress) {
      const shouldRestart = window.confirm(
        "Start new game? Current progress in Freiburg flow will be reset.",
      );
      if (!shouldRestart) {
        return;
      }
    }

    if (entryTarget.kind === "resume" || entryTarget.kind === "start") {
      await handleFreshStart(entryTarget.scenarioId);
      return;
    }

    setDossierStatus(null);
    setIsDossierOpen(true);
  };

  const handleDossierConfirm = async () => {
    if (launchInFlightRef.current) {
      return;
    }

    if (entryTarget.kind === "blocked_sync") {
      setDossierStatus(syncStatus);
      return;
    }

    await handleFreshStart(BOOTSTRAP_SCENARIO_ID);
    setIsDossierOpen(false);
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
                setDossierStatus(null);
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
                setDossierStatus(null);
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

          {(isEntryBlocked || dossierStatus) && (
            <p className="text-[12px] text-amber-200/80 mb-4">
              {dossierStatus ?? syncStatus}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => void handleContinue()}
              className="h-12 bg-[#44403c] hover:bg-[#57534e] text-[#f5f5f4] border border-[#57534e] flex items-center justify-center gap-2 rounded-lg transition-colors"
            >
              {isLaunching ? "Opening..." : "Continue"}
            </button>
            <button
              type="button"
              onClick={() => void handleNewGame()}
              className="h-12 bg-[#a16207] hover:bg-[#b45309] text-[#f5f5f4] border border-[#b45309] flex items-center justify-center gap-2 rounded-lg transition-colors"
            >
              New Game
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("map")}
            className="w-full h-11 bg-primary/80 hover:bg-primary text-[#f5f5f4] font-bold flex items-center justify-center gap-2 rounded-lg transition-colors"
          >
            <QrCode className="w-4 h-4" strokeWidth={2.5} />
            Scan Start Code
          </button>
        </div>
      </main>

      {isDossierOpen && (
        <OriginDossierScreen
          profileId={JOURNALIST_PROFILE_ID}
          onConfirm={handleDossierConfirm}
          onCancel={() => setIsDossierOpen(false)}
          disabled={isEntryBlocked || isLaunching}
          status={isEntryBlocked ? syncStatus : dossierStatus}
        />
      )}
    </div>
  );
};
