import type { VnStrings } from "../../i18n/uiStrings";
import type { VnScenario } from "../types";

interface VnScreenHeaderProps {
  t: VnStrings;
  selectedScenarioId: string;
  scenarios: VnScenario[];
  isInteractionLocked: boolean;
  onScenarioChange: (scenarioId: string) => void;
  onStartScenario: () => void;
  onOpenDebug?: () => void;
}

export const VnScreenHeader = ({
  t,
  selectedScenarioId,
  scenarios,
  isInteractionLocked,
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
