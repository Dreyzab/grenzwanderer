import { loadKarlsruheSnapshot } from "./smoke-karlsruhe-helpers";

const snapshot = loadKarlsruheSnapshot();
const arrivalScenario = snapshot.scenarios.find(
  (scenario: { id: string }) => scenario.id === "karlsruhe_event_arrival",
);

if (!arrivalScenario) {
  throw new Error("Karlsruhe arrival scenario is missing");
}

if (arrivalScenario.completionRoute) {
  throw new Error("Karlsruhe arrival should return to map instead of chaining into another scenario");
}

const unlockNode = snapshot.nodes.find(
  (node: { id: string }) => node.id === "scene_karlsruhe_event_arrival_unlock",
);

if (!unlockNode) {
  throw new Error("Karlsruhe arrival unlock node is missing");
}

const onEnter = Array.isArray(unlockNode.onEnter) ? unlockNode.onEnter : [];
const hasArrivalFlag = onEnter.some(
  (effect: { type?: string; key?: string; value?: boolean }) =>
    effect.type === "set_flag" &&
    effect.key === "karlsruhe_arrival_complete" &&
    effect.value === true,
);
const hasNewspaperEvidence = onEnter.some(
  (effect: { type?: string; evidenceId?: string }) =>
    effect.type === "grant_evidence" &&
    effect.evidenceId === "ev_karlsruhe_newspaper",
);

if (!hasArrivalFlag || !hasNewspaperEvidence) {
  throw new Error("Karlsruhe arrival unlock node is missing the required flag/evidence grant");
}

console.log("[smoke:karlsruhe:resume] Arrival completion grants the expected resume state.");
