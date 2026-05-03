import { useEffect, useMemo, type CSSProperties, type ReactNode } from "react";
import {
  APP_BUILD_TIMESTAMP,
  APP_COMMIT_SHA,
  APP_VERSION,
  RELEASE_PROFILE,
} from "../config";
import type { EntryGateState } from "../features/release/types";
import { KarlsruheQrGate } from "../features/release/ui/KarlsruheQrGate";
import { useI18n } from "../features/i18n/I18nContext";
import { getHomeStrings, getNavbarStrings } from "../features/i18n/uiStrings";
import { useFactDiscoveryToast } from "../features/mindpalace/useFactDiscoveryToast";
import { useHypothesisRewardToast } from "../features/mindpalace/useHypothesisRewardToast";
import { useMindPalaceReadiness } from "../features/mindpalace/useMindPalaceReadiness";
import { ToastProvider } from "../shared/hooks/useToast";
import { usePresenceHeartbeat } from "../shared/spacetime/usePresenceHeartbeat";
import { Toaster } from "../shared/ui/Toaster";
import type {
  MapPanelId,
  TabId,
  VnLaunchCoverPhase,
} from "../shared/navigation/shellNavigationTypes";
import { GlobalLanguageBar } from "../widgets/language/GlobalLanguageBar";
import { Navbar } from "../widgets/navbar/Navbar";
import { logShellDebug } from "./shellDebugLog";
import { getLocalizedTabsForProfile } from "./shellTabs";
import { VN_LAUNCH_CURTAIN_FADE_MS } from "./useVnLaunchCurtain";

const identityLabel = (identityHex: string): string => {
  if (!identityHex) {
    return "unknown";
  }
  return `${identityHex.slice(0, 8)}...${identityHex.slice(-4)}`;
};

interface ShellChromeProps {
  activeTab: TabId;
  children: ReactNode;
  entryGateError: string | null;
  entryGateState: EntryGateState;
  hasKarlsruheGrant: boolean;
  identityHex: string;
  isActive: boolean;
  isEntryGateBlocking: boolean;
  isKarlsruheProfile: boolean;
  navigateToTab: (tab: TabId, options?: { mapPanel?: MapPanelId }) => void;
  onVnLaunchCoverTransitionEnd: () => void;
  pathname: string;
  vnLaunchCoverPhase: VnLaunchCoverPhase;
}

export const ShellChrome = ({
  activeTab,
  children,
  entryGateError,
  entryGateState,
  hasKarlsruheGrant,
  identityHex,
  isActive,
  isEntryGateBlocking,
  isKarlsruheProfile,
  navigateToTab,
  onVnLaunchCoverTransitionEnd,
  pathname,
  vnLaunchCoverPhase,
}: ShellChromeProps) => {
  const { language } = useI18n();
  const home = getHomeStrings(language);

  useEffect(() => {
    const gateBranch = isEntryGateBlocking ? "karlsruhe_qr_gate" : "full_shell";
    logShellDebug({
      hypothesisId: "H2",
      location: "AppShell.tsx:InnerWrapper",
      message: "Inner wrapper route branch",
      data: {
        gateBranch,
        pathname,
        entryGateState,
        activeTab,
      },
    });
  }, [activeTab, entryGateState, isEntryGateBlocking, pathname]);

  const statusText = useMemo(() => {
    if (!isActive) {
      return home.disconnected;
    }
    return `${home.connectedAs} ${identityLabel(identityHex)}`;
  }, [identityHex, isActive, home]);

  const nav = getNavbarStrings(language);
  const localizedTabs = useMemo(
    () => getLocalizedTabsForProfile(RELEASE_PROFILE, nav),
    [nav],
  );

  if (isEntryGateBlocking) {
    return (
      <>
        <GlobalLanguageBar />
        <KarlsruheQrGate
          state={entryGateState}
          errorMessage={entryGateError}
          hasGrant={hasKarlsruheGrant}
        />
      </>
    );
  }

  return (
    <ToastProvider>
      <Toaster />
      <ShellFrame
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        statusText={statusText}
        tabs={localizedTabs}
        subtitle={isKarlsruheProfile ? home.karlsruheRelease : home.phase2Slice}
        vnLaunchCoverPhase={vnLaunchCoverPhase}
        onVnLaunchCoverTransitionEnd={onVnLaunchCoverTransitionEnd}
      >
        {children}
      </ShellFrame>
    </ToastProvider>
  );
};

interface ShellFrameProps {
  activeTab: TabId;
  children: ReactNode;
  setActiveTab: (tab: TabId, options?: { mapPanel?: MapPanelId }) => void;
  statusText: string;
  tabs: Array<{ id: TabId; label: string }>;
  subtitle: string;
  vnLaunchCoverPhase: VnLaunchCoverPhase;
  onVnLaunchCoverTransitionEnd: () => void;
}

const ShellFrame = ({
  activeTab,
  children,
  setActiveTab,
  statusText,
  tabs,
  subtitle,
  vnLaunchCoverPhase,
  onVnLaunchCoverTransitionEnd,
}: ShellFrameProps) => {
  useFactDiscoveryToast();
  useHypothesisRewardToast();
  usePresenceHeartbeat(activeTab);
  const { hasReadyHypotheses } = useMindPalaceReadiness();
  const isHomeTab = activeTab === "home";
  const isMapTab = activeTab === "map";
  const hideLanguageBarInVn = activeTab === "vn";

  const badges = useMemo(() => {
    const nextBadges: Partial<Record<TabId, boolean>> = {};
    if (tabs.some((tab) => tab.id === "mind_palace")) {
      nextBadges.mind_palace = hasReadyHypotheses;
    }
    return nextBadges;
  }, [hasReadyHypotheses, tabs]);

  return (
    <div
      className={
        isHomeTab
          ? "min-h-dvh w-full"
          : isMapTab
            ? "app-shell app-shell--map"
            : "app-shell"
      }
    >
      {!hideLanguageBarInVn ? <GlobalLanguageBar /> : null}
      {!isHomeTab && !isMapTab && (
        <header className="app-header">
          <div>
            <h1>Grenzwanderer</h1>
            <p className="subtitle">{subtitle}</p>
          </div>
          <div className="meta-block">
            <span>{statusText}</span>
            <span
              title={`Commit ${APP_COMMIT_SHA} - Built ${APP_BUILD_TIMESTAMP}`}
            >
              Version: {APP_VERSION}
            </span>
          </div>
        </header>
      )}

      <main
        className={
          isHomeTab
            ? "w-full h-full"
            : isMapTab
              ? "app-main app-main--map"
              : "app-main"
        }
      >
        {children}
      </main>

      <Navbar
        activeTab={activeTab}
        tabs={tabs}
        onTabChange={setActiveTab}
        badges={badges}
      />

      {vnLaunchCoverPhase !== "off" ? (
        <div
          role="presentation"
          aria-hidden
          className={[
            "pointer-events-none fixed inset-0 z-210 bg-black",
            vnLaunchCoverPhase === "out"
              ? "opacity-0 transition-opacity"
              : "opacity-100",
          ].join(" ")}
          style={
            vnLaunchCoverPhase === "out"
              ? ({
                  transitionDuration: `${VN_LAUNCH_CURTAIN_FADE_MS}ms`,
                  transitionTimingFunction: "ease-out",
                } satisfies CSSProperties)
              : undefined
          }
          onTransitionEnd={(event) => {
            if (
              event.propertyName === "opacity" &&
              vnLaunchCoverPhase === "out"
            ) {
              onVnLaunchCoverTransitionEnd();
            }
          }}
        />
      ) : null}
    </div>
  );
};
