import {
  assertSetEquals,
  loadKarlsruheSnapshot,
} from "./smoke-karlsruhe-helpers";

const snapshot = loadKarlsruheSnapshot();
const scenarioIds = new Set<string>(
  snapshot.scenarios.map((scenario: { id: string }) => scenario.id),
);

assertSetEquals(
  scenarioIds,
  [
    "karlsruhe_event_arrival",
    "sandbox_banker_pilot",
    "sandbox_dog_pilot",
    "sandbox_missing_aroma_pilot",
  ],
  "Karlsruhe scenario ids",
);

if (snapshot.vnRuntime?.releaseProfile !== "karlsruhe_event") {
  throw new Error(
    "Karlsruhe snapshot vnRuntime.releaseProfile must be karlsruhe_event",
  );
}

if (snapshot.vnRuntime?.defaultEntryScenarioId !== "karlsruhe_event_arrival") {
  throw new Error(
    "Karlsruhe snapshot default entry must be karlsruhe_event_arrival",
  );
}

if (
  scenarioIds.has("origin_detective_bootstrap") ||
  scenarioIds.has("detective_case01_prologue")
) {
  throw new Error(
    "Karlsruhe snapshot must not expose Freiburg or detective origin flows",
  );
}

console.log("[smoke:karlsruhe:entry] Karlsruhe entry slice looks correct.");
