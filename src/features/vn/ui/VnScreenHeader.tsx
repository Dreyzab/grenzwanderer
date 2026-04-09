import type { VnStrings } from "../../i18n/uiStrings";
import type { VnScenario } from "../types";
import {
  FortuneIcon,
  KarmaIcon,
  ProvidenceIcon,
} from "../../../shared/ui/icons/narrative-resource-icons";

interface VnScreenHeaderProps {
  t: VnStrings;
  selectedScenarioId: string;
  scenarios: VnScenario[];
  isInteractionLocked: boolean;
  narrativeResources: {
    providence: number;
    fortune: number;
    fortuneMod: number;
    karma: number;
  };
  onScenarioChange: (scenarioId: string) => void;
  onStartScenario: () => void;
  onOpenDebug?: () => void;
}

export const VnScreenHeader = ({
  t,
  selectedScenarioId,
  scenarios,
  isInteractionLocked,
  narrativeResources,
  onScenarioChange,
  onStartScenario,
  onOpenDebug,
}: VnScreenHeaderProps) => (
  <header className="vn-screen-toolbar card compact">
    <label className="field">
      {t.scenario}
      <select
        value={selectedScenarioId}
        onChange={(event) => onScenarioChange(event.target.value)}
      >
        {scenarios.map((scenario) => (
          <option key={scenario.id} value={scenario.id}>
            {scenario.title}
          </option>
        ))}
      </select>
    </label>

    <div className="button-row">
      <div className="flex items-center gap-2 rounded-full border border-white/12 bg-black/20 px-3 py-2 text-xs uppercase tracking-[0.16em] text-white/80">
        <span className="flex items-center gap-1.5">
          <ProvidenceIcon size={16} />
          {t.providenceLabel}: {narrativeResources.providence}
        </span>
        <span className="flex items-center gap-1.5">
          <FortuneIcon size={16} />
          {t.fortuneLabel}: {narrativeResources.fortune}
          {narrativeResources.fortuneMod !== 0
            ? ` (${narrativeResources.fortuneMod > 0 ? "+" : ""}${narrativeResources.fortuneMod})`
            : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <KarmaIcon size={16} />
          {t.karmaLabel}: {narrativeResources.karma}
        </span>
      </div>
      <button
        type="button"
        onClick={onStartScenario}
        disabled={!selectedScenarioId || isInteractionLocked}
      >
        {t.startScenario}
      </button>
      {onOpenDebug ? (
        <button type="button" onClick={onOpenDebug}>
          {t.openDebug}
        </button>
      ) : null}
    </div>
  </header>
);
