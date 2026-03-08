import { AiThoughtsPanel } from "../features/ai/ui/AiThoughtsPanel";
import { useReducer } from "spacetimedb/react";
import { reducers } from "../shared/spacetime/bindings";
import { useToast } from "../shared/hooks/useToast";

const createRequestId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
};

export const DevPage = () => {
  const toast = useToast();
  const discoverFact = useReducer(reducers.discoverFact);
  const startMindCase = useReducer(reducers.startMindCase);
  const openBattleMode = useReducer(reducers.openBattleMode);

  const handleGrantDemoFact = async () => {
    try {
      await discoverFact({
        requestId: createRequestId(),
        caseId: "case_loop_demo",
        factId: "fact_loop_clue",
      });
      toast.showToast({
        message: "Granted fact_loop_clue",
        type: "info",
        source: "dev_cheat",
        dedupeKey: "dev_cheat:grant_fact_loop_clue",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "unknown reducer failure";
      toast.showToast({
        message: `Dev cheat failed: ${errorMessage}`,
        type: "info",
        source: "dev_cheat",
      });
    }
  };

  const handleStartDemoCase = async () => {
    try {
      await startMindCase({
        requestId: createRequestId(),
        caseId: "case_loop_demo",
      });
      toast.showToast({
        message: "Started case_loop_demo",
        type: "info",
        source: "dev_cheat",
        dedupeKey: "dev_cheat:start_case_loop_demo",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "unknown reducer failure";
      toast.showToast({
        message: `Dev cheat failed: ${errorMessage}`,
        type: "info",
        source: "dev_cheat",
      });
    }
  };

  const handleOpenBattleDebug = async () => {
    try {
      await openBattleMode({
        requestId: createRequestId(),
        scenarioId: "sandbox_son_duel",
        returnTab: undefined,
        sourceTab: "dev",
      });
      toast.showToast({
        message: "Opened sandbox_son_duel",
        type: "info",
        source: "dev_cheat",
        dedupeKey: "dev_cheat:open_sandbox_son_duel",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "unknown reducer failure";
      toast.showToast({
        message: `Dev cheat failed: ${errorMessage}`,
        type: "info",
        source: "dev_cheat",
      });
    }
  };

  return (
    <section className="panel-section h-full overflow-y-auto w-full p-4 space-y-4">
      <div className="bg-slate-900 border border-amber-900/50 rounded-lg p-4">
        <h2 className="text-amber-500 text-lg font-serif mb-4">Development Cheats</h2>
        <div className="flex gap-4 flex-wrap">
          <button
            type="button"
            className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 rounded text-amber-100 transition-colors"
            onClick={handleGrantDemoFact}
          >
            Grant Demo Fact
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 rounded text-amber-100 transition-colors"
            onClick={handleStartDemoCase}
          >
            Start Demo Case
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 rounded text-amber-100 transition-colors"
            onClick={handleOpenBattleDebug}
          >
            Open Son Duel
          </button>
        </div>
      </div>

      <AiThoughtsPanel />
    </section>
  );
};
