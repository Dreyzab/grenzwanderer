import { assertSetEquals, loadKarlsruheSnapshot } from "./smoke-karlsruhe-helpers";

const snapshot = loadKarlsruheSnapshot();
const pointIds = new Set<string>(
  snapshot.map.points.map((point: { id: string }) => point.id),
);

assertSetEquals(
  pointIds,
  ["loc_ka_bank", "loc_ka_rathaus", "loc_ka_bakery"],
  "Karlsruhe map point ids",
);

if (snapshot.map.defaultRegionId !== "KARLSRUHE_1905") {
  throw new Error("Karlsruhe map must default to KARLSRUHE_1905");
}

for (const quest of snapshot.questCatalog ?? []) {
  for (const stage of quest.stages ?? []) {
    for (const pointId of stage.objectivePointIds ?? []) {
      if (!pointIds.has(pointId)) {
        throw new Error(
          `Karlsruhe quest ${quest.id} stage ${stage.stage} references non-Karlsruhe point ${pointId}`,
        );
      }
    }
  }
}

console.log("[smoke:karlsruhe:map] Karlsruhe map slice exposes exactly three case entry points.");
