import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CASE01_SCENARIO_IDS } from "../src/shared/case01Canon";
import { staticMapDataSource } from "../src/features/map/data/mapDataSource";
import { resolveLegacyScenarioId } from "../src/features/map/data/scenario-mapping";

type SnapshotPoint = {
  id: string;
  bindings?: Array<{
    id: string;
    conditions?: unknown[];
    actions?: Array<{ type: string; scenarioId?: string }>;
  }>;
};

type SnapshotPayload = {
  scenarios: Array<{ id: string; defaultBackgroundUrl?: string }>;
  nodes: Array<{ id: string; scenarioId: string; backgroundUrl?: string }>;
  map?: { points: Array<SnapshotPoint & { regionId: string }> };
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const snapshotPath = path.join(
  repoRoot,
  "content",
  "vn",
  "pilot.snapshot.json",
);

const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const readSnapshot = (): SnapshotPayload =>
  JSON.parse(readFileSync(snapshotPath, "utf8")) as SnapshotPayload;

const findPoint = (
  snapshot: SnapshotPayload,
  pointId: string,
): SnapshotPoint => {
  const point = snapshot.map?.points.find((entry) => entry.id === pointId);
  if (!point) {
    throw new Error(`Missing map point '${pointId}' in extracted snapshot`);
  }
  return point;
};

const scenarioBindingsForPoint = (
  point: SnapshotPoint,
): Array<{ bindingId: string; scenarioId: string }> =>
  (point.bindings ?? []).flatMap((binding) =>
    (binding.actions ?? [])
      .filter(
        (action): action is { type: string; scenarioId: string } =>
          action.type === "start_scenario" &&
          typeof action.scenarioId === "string",
      )
      .map((action) => ({
        bindingId: binding.id,
        scenarioId: action.scenarioId,
      })),
  );

const assertPublicAssetExists = (assetUrl: string): void => {
  assert(
    assetUrl.startsWith("/"),
    `Asset URL '${assetUrl}' must be root-relative`,
  );
  assert(
    existsSync(path.join(repoRoot, "public", assetUrl.slice(1))),
    `Missing public asset '${assetUrl}'`,
  );
};

try {
  const snapshot = readSnapshot();
  const scenarioIds = new Set(
    snapshot.scenarios.map((scenario) => scenario.id),
  );
  const scenarioById = new Map(
    snapshot.scenarios.map((scenario) => [scenario.id, scenario]),
  );

  for (const scenarioId of [
    CASE01_SCENARIO_IDS.leadTailor,
    CASE01_SCENARIO_IDS.leadApothecary,
    CASE01_SCENARIO_IDS.leadPub,
    CASE01_SCENARIO_IDS.estateBranch,
    CASE01_SCENARIO_IDS.lotteInterlude,
    CASE01_SCENARIO_IDS.lodgingZumGoldenenAdler,
    CASE01_SCENARIO_IDS.archiveRun,
    CASE01_SCENARIO_IDS.railYardTail,
    CASE01_SCENARIO_IDS.warehouseFinale,
  ]) {
    assert(scenarioIds.has(scenarioId), `Missing scenario '${scenarioId}'`);
  }

  for (const pointId of [
    "loc_tailor",
    "loc_apothecary",
    "loc_pub",
    "loc_freiburg_estate",
    "loc_telephone",
    "loc_pub_deutsche",
    "loc_freiburg_warehouse",
  ]) {
    findPoint(snapshot, pointId);
  }

  const rathausBindings = scenarioBindingsForPoint(
    findPoint(snapshot, "loc_rathaus"),
  );
  const workersPubBindings = scenarioBindingsForPoint(
    findPoint(snapshot, "loc_workers_pub"),
  );
  const telephoneBindings = scenarioBindingsForPoint(
    findPoint(snapshot, "loc_telephone"),
  );
  const zumGoldenenAdlerBindings = scenarioBindingsForPoint(
    findPoint(snapshot, "loc_pub_deutsche"),
  );
  const warehouseBindings = scenarioBindingsForPoint(
    findPoint(snapshot, "loc_freiburg_warehouse"),
  );
  const staticPointIds = staticMapDataSource
    .getPoints("FREIBURG_1905")
    .map((point) => point.id)
    .sort();
  const snapshotPointIds = (snapshot.map?.points ?? [])
    .filter((point) => point.regionId === "FREIBURG_1905")
    .map((point) => point.id)
    .sort();

  assert(
    rathausBindings.some(
      (binding) => binding.scenarioId === CASE01_SCENARIO_IDS.convergence,
    ),
    "loc_rathaus must offer Case01 convergence",
  );
  assert(
    rathausBindings.some(
      (binding) => binding.scenarioId === CASE01_SCENARIO_IDS.archiveRun,
    ),
    "loc_rathaus must offer the official archive route",
  );
  assert(
    workersPubBindings.some(
      (binding) => binding.scenarioId === CASE01_SCENARIO_IDS.railYardTail,
    ),
    "loc_workers_pub must offer the covert rail-yard route",
  );
  assert(
    telephoneBindings.some(
      (binding) => binding.scenarioId === CASE01_SCENARIO_IDS.lotteInterlude,
    ),
    "loc_telephone must offer the Lotte interlude",
  );
  assert(
    zumGoldenenAdlerBindings.some(
      (binding) =>
        binding.scenarioId === CASE01_SCENARIO_IDS.lodgingZumGoldenenAdler,
    ),
    "loc_pub_deutsche must offer the canon Zum Goldenen Adler lodging beat",
  );
  assert(
    warehouseBindings.some(
      (binding) => binding.scenarioId === CASE01_SCENARIO_IDS.warehouseFinale,
    ),
    "loc_freiburg_warehouse must start the Case01 finale",
  );

  for (const scenario of snapshot.scenarios.filter(
    (entry) =>
      entry.id.startsWith("case01_") &&
      entry.id !== CASE01_SCENARIO_IDS.defaultEntry,
  )) {
    assert(
      scenario.defaultBackgroundUrl,
      `Case01 scenario '${scenario.id}' must define a default background`,
    );
    assertPublicAssetExists(scenario.defaultBackgroundUrl ?? "");
  }

  for (const node of snapshot.nodes.filter((entry) =>
    entry.scenarioId.startsWith("case01_"),
  )) {
    const scenario = scenarioById.get(node.scenarioId);
    const effectiveBackgroundUrl =
      node.backgroundUrl ?? scenario?.defaultBackgroundUrl;
    assert(
      effectiveBackgroundUrl,
      `Case01 node '${node.id}' must have an effective background`,
    );
    assertPublicAssetExists(effectiveBackgroundUrl ?? "");
  }

  const warehouseScenario = scenarioById.get(
    CASE01_SCENARIO_IDS.warehouseFinale,
  );
  assert(
    warehouseScenario?.defaultBackgroundUrl !==
      "/images/scenes/scene_estate_intro.png",
    "case01_warehouse_finale must use a warehouse-specific background",
  );
  assert(
    JSON.stringify(staticPointIds) === JSON.stringify(snapshotPointIds),
    "static Freiburg fallback points must be generated from the canonical snapshot map feed",
  );
  assert(
    staticMapDataSource.getPoints("KARLSRUHE_1905").length > 0,
    "KARLSRUHE_1905 fallback points must remain available in the static map source",
  );

  for (const legacyId of [
    "detective_case1_mayor_followup",
    "detective_case1_archive_search",
    "detective_case1_lab_analysis",
    "interlude_lotte_warning",
  ]) {
    const mapped = resolveLegacyScenarioId(legacyId);
    assert(
      mapped && mapped.startsWith("case01_"),
      `Legacy scenario '${legacyId}' must resolve to a dedicated case01_* scenario`,
    );
  }

  console.log("Case01 mainline smoke script passed.");
} catch (error) {
  console.error("Case01 mainline smoke script failed:", error);
  process.exitCode = 1;
}
