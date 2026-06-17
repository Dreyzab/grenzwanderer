import { lazy, Suspense, useEffect } from "react";
import { useSpacetimeDB } from "spacetimedb/react";
import { RELEASE_PROFILE, SPACETIMEDB_DB_NAME } from "../config";
import { isKarlsruheEventProfile } from "../features/release/karlsruheEntry";
import { useIdentity } from "../shared/spacetime/useIdentity";
import { logShellDebug } from "./shellDebugLog";
import { ShellChrome } from "./ShellChrome";
import { ShellRouteRenderer } from "./ShellRouteRenderer";
import { useKarlsruheEntryGate } from "./useKarlsruheEntryGate";
import { useShellNavigation } from "./useShellNavigation";
import { useShellSessionAutoTabs } from "./useShellSessionAutoTabs";
import { useVnLaunchCurtain } from "./useVnLaunchCurtain";
import { useI18n } from "../features/i18n/I18nContext";
import { getHomeStrings } from "../features/i18n/uiStrings";
import "./AppShell.css";

const DevDebugOverlay = import.meta.env.DEV
  ? lazy(async () => {
      const module = await import("../shared/devtools/DebugOverlay");
      return { default: module.DebugOverlay };
    })
  : null;

const renderDevDebugOverlay = () =>
  DevDebugOverlay ? (
    <Suspense fallback={null}>
      <DevDebugOverlay />
    </Suspense>
  ) : null;

const AppShell = () => {
  const { language } = useI18n();
  const home = getHomeStrings(language);
  const { identity, identityHex } = useIdentity();
  /** Link layer from provider (Stable across Strict Mode); avoid ref+identity mismatch that flashes the blocking gate */
  const { isActive: dbLinkActive } = useSpacetimeDB();
  const showInitialSpacetimeGate = !identity && !dbLinkActive;
  const isActive = Boolean(identity);
  const isKarlsruheProfile = isKarlsruheEventProfile(RELEASE_PROFILE);
  const navigation = useShellNavigation(RELEASE_PROFILE);
  const {
    activeTab,
    entryToken,
    mapPanel,
    navigateToTab,
    pathname,
    setActiveTab,
    setEntryToken,
    setVnScenarioId,
    vnScenarioId,
  } = navigation;
  const { openVnScenario, onVnLaunchCoverTransitionEnd, vnLaunchCoverPhase } =
    useVnLaunchCurtain(navigation.openVnScenario);
  const {
    entryGateError,
    entryGateState,
    hasKarlsruheGrant,
    isEntryGateBlocking,
  } = useKarlsruheEntryGate({
    activeTab,
    dbName: SPACETIMEDB_DB_NAME,
    entryToken,
    identityHex,
    isKarlsruheProfile,
    pathname,
    profile: RELEASE_PROFILE,
    setActiveTab,
    setEntryToken,
    setVnScenarioId,
    vnScenarioId,
  });

  useShellSessionAutoTabs({
    disabled: isKarlsruheProfile,
    setActiveTab,
  });

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    void import("../shared/devtools/devLogger").then(({ devLogger }) => {
      devLogger.navigation(`tab=${activeTab}`, {
        pathname,
        vnScenarioId,
        entryGateState,
      });
    });
  }, [activeTab, pathname, vnScenarioId, entryGateState]);

  useEffect(() => {
    logShellDebug({
      hypothesisId: "H1,H3",
      location: "AppShell.tsx:gates-tab",
      message: "Shell state snapshot",
      data: {
        releaseProfile: RELEASE_PROFILE,
        showInitialSpacetimeGate,
        dbLinkActive,
        activeTab,
        pathname,
        hasIdentity: Boolean(identity),
        identityHexLen: identityHex?.length ?? 0,
        isKarlsruheProfile,
        entryGateState,
      },
    });
  }, [
    activeTab,
    dbLinkActive,
    entryGateState,
    identity,
    identityHex?.length,
    isKarlsruheProfile,
    pathname,
    showInitialSpacetimeGate,
  ]);

  if (showInitialSpacetimeGate) {
    return (
      <div className="app-shell app-shell-loading">
        <h1>Grenzwanderer</h1>
        <p>{home.connecting}</p>
        {renderDevDebugOverlay()}
      </div>
    );
  }

  return (
    <ShellChrome
      activeTab={activeTab}
      entryGateError={entryGateError}
      entryGateState={entryGateState}
      hasKarlsruheGrant={hasKarlsruheGrant}
      identityHex={identityHex}
      isActive={isActive}
      isEntryGateBlocking={isEntryGateBlocking}
      isKarlsruheProfile={isKarlsruheProfile}
      navigateToTab={navigateToTab}
      onVnLaunchCoverTransitionEnd={onVnLaunchCoverTransitionEnd}
      pathname={pathname}
      vnLaunchCoverPhase={vnLaunchCoverPhase}
    >
      <ShellRouteRenderer
        activeTab={activeTab}
        mapPanel={mapPanel}
        navigateToTab={navigateToTab}
        openVnScenario={openVnScenario}
        setVnScenarioId={setVnScenarioId}
        vnScenarioId={vnScenarioId}
      />
      {renderDevDebugOverlay()}
    </ShellChrome>
  );
};

export default AppShell;
