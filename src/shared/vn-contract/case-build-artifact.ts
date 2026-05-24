import type {
  CaseIr,
  CaseIrEffect,
  MapAction,
  MapCondition,
  MapPointCategory,
  MapSnapshot,
  QuestArchetype,
  TriggerRule,
  VnEffect,
  VnSnapshot,
} from "./types";

export const CASE_BUILD_ARTIFACT_SCHEMA_VERSION = 1;

export type CaseBuildQaSeverity = "info" | "warning" | "error";

export interface CaseBuildQaFinding {
  severity: CaseBuildQaSeverity;
  code: string;
  path: string;
  message: string;
}

export type CaseBuildCoverageStatus = "COVERED" | "BRIDGED" | "MISSING";

export interface CaseBuildLedgerEntry {
  scenarioId: string;
  scenarioTitle: string;
  nodeId: string;
  nodeTitle: string;
  status: CaseBuildCoverageStatus;
  ownerLayer: string;
  identityFindings: string[];
  sourcePaths: string[];
  note: string;
}

export interface CaseBuildVisualManifestEntry {
  locationId: string;
  districtId?: string;
  visualArchetype?: string;
  assetKind?: string;
  masterRefId?: string;
  defaultVariantId?: string;
  stateVariantIds?: string[];
}

export interface CaseBuildVisualVariantEntry {
  locationId: string;
  variantId: string;
  expectedImagePath?: string;
  expectedMetaPath?: string;
  runtimeImagePath?: string;
}

export interface CaseBuildVisualMissingAssetEntry {
  locationId: string;
  variantId: string;
  expectedImagePath: string;
  expectedMetaPath: string;
  issues: string[];
}

export interface CaseBuildInput {
  caseId: string;
  snapshot: VnSnapshot;
  snapshotChecksum: string;
  snapshotPath: string;
  caseIr: CaseIr;
  caseLedger: readonly CaseBuildLedgerEntry[];
  mapSnapshot: MapSnapshot | undefined;
  visualManifest: readonly CaseBuildVisualManifestEntry[];
  visualVariants: readonly CaseBuildVisualVariantEntry[];
  visualMissingAssets: readonly CaseBuildVisualMissingAssetEntry[];
  triggerRules: readonly TriggerRule[];
  questArchetypes: readonly QuestArchetype[];
  supportedAiKinds: readonly string[];
  directorAllowedBeatIds: readonly string[];
}

export interface CaseBuildArtifact {
  schemaVersion: typeof CASE_BUILD_ARTIFACT_SCHEMA_VERSION;
  artifactKind: "case_build";
  caseId: string;
  source: {
    snapshotPath: string;
    snapshotChecksum: string;
    snapshotSchemaVersion: number;
    caseIrSource: CaseIr["metadata"]["source"];
  };
  caseLedger: {
    summary: {
      totalNodes: number;
      coveredNodes: number;
      bridgedNodes: number;
      missingNodes: number;
      identityDriftNodes: number;
    };
    nodes: CaseBuildLedgerEntry[];
  };
  sceneGraph: {
    scenarios: Array<{
      id: string;
      title: string;
      packId?: string;
      startNodeId: string;
      nodeIds: string[];
    }>;
    nodes: Array<{
      id: string;
      scenarioId: string;
      title: string;
      terminal: boolean;
      choiceCount: number;
      onEnterEffectCount: number;
      passiveCheckCount: number;
    }>;
    edges: Array<{
      fromNodeId: string;
      toId: string;
      toKind: "node" | "scenario";
      scenarioId: string;
      via: "choice" | "skill_check" | "completion_route";
      viaId?: string;
    }>;
  };
  poiGraph: {
    locations: Array<{
      locationId: string;
      pointIds: string[];
      categories: MapPointCategory[];
      scenarioIds: string[];
      visualStateIds: string[];
    }>;
    points: Array<{
      id: string;
      title: string;
      locationId: string;
      regionId: string;
      category: MapPointCategory;
      bindingIds: string[];
      scenarioIds: string[];
      unlockGroup?: string;
      defaultState?: string;
      isHiddenInitially?: boolean;
    }>;
    qrGates: Array<{
      codeId: string;
      unlockGroupIds: string[];
      pointIds: string[];
      conditionTypes: string[];
    }>;
    geofenceConditions: Array<{
      ownerPath: string;
      lat: number;
      lng: number;
      radiusMeters: number;
    }>;
  };
  clueLifecycleGraph: {
    facts: Array<{
      caseId: string;
      factId: string;
      sourceType: string;
      sourceId: string;
      ownerPath?: string;
    }>;
    evidence: Array<{
      evidenceId: string;
      sourceType: string;
      sourceId: string;
      ownerPath?: string;
    }>;
    clueFlags: Array<{
      flagKey: string;
      value: boolean;
      sourceType: string;
      sourceId: string;
      ownerPath?: string;
    }>;
    hypotheses: Array<{
      caseId: string;
      hypothesisId: string;
      requiredFactIds: string[];
    }>;
    rumors: Array<{
      rumorId: string;
      caseId: string;
      leadPointId?: string;
      verifiesOn: string[];
    }>;
  };
  questArchetypePack: {
    triggerRules: TriggerRule[];
    questArchetypes: QuestArchetype[];
  };
  visualManifest: {
    locations: CaseBuildVisualManifestEntry[];
    variants: CaseBuildVisualVariantEntry[];
    missingAssets: CaseBuildVisualMissingAssetEntry[];
    visualStateHints: Array<{
      locationId: string;
      defaultStateId: string;
      stateIds: string[];
      missingVariantIds: string[];
    }>;
  };
  aiCapabilityManifest: {
    supportedKinds: string[];
    director: {
      kind: "propose_director_step";
      source: "vn_node_entry";
      presentationOnly: true;
      stateMutationAllowed: false;
      stepTypes: string[];
      outputFields: string[];
      allowedBeatIds: string[];
    };
    tabletopDm: {
      kind: "propose_dm_turn";
      source: "dm_side_panel";
      presentationOnly: false;
      stateMutationAllowed: false;
      requiresReviewAccept: true;
      sessionCanonOnly: true;
      outputFields: string[];
      allowedStateDeltaPrefixes: string[];
    };
  };
  qaFindings: CaseBuildQaFinding[];
}

type EffectLike = VnEffect | MapAction;

const uniqueSorted = (values: Iterable<string>): string[] =>
  [...new Set(values)].sort((left, right) => left.localeCompare(right));

const uniqueCategories = (
  values: Iterable<MapPointCategory>,
): MapPointCategory[] =>
  [...new Set(values)].sort((left, right) => left.localeCompare(right));

const isClueFlagKey = (key: string): boolean =>
  key.startsWith("clue_") ||
  key.startsWith("found_") ||
  key.includes("_clue_") ||
  key.endsWith("_clue");

const collectConditionTypes = (conditions: readonly MapCondition[]): string[] =>
  uniqueSorted(
    conditions.flatMap((condition): string[] => {
      if (condition.type === "logic_and" || condition.type === "logic_or") {
        return [condition.type, ...collectConditionTypes(condition.conditions)];
      }
      if (condition.type === "logic_not") {
        return [
          condition.type,
          ...collectConditionTypes([condition.condition]),
        ];
      }
      return [condition.type];
    }),
  );

const collectGeofenceConditions = (
  conditions: readonly MapCondition[],
  ownerPath: string,
): CaseBuildArtifact["poiGraph"]["geofenceConditions"] =>
  conditions.flatMap((condition, index) => {
    const path = `${ownerPath}.conditions.${index}`;
    if (condition.type === "geofence_within") {
      return [
        {
          ownerPath: path,
          lat: condition.lat,
          lng: condition.lng,
          radiusMeters: condition.radiusMeters,
        },
      ];
    }
    if (condition.type === "logic_and" || condition.type === "logic_or") {
      return collectGeofenceConditions(condition.conditions, path);
    }
    if (condition.type === "logic_not") {
      return collectGeofenceConditions([condition.condition], path);
    }
    return [];
  });

const collectScenarioIdsFromActions = (
  actions: readonly MapAction[],
): string[] =>
  uniqueSorted(
    actions.flatMap((action) => {
      if (
        action.type === "start_scenario" ||
        action.type === "open_command_mode" ||
        action.type === "open_battle_mode"
      ) {
        return [action.scenarioId];
      }
      return [];
    }),
  );

const collectEdgesFromConditionTarget = (
  check: { nextNodeId?: string } | undefined,
  fromNodeId: string,
  scenarioId: string,
  viaId: string | undefined,
): CaseBuildArtifact["sceneGraph"]["edges"] =>
  check?.nextNodeId
    ? [
        {
          fromNodeId,
          toId: check.nextNodeId,
          toKind: "node",
          scenarioId,
          via: "skill_check",
          viaId,
        },
      ]
    : [];

const buildSceneGraph = (
  caseIr: CaseIr,
  caseId: string,
): CaseBuildArtifact["sceneGraph"] => {
  const caseScenarioIds = new Set(
    caseIr.scenarios
      .filter((scenario) => scenario.packId === caseId)
      .map((scenario) => scenario.id),
  );
  const caseNodeIds = new Set(
    caseIr.nodes
      .filter((node) => caseScenarioIds.has(node.scenarioId))
      .map((node) => node.id),
  );
  const nodes = caseIr.nodes
    .filter((node) => caseScenarioIds.has(node.scenarioId))
    .map((node) => ({
      id: node.id,
      scenarioId: node.scenarioId,
      title: node.title,
      terminal: node.terminal === true,
      choiceCount: node.choices.length,
      onEnterEffectCount: node.onEnter?.length ?? 0,
      passiveCheckCount: node.passiveChecks?.length ?? 0,
    }));

  const choiceEdges = caseIr.choices
    .filter(
      (choice) =>
        caseScenarioIds.has(choice.scenarioId) &&
        caseNodeIds.has(choice.nextNodeId),
    )
    .map((choice) => ({
      fromNodeId: choice.nodeId,
      toId: choice.nextNodeId,
      toKind: "node" as const,
      scenarioId: choice.scenarioId,
      via: "choice" as const,
      viaId: choice.id,
    }));

  const skillEdges = caseIr.choices
    .filter((choice) => caseScenarioIds.has(choice.scenarioId))
    .flatMap((choice) =>
      [
        ...collectEdgesFromConditionTarget(
          choice.skillCheck?.onSuccess,
          choice.nodeId,
          choice.scenarioId,
          choice.skillCheck?.id,
        ),
        ...collectEdgesFromConditionTarget(
          choice.skillCheck?.onFail,
          choice.nodeId,
          choice.scenarioId,
          choice.skillCheck?.id,
        ),
        ...collectEdgesFromConditionTarget(
          choice.skillCheck?.onCritical,
          choice.nodeId,
          choice.scenarioId,
          choice.skillCheck?.id,
        ),
        ...collectEdgesFromConditionTarget(
          choice.skillCheck?.onSuccessWithCost,
          choice.nodeId,
          choice.scenarioId,
          choice.skillCheck?.id,
        ),
      ].filter((edge) => caseNodeIds.has(edge.toId)),
    );

  const completionEdges = caseIr.scenarios
    .filter((scenario) => caseScenarioIds.has(scenario.id))
    .flatMap((scenario) =>
      [scenario.completionRoute, ...(scenario.completionRoutes ?? [])]
        .filter(
          (route): route is NonNullable<typeof scenario.completionRoute> =>
            Boolean(route?.nextScenarioId),
        )
        .map((route) => ({
          fromNodeId: scenario.startNodeId,
          toId: route.nextScenarioId,
          toKind: "scenario" as const,
          scenarioId: scenario.id,
          via: "completion_route" as const,
        })),
    );

  return {
    scenarios: caseIr.scenarios
      .filter((scenario) => caseScenarioIds.has(scenario.id))
      .map((scenario) => ({
        id: scenario.id,
        title: scenario.title,
        packId: scenario.packId,
        startNodeId: scenario.startNodeId,
        nodeIds: [...scenario.nodeIds],
      })),
    nodes,
    edges: [...choiceEdges, ...skillEdges, ...completionEdges],
  };
};

const buildPoiGraph = (
  mapSnapshot: MapSnapshot | undefined,
  visualManifest: readonly CaseBuildVisualManifestEntry[],
): CaseBuildArtifact["poiGraph"] => {
  if (!mapSnapshot) {
    return { locations: [], points: [], qrGates: [], geofenceConditions: [] };
  }

  const visualStatesByLocationId = new Map(
    visualManifest.map((entry) => [
      entry.locationId,
      uniqueSorted(["default", ...(entry.stateVariantIds ?? [])]),
    ]),
  );
  const points = mapSnapshot.points.map((point) => {
    const scenarioIds = uniqueSorted(
      point.bindings.flatMap((binding) =>
        collectScenarioIdsFromActions(binding.actions),
      ),
    );
    return {
      id: point.id,
      title: point.title,
      locationId: point.locationId,
      regionId: point.regionId,
      category: point.category,
      bindingIds: point.bindings.map((binding) => binding.id),
      scenarioIds,
      unlockGroup: point.unlockGroup,
      defaultState: point.defaultState,
      isHiddenInitially: point.isHiddenInitially,
    };
  });
  const pointIdsByUnlockGroup = new Map<string, string[]>();
  for (const point of points) {
    if (!point.unlockGroup) {
      continue;
    }
    const existing = pointIdsByUnlockGroup.get(point.unlockGroup) ?? [];
    existing.push(point.id);
    pointIdsByUnlockGroup.set(point.unlockGroup, existing);
  }

  const locationsById = new Map<
    string,
    {
      pointIds: string[];
      categories: MapPointCategory[];
      scenarioIds: string[];
    }
  >();
  for (const point of points) {
    const existing = locationsById.get(point.locationId) ?? {
      pointIds: [],
      categories: [],
      scenarioIds: [],
    };
    existing.pointIds.push(point.id);
    existing.categories.push(point.category);
    existing.scenarioIds.push(...point.scenarioIds);
    locationsById.set(point.locationId, existing);
  }

  const geofenceConditions = [
    ...mapSnapshot.points.flatMap((point, pointIndex) =>
      point.bindings.flatMap((binding, bindingIndex) =>
        collectGeofenceConditions(
          binding.conditions ?? [],
          `map.points.${pointIndex}.bindings.${bindingIndex}`,
        ),
      ),
    ),
    ...(mapSnapshot.qrCodeRegistry ?? []).flatMap((entry, entryIndex) =>
      collectGeofenceConditions(
        entry.conditions ?? [],
        `map.qrCodeRegistry.${entryIndex}`,
      ),
    ),
  ];

  return {
    locations: [...locationsById.entries()]
      .map(([locationId, entry]) => ({
        locationId,
        pointIds: uniqueSorted(entry.pointIds),
        categories: uniqueCategories(entry.categories),
        scenarioIds: uniqueSorted(entry.scenarioIds),
        visualStateIds: visualStatesByLocationId.get(locationId) ?? [],
      }))
      .sort((left, right) => left.locationId.localeCompare(right.locationId)),
    points: points.sort((left, right) => left.id.localeCompare(right.id)),
    qrGates: (mapSnapshot.qrCodeRegistry ?? []).map((entry) => ({
      codeId: entry.codeId,
      unlockGroupIds: uniqueSorted(
        entry.effects.flatMap((effect) =>
          effect.type === "unlock_group" ? [effect.groupId] : [],
        ),
      ),
      pointIds: uniqueSorted(
        entry.effects.flatMap((effect) =>
          effect.type === "unlock_group"
            ? (pointIdsByUnlockGroup.get(effect.groupId) ?? [])
            : [],
        ),
      ),
      conditionTypes: collectConditionTypes(entry.conditions ?? []),
    })),
    geofenceConditions,
  };
};

const collectEffectLifecycleEntries = (
  effects: readonly CaseIrEffect[],
): Pick<
  CaseBuildArtifact["clueLifecycleGraph"],
  "facts" | "evidence" | "clueFlags"
> => {
  const facts: CaseBuildArtifact["clueLifecycleGraph"]["facts"] = [];
  const evidence: CaseBuildArtifact["clueLifecycleGraph"]["evidence"] = [];
  const clueFlags: CaseBuildArtifact["clueLifecycleGraph"]["clueFlags"] = [];

  for (const entry of effects) {
    const effect = entry.effect;
    const sourceId = [entry.scenarioId, entry.nodeId, entry.choiceId]
      .filter((value): value is string => Boolean(value))
      .join("::");
    if (effect.type === "discover_fact") {
      facts.push({
        caseId: effect.caseId,
        factId: effect.factId,
        sourceType: "vn_effect",
        sourceId,
        ownerPath: entry.ownerPath,
      });
    } else if (effect.type === "grant_evidence") {
      evidence.push({
        evidenceId: effect.evidenceId,
        sourceType: "vn_effect",
        sourceId,
        ownerPath: entry.ownerPath,
      });
    } else if (effect.type === "set_flag" && isClueFlagKey(effect.key)) {
      clueFlags.push({
        flagKey: effect.key,
        value: effect.value,
        sourceType: "vn_effect",
        sourceId,
        ownerPath: entry.ownerPath,
      });
    }
  }

  return { facts, evidence, clueFlags };
};

const collectMapLifecycleEntries = (
  mapSnapshot: MapSnapshot | undefined,
): Pick<
  CaseBuildArtifact["clueLifecycleGraph"],
  "facts" | "evidence" | "clueFlags"
> => {
  const facts: CaseBuildArtifact["clueLifecycleGraph"]["facts"] = [];
  const evidence: CaseBuildArtifact["clueLifecycleGraph"]["evidence"] = [];
  const clueFlags: CaseBuildArtifact["clueLifecycleGraph"]["clueFlags"] = [];

  for (const point of mapSnapshot?.points ?? []) {
    for (const binding of point.bindings) {
      for (const action of binding.actions as readonly EffectLike[]) {
        const sourceId = `${point.locationId}::${binding.id}`;
        if (action.type === "discover_fact") {
          facts.push({
            caseId: action.caseId,
            factId: action.factId,
            sourceType: "map_action",
            sourceId,
          });
        } else if (action.type === "grant_evidence") {
          evidence.push({
            evidenceId: action.evidenceId,
            sourceType: "map_action",
            sourceId,
          });
        } else if (action.type === "set_flag" && isClueFlagKey(action.key)) {
          clueFlags.push({
            flagKey: action.key,
            value: action.value,
            sourceType: "map_action",
            sourceId,
          });
        }
      }
    }
  }
  for (const [entryIndex, entry] of (
    mapSnapshot?.qrCodeRegistry ?? []
  ).entries()) {
    for (const [effectIndex, action] of entry.effects.entries()) {
      const sourceId = `${entry.codeId}::effects.${effectIndex}`;
      const ownerPath = `map.qrCodeRegistry.${entryIndex}.effects.${effectIndex}`;
      if (action.type === "discover_fact") {
        facts.push({
          caseId: action.caseId,
          factId: action.factId,
          sourceType: "qr_effect",
          sourceId,
          ownerPath,
        });
      } else if (action.type === "grant_evidence") {
        evidence.push({
          evidenceId: action.evidenceId,
          sourceType: "qr_effect",
          sourceId,
          ownerPath,
        });
      } else if (action.type === "set_flag" && isClueFlagKey(action.key)) {
        clueFlags.push({
          flagKey: action.key,
          value: action.value,
          sourceType: "qr_effect",
          sourceId,
          ownerPath,
        });
      }
    }
  }

  return { facts, evidence, clueFlags };
};

const buildClueLifecycleGraph = (
  snapshot: VnSnapshot,
  caseIr: CaseIr,
  mapSnapshot: MapSnapshot | undefined,
  caseId: string,
): CaseBuildArtifact["clueLifecycleGraph"] => {
  const caseScenarioIds = new Set(
    caseIr.scenarios
      .filter((scenario) => scenario.packId === caseId)
      .map((scenario) => scenario.id),
  );
  const vnEntries = collectEffectLifecycleEntries(
    caseIr.effects.filter((entry) => caseScenarioIds.has(entry.scenarioId)),
  );
  const mapEntries = collectMapLifecycleEntries(mapSnapshot);
  const factCaseIds = new Set(
    [...vnEntries.facts, ...mapEntries.facts].map((entry) => entry.caseId),
  );
  const mapPointIds = new Set(
    (mapSnapshot?.points ?? []).map((point) => point.id),
  );
  return {
    facts: [...vnEntries.facts, ...mapEntries.facts].sort((left, right) =>
      `${left.caseId}:${left.factId}:${left.sourceId}`.localeCompare(
        `${right.caseId}:${right.factId}:${right.sourceId}`,
      ),
    ),
    evidence: [...vnEntries.evidence, ...mapEntries.evidence].sort(
      (left, right) =>
        `${left.evidenceId}:${left.sourceId}`.localeCompare(
          `${right.evidenceId}:${right.sourceId}`,
        ),
    ),
    clueFlags: [...vnEntries.clueFlags, ...mapEntries.clueFlags].sort(
      (left, right) =>
        `${left.flagKey}:${left.sourceId}`.localeCompare(
          `${right.flagKey}:${right.sourceId}`,
        ),
    ),
    hypotheses: (snapshot.mindPalace?.hypotheses ?? [])
      .filter(
        (hypothesis) =>
          factCaseIds.size === 0 || factCaseIds.has(hypothesis.caseId),
      )
      .map((hypothesis) => ({
        caseId: hypothesis.caseId,
        hypothesisId: hypothesis.id,
        requiredFactIds: [...hypothesis.requiredFactIds],
      }))
      .sort((left, right) =>
        `${left.caseId}:${left.hypothesisId}`.localeCompare(
          `${right.caseId}:${right.hypothesisId}`,
        ),
      ),
    rumors: (snapshot.socialCatalog?.rumors ?? [])
      .filter(
        (rumor) => !rumor.leadPointId || mapPointIds.has(rumor.leadPointId),
      )
      .map((rumor) => ({
        rumorId: rumor.id,
        caseId: rumor.caseId,
        leadPointId: rumor.leadPointId,
        verifiesOn: [...rumor.verifiesOn].sort(),
      }))
      .sort((left, right) => left.rumorId.localeCompare(right.rumorId)),
  };
};

const buildVisualStateHints = (
  locations: readonly CaseBuildVisualManifestEntry[],
  missingAssets: readonly CaseBuildVisualMissingAssetEntry[],
): CaseBuildArtifact["visualManifest"]["visualStateHints"] => {
  const missingByLocationId = new Map<string, string[]>();
  for (const missingAsset of missingAssets) {
    const existing = missingByLocationId.get(missingAsset.locationId) ?? [];
    existing.push(missingAsset.variantId);
    missingByLocationId.set(missingAsset.locationId, existing);
  }

  return [...locations]
    .map((entry) => {
      const defaultStateId = entry.defaultVariantId ?? "default";
      return {
        locationId: entry.locationId,
        defaultStateId,
        stateIds: uniqueSorted([
          defaultStateId,
          ...(entry.stateVariantIds ?? []),
        ]),
        missingVariantIds: uniqueSorted(
          missingByLocationId.get(entry.locationId) ?? [],
        ),
      };
    })
    .sort((left, right) => left.locationId.localeCompare(right.locationId));
};

const buildQaFindings = (
  input: CaseBuildInput,
  poiGraph: CaseBuildArtifact["poiGraph"],
): CaseBuildQaFinding[] => {
  const findings: CaseBuildQaFinding[] = [];
  const visualLocationIds = new Set(
    input.visualManifest.map((entry) => entry.locationId),
  );

  for (const row of input.caseLedger) {
    if (row.status === "BRIDGED") {
      findings.push({
        severity: "warning",
        code: "case01_temporary_runtime_bridge",
        path: `caseLedger.${row.scenarioId}.${row.nodeId}`,
        message: `Case01 node '${row.nodeId}' is still owned by temporary_runtime_bridge.`,
      });
    } else if (row.status === "MISSING") {
      findings.push({
        severity: "error",
        code: "case01_missing_authoring_ownership",
        path: `caseLedger.${row.scenarioId}.${row.nodeId}`,
        message: `Case01 node '${row.nodeId}' has no StoryDetective ownership or explicit bridge.`,
      });
    }

    if (row.identityFindings.length > 0) {
      findings.push({
        severity: "warning",
        code: "case01_identity_drift",
        path: `caseLedger.${row.scenarioId}.${row.nodeId}`,
        message: `Case01 node '${row.nodeId}' has identity drift findings: ${row.identityFindings.join(", ")}.`,
      });
    }
  }

  for (const location of poiGraph.locations) {
    if (!visualLocationIds.has(location.locationId)) {
      findings.push({
        severity: "warning",
        code: "visual_manifest_missing_location",
        path: `poiGraph.locations.${location.locationId}`,
        message: `Location '${location.locationId}' has map coverage but no visual manifest entry.`,
      });
    }
  }

  for (const missingAsset of input.visualMissingAssets) {
    findings.push({
      severity: "warning",
      code: "visual_manifest_missing_asset",
      path: `visualManifest.${missingAsset.locationId}.${missingAsset.variantId}`,
      message: `Visual variant '${missingAsset.locationId}:${missingAsset.variantId}' is missing assets: ${missingAsset.issues.join(", ")}.`,
    });
  }

  return findings.sort((left, right) =>
    `${left.severity}:${left.code}:${left.path}`.localeCompare(
      `${right.severity}:${right.code}:${right.path}`,
    ),
  );
};

export const buildCaseBuildArtifact = (
  input: CaseBuildInput,
): CaseBuildArtifact => {
  const caseLedger = [...input.caseLedger].sort((left, right) =>
    `${left.scenarioId}:${left.nodeId}`.localeCompare(
      `${right.scenarioId}:${right.nodeId}`,
    ),
  );
  const poiGraph = buildPoiGraph(input.mapSnapshot, input.visualManifest);
  const qaFindings = buildQaFindings(input, poiGraph);

  return {
    schemaVersion: CASE_BUILD_ARTIFACT_SCHEMA_VERSION,
    artifactKind: "case_build",
    caseId: input.caseId,
    source: {
      snapshotPath: input.snapshotPath,
      snapshotChecksum: input.snapshotChecksum,
      snapshotSchemaVersion: input.snapshot.schemaVersion,
      caseIrSource: input.caseIr.metadata.source,
    },
    caseLedger: {
      summary: {
        totalNodes: caseLedger.length,
        coveredNodes: caseLedger.filter((row) => row.status === "COVERED")
          .length,
        bridgedNodes: caseLedger.filter((row) => row.status === "BRIDGED")
          .length,
        missingNodes: caseLedger.filter((row) => row.status === "MISSING")
          .length,
        identityDriftNodes: caseLedger.filter(
          (row) => row.identityFindings.length > 0,
        ).length,
      },
      nodes: caseLedger,
    },
    sceneGraph: buildSceneGraph(input.caseIr, input.caseId),
    poiGraph,
    clueLifecycleGraph: buildClueLifecycleGraph(
      input.snapshot,
      input.caseIr,
      input.mapSnapshot,
      input.caseId,
    ),
    questArchetypePack: {
      triggerRules: input.triggerRules.map((rule) => ({ ...rule })),
      questArchetypes: input.questArchetypes.map((archetype) => ({
        ...archetype,
        triggerRuleIds: [...archetype.triggerRuleIds],
        stepNodeIds: [...archetype.stepNodeIds],
      })),
    },
    visualManifest: {
      locations: [...input.visualManifest].sort((left, right) =>
        left.locationId.localeCompare(right.locationId),
      ),
      variants: [...input.visualVariants].sort((left, right) =>
        `${left.locationId}:${left.variantId}`.localeCompare(
          `${right.locationId}:${right.variantId}`,
        ),
      ),
      missingAssets: [...input.visualMissingAssets].sort((left, right) =>
        `${left.locationId}:${left.variantId}`.localeCompare(
          `${right.locationId}:${right.variantId}`,
        ),
      ),
      visualStateHints: buildVisualStateHints(
        input.visualManifest,
        input.visualMissingAssets,
      ),
    },
    aiCapabilityManifest: {
      supportedKinds: uniqueSorted(input.supportedAiKinds),
      director: {
        kind: "propose_director_step",
        source: "vn_node_entry",
        presentationOnly: true,
        stateMutationAllowed: false,
        stepTypes: ["framing", "next_beat_hint", "soft_detour"],
        outputFields: [
          "stepType",
          "framingText",
          "suggestedReturnBeatId",
          "bridgeText",
          "hintFactId",
        ],
        allowedBeatIds: uniqueSorted(input.directorAllowedBeatIds),
      },
      tabletopDm: {
        kind: "propose_dm_turn",
        source: "dm_side_panel",
        presentationOnly: false,
        stateMutationAllowed: false,
        requiresReviewAccept: true,
        sessionCanonOnly: true,
        outputFields: [
          "narration",
          "checks",
          "sessionFacts",
          "suggestedStateDeltas",
          "risks",
          "toneMode",
          "canonRemarks",
          "resourceCosts",
        ],
        allowedStateDeltaPrefixes: [
          "session.",
          "dm_session.",
          "overlay.session.",
          "session_",
          "witch_",
          "ghost_session_",
        ],
      },
    },
    qaFindings,
  };
};
