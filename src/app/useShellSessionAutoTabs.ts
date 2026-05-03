import { useEffect, useMemo, useRef } from "react";
import { useTable } from "spacetimedb/react";
import type { TabId } from "../shared/navigation/shellNavigationTypes";
import { tables } from "../shared/spacetime/bindings";

interface SessionRow {
  sessionKey: string;
  status: string;
}

interface ShellSessionAutoTabsOptions {
  disabled: boolean;
  setActiveTab: (tab: TabId) => void;
}

export const useShellSessionAutoTabs = ({
  disabled,
  setActiveTab,
}: ShellSessionAutoTabsOptions): void => {
  const [commandSessions] = useTable(tables.myCommandSessions);
  const [battleSessions] = useTable(tables.myBattleSessions);
  const activeCommandSessionKeyRef = useRef<string | null>(null);
  const activeBattleSessionKeyRef = useRef<string | null>(null);

  const activeCommandSession = useMemo(
    () =>
      (commandSessions as readonly SessionRow[]).find(
        (row) => row.status !== "closed",
      ) ?? null,
    [commandSessions],
  );

  const activeBattleSession = useMemo(
    () =>
      (battleSessions as readonly SessionRow[]).find(
        (row) => row.status !== "closed",
      ) ?? null,
    [battleSessions],
  );

  useEffect(() => {
    if (disabled) {
      return;
    }

    if (!activeCommandSession) {
      activeCommandSessionKeyRef.current = null;
      return;
    }

    if (
      activeCommandSessionKeyRef.current === activeCommandSession.sessionKey
    ) {
      return;
    }

    activeCommandSessionKeyRef.current = activeCommandSession.sessionKey;
    setActiveTab("command");
  }, [activeCommandSession, disabled, setActiveTab]);

  useEffect(() => {
    if (disabled) {
      return;
    }

    if (!activeBattleSession) {
      activeBattleSessionKeyRef.current = null;
      return;
    }

    if (activeBattleSessionKeyRef.current === activeBattleSession.sessionKey) {
      return;
    }

    activeBattleSessionKeyRef.current = activeBattleSession.sessionKey;
    setActiveTab("battle");
  }, [activeBattleSession, disabled, setActiveTab]);
};
