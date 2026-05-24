import type {
  CaseIr,
  CaseIrCondition,
  CaseIrDefinition,
  CaseIrEntityVersion,
  CaseIrEffect,
  CaseIrNode,
  CaseIrScenario,
  CaseIrSkillCheck,
  QuestArchetype,
  QuestPlannerConstraints,
  TriggerRule,
  VnChoice,
  VnCondition,
  VnEffect,
  VnNode,
  VnScenario,
  VnSkillCheckCostBranch,
  VnSkillCheckOutcomeBranch,
  VnSkillCheck,
  VnSnapshot,
} from "./types";
import { validateProceduralQuestPermissions } from "./procedural-permissions";

const CASE_ENTITY_VERSION: CaseIrEntityVersion = {
  kind: "case",
  kindVersion: 1,
};

const SCENARIO_ENTITY_VERSION: CaseIrEntityVersion = {
  kind: "scenario",
  kindVersion: 1,
};

const NODE_ENTITY_VERSION: CaseIrEntityVersion = {
  kind: "node",
  kindVersion: 1,
};

const CHOICE_ENTITY_VERSION: CaseIrEntityVersion = {
  kind: "choice",
  kindVersion: 1,
};

const EFFECT_ENTITY_VERSION: CaseIrEntityVersion = {
  kind: "effect",
  kindVersion: 1,
};

const CONDITION_ENTITY_VERSION: CaseIrEntityVersion = {
  kind: "condition",
  kindVersion: 1,
};

const SKILL_CHECK_ENTITY_VERSION: CaseIrEntityVersion = {
  kind: "skill_check",
  kindVersion: 1,
};

export interface CaseIrSourceMetadata {
  contentVersion?: string;
  bundleChecksum?: string;
  generatedAt?: string;
}

export interface CaseIrCatalogInput {
  triggerRules?: readonly TriggerRule[];
  questArchetypes?: readonly QuestArchetype[];
}

export interface CaseIrValidationIssue {
  severity: "error" | "warning";
  code:
    | "duplicate_case_id"
    | "duplicate_scenario_id"
    | "duplicate_node_id"
    | "duplicate_choice_id"
    | "missing_start_node"
    | "missing_scenario_node"
    | "node_scenario_mismatch"
    | "orphan_node"
    | "missing_choice_target"
    | "cross_scenario_choice_target"
    | "missing_skill_check_target"
    | "cross_scenario_skill_check_target"
    | "dead_end_node"
    | "unreachable_node"
    | "duplicate_trigger_rule_id"
    | "duplicate_quest_archetype_id"
    | "trigger_rule_unknown_case"
    | "trigger_rule_unknown_archetype"
    | "trigger_rule_invalid_generated_namespace"
    | "quest_archetype_unknown_trigger_rule"
    | "quest_archetype_missing_step_node"
    | "quest_archetype_no_steps"
    | "quest_archetype_forbidden_reward_effect";
  path: string;
  message: string;
}

export interface CaseIrValidationResult {
  ok: boolean;
  issues: CaseIrValidationIssue[];
}

export const buildCaseIrFromSnapshot = (
  snapshot: VnSnapshot,
  sourceMetadata: CaseIrSourceMetadata = {},
  catalog: CaseIrCatalogInput = {},
): CaseIr => {
  const scenarios = snapshot.scenarios.map(
    (scenario): CaseIrScenario => ({
      ...scenario,
      nodeIds: [...scenario.nodeIds],
      entityVersion: SCENARIO_ENTITY_VERSION,
    }),
  );
  const nodes = snapshot.nodes.map(
    (node): CaseIrNode => ({
      ...node,
      choices: node.choices.map((choice) => ({ ...choice })),
      entityVersion: NODE_ENTITY_VERSION,
    }),
  );
  const casesById = new Map<string, CaseIrDefinition>();

  for (const scenario of scenarios) {
    const caseId = scenario.packId ?? "default";
    const existing = casesById.get(caseId);
    if (existing) {
      existing.scenarioIds.push(scenario.id);
      continue;
    }

    casesById.set(caseId, {
      id: caseId,
      title: caseId,
      packId: scenario.packId,
      scenarioIds: [scenario.id],
      defaultLocale: "en",
      entityVersion: CASE_ENTITY_VERSION,
    });
  }

  const choices = nodes.flatMap((node) =>
    node.choices.map((choice) => ({
      ...choice,
      scenarioId: node.scenarioId,
      nodeId: node.id,
      entityVersion: CHOICE_ENTITY_VERSION,
    })),
  );
  const conditions = collectCaseIrConditions(nodes);
  const effects = collectCaseIrEffects(nodes);
  const skillChecks = collectCaseIrSkillChecks(nodes);

  return {
    metadata: {
      schemaVersion: snapshot.schemaVersion,
      source: "vn_snapshot",
      contentVersion: sourceMetadata.contentVersion,
      bundleChecksum: sourceMetadata.bundleChecksum,
      generatedAt: sourceMetadata.generatedAt,
    },
    cases: [...casesById.values()].sort((left, right) =>
      left.id.localeCompare(right.id),
    ),
    scenarios,
    nodes,
    choices,
    conditions,
    effects,
    skillChecks,
    triggerRules: (catalog.triggerRules ?? []).map((rule) => ({
      ...rule,
      conditions: rule.conditions ? [...rule.conditions] : undefined,
      allowedArchetypeIds: rule.allowedArchetypeIds
        ? [...rule.allowedArchetypeIds]
        : undefined,
      plannerConstraints: cloneQuestPlannerConstraints(rule.plannerConstraints),
    })),
    questArchetypes: (catalog.questArchetypes ?? []).map((archetype) => ({
      ...archetype,
      triggerRuleIds: [...archetype.triggerRuleIds],
      stepNodeIds: [...archetype.stepNodeIds],
      plannerConstraints: cloneQuestPlannerConstraints(
        archetype.plannerConstraints,
      ),
      rewardEffects: archetype.rewardEffects
        ? [...archetype.rewardEffects]
        : undefined,
    })),
  };
};

const cloneQuestPlannerConstraints = (
  constraints: QuestPlannerConstraints | undefined,
): QuestPlannerConstraints | undefined =>
  constraints
    ? {
        ...constraints,
        districtIds: constraints.districtIds
          ? [...constraints.districtIds]
          : undefined,
        poiCategories: constraints.poiCategories
          ? [...constraints.poiCategories]
          : undefined,
        resourceGates: constraints.resourceGates
          ? constraints.resourceGates.map((gate) => ({ ...gate }))
          : undefined,
        durationWindow: constraints.durationWindow
          ? { ...constraints.durationWindow }
          : undefined,
      }
    : undefined;

const normalizePathFragment = (value: string): string =>
  value.replace(/[^a-zA-Z0-9_:-]+/g, "_");

const collectNestedConditions = (
  condition: VnCondition,
  ownerPath: string,
): Array<{ condition: VnCondition; ownerPath: string }> => {
  const entries = [{ condition, ownerPath }];
  if (condition.type === "logic_and" || condition.type === "logic_or") {
    condition.conditions.forEach((nested, index) => {
      entries.push(
        ...collectNestedConditions(nested, `${ownerPath}.conditions.${index}`),
      );
    });
  } else if (condition.type === "logic_not") {
    entries.push(
      ...collectNestedConditions(condition.condition, `${ownerPath}.condition`),
    );
  }
  return entries;
};

const collectConditionList = (
  conditions: readonly VnCondition[] | undefined,
  ownerPath: string,
): Array<{ condition: VnCondition; ownerPath: string }> =>
  (conditions ?? []).flatMap((condition, index) =>
    collectNestedConditions(condition, `${ownerPath}.${index}`),
  );

const collectSkillCheckConditions = (
  check: VnSkillCheck | undefined,
  ownerPath: string,
): Array<{ condition: VnCondition; ownerPath: string }> =>
  check?.modifiers?.flatMap((modifier, index) =>
    modifier.condition
      ? collectNestedConditions(
          modifier.condition,
          `${ownerPath}.modifiers.${index}.condition`,
        )
      : [],
  ) ?? [];

const collectBranchEffects = (
  check: VnSkillCheck | undefined,
  ownerPath: string,
): Array<{ effect: VnEffect; ownerPath: string }> => {
  const branches: Array<
    [string, VnSkillCheckOutcomeBranch | VnSkillCheckCostBranch | undefined]
  > = [
    ["onSuccess", check?.onSuccess],
    ["onFail", check?.onFail],
    ["onCritical", check?.onCritical],
    ["onSuccessWithCost", check?.onSuccessWithCost],
  ];
  return branches.flatMap(([branchName, branch]) => [
    ...(branch?.effects ?? []).map((effect, index) => ({
      effect,
      ownerPath: `${ownerPath}.${branchName}.effects.${index}`,
    })),
    ...(branch && "costEffects" in branch
      ? (branch.costEffects ?? []).map((effect, index) => ({
          effect,
          ownerPath: `${ownerPath}.${branchName}.costEffects.${index}`,
        }))
      : []),
  ]);
};

const collectCaseIrConditions = (
  nodes: readonly CaseIrNode[],
): CaseIrCondition[] =>
  nodes.flatMap((node) => {
    const entries: CaseIrCondition[] = [];
    const push = (
      ownerPath: string,
      condition: VnCondition,
      choiceId?: string,
    ): void => {
      entries.push({
        id: `${node.scenarioId}:${node.id}:${normalizePathFragment(ownerPath)}`,
        scenarioId: node.scenarioId,
        nodeId: node.id,
        choiceId,
        ownerPath,
        condition,
        entityVersion: CONDITION_ENTITY_VERSION,
      });
    };

    for (const entry of collectConditionList(
      node.preconditions,
      `nodes.${node.id}.preconditions`,
    )) {
      push(entry.ownerPath, entry.condition);
    }
    for (const entry of collectSkillCheckConditions(
      undefined,
      `nodes.${node.id}`,
    )) {
      push(entry.ownerPath, entry.condition);
    }

    for (const choice of node.choices) {
      const conditionEntries = [
        ...collectConditionList(
          choice.conditions,
          `nodes.${node.id}.choices.${choice.id}.conditions`,
        ),
        ...collectConditionList(
          choice.visibleIfAll,
          `nodes.${node.id}.choices.${choice.id}.visibleIfAll`,
        ),
        ...collectConditionList(
          choice.visibleIfAny,
          `nodes.${node.id}.choices.${choice.id}.visibleIfAny`,
        ),
        ...collectConditionList(
          choice.requireAll,
          `nodes.${node.id}.choices.${choice.id}.requireAll`,
        ),
        ...collectConditionList(
          choice.requireAny,
          `nodes.${node.id}.choices.${choice.id}.requireAny`,
        ),
        ...collectSkillCheckConditions(
          choice.skillCheck,
          `nodes.${node.id}.choices.${choice.id}.skillCheck`,
        ),
      ];
      for (const entry of conditionEntries) {
        push(entry.ownerPath, entry.condition, choice.id);
      }
    }

    for (const [checkIndex, check] of (node.passiveChecks ?? []).entries()) {
      for (const entry of collectSkillCheckConditions(
        check,
        `nodes.${node.id}.passiveChecks.${checkIndex}`,
      )) {
        push(entry.ownerPath, entry.condition);
      }
    }

    return entries;
  });

const collectCaseIrEffects = (nodes: readonly CaseIrNode[]): CaseIrEffect[] =>
  nodes.flatMap((node) => {
    const entries: CaseIrEffect[] = [];
    const push = (
      ownerPath: string,
      effect: VnEffect,
      choiceId?: string,
    ): void => {
      entries.push({
        id: `${node.scenarioId}:${node.id}:${normalizePathFragment(ownerPath)}`,
        scenarioId: node.scenarioId,
        nodeId: node.id,
        choiceId,
        ownerPath,
        effect,
        entityVersion: EFFECT_ENTITY_VERSION,
      });
    };

    for (const [index, effect] of (node.onEnter ?? []).entries()) {
      push(`nodes.${node.id}.onEnter.${index}`, effect);
    }

    for (const choice of node.choices) {
      for (const [index, effect] of (choice.effects ?? []).entries()) {
        push(
          `nodes.${node.id}.choices.${choice.id}.effects.${index}`,
          effect,
          choice.id,
        );
      }
      for (const entry of collectBranchEffects(
        choice.skillCheck,
        `nodes.${node.id}.choices.${choice.id}.skillCheck`,
      )) {
        push(entry.ownerPath, entry.effect, choice.id);
      }
    }

    for (const [checkIndex, check] of (node.passiveChecks ?? []).entries()) {
      for (const entry of collectBranchEffects(
        check,
        `nodes.${node.id}.passiveChecks.${checkIndex}`,
      )) {
        push(entry.ownerPath, entry.effect);
      }
    }

    return entries;
  });

const collectCaseIrSkillChecks = (
  nodes: readonly CaseIrNode[],
): CaseIrSkillCheck[] =>
  nodes.flatMap((node) => [
    ...node.choices.flatMap((choice) =>
      choice.skillCheck
        ? [
            {
              ...choice.skillCheck,
              scenarioId: node.scenarioId,
              nodeId: node.id,
              choiceId: choice.id,
              ownerPath: `nodes.${node.id}.choices.${choice.id}.skillCheck`,
              entityVersion: SKILL_CHECK_ENTITY_VERSION,
            },
          ]
        : [],
    ),
    ...(node.passiveChecks ?? []).map((check, index) => ({
      ...check,
      scenarioId: node.scenarioId,
      nodeId: node.id,
      ownerPath: `nodes.${node.id}.passiveChecks.${index}`,
      entityVersion: SKILL_CHECK_ENTITY_VERSION,
    })),
  ]);

const addIssue = (
  issues: CaseIrValidationIssue[],
  issue: CaseIrValidationIssue,
): void => {
  issues.push(issue);
};

const collectDuplicates = <T>(
  entries: readonly T[],
  getId: (entry: T) => string,
): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const entry of entries) {
    const id = getId(entry);
    if (seen.has(id)) {
      duplicates.add(id);
    }
    seen.add(id);
  }
  return [...duplicates].sort();
};

const getChoiceTargets = (choice: VnChoice): string[] =>
  [
    choice.nextNodeId,
    choice.skillCheck?.onSuccess?.nextNodeId,
    choice.skillCheck?.onFail?.nextNodeId,
    choice.skillCheck?.onCritical?.nextNodeId,
    choice.skillCheck?.onSuccessWithCost?.nextNodeId,
  ].filter((target): target is string => typeof target === "string");

const getPassiveCheckTargets = (node: VnNode): string[] =>
  (node.passiveChecks ?? []).flatMap((check) =>
    [
      check.onSuccess?.nextNodeId,
      check.onFail?.nextNodeId,
      check.onCritical?.nextNodeId,
      check.onSuccessWithCost?.nextNodeId,
    ].filter((target): target is string => typeof target === "string"),
  );

const getOutgoingTargets = (node: VnNode): string[] => [
  ...node.choices.flatMap(getChoiceTargets),
  ...getPassiveCheckTargets(node),
];

const collectReachableNodeIds = (
  scenario: VnScenario,
  nodeById: ReadonlyMap<string, VnNode>,
): Set<string> => {
  const reachable = new Set<string>();
  const queue = [scenario.startNodeId];

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId || reachable.has(nodeId)) {
      continue;
    }
    reachable.add(nodeId);

    const node = nodeById.get(nodeId);
    if (!node) {
      continue;
    }

    for (const target of getOutgoingTargets(node)) {
      queue.push(target);
    }
  }

  return reachable;
};

export const validateCaseIr = (caseIr: CaseIr): CaseIrValidationResult => {
  const issues: CaseIrValidationIssue[] = [];
  const scenarioById = new Map(
    caseIr.scenarios.map((scenario) => [scenario.id, scenario]),
  );
  const nodeById = new Map(caseIr.nodes.map((node) => [node.id, node]));

  for (const caseId of collectDuplicates(caseIr.cases, (entry) => entry.id)) {
    addIssue(issues, {
      severity: "error",
      code: "duplicate_case_id",
      path: `cases.${caseId}`,
      message: `Duplicate case id '${caseId}'.`,
    });
  }

  for (const scenarioId of collectDuplicates(
    caseIr.scenarios,
    (entry) => entry.id,
  )) {
    addIssue(issues, {
      severity: "error",
      code: "duplicate_scenario_id",
      path: `scenarios.${scenarioId}`,
      message: `Duplicate scenario id '${scenarioId}'.`,
    });
  }

  for (const nodeId of collectDuplicates(caseIr.nodes, (entry) => entry.id)) {
    addIssue(issues, {
      severity: "error",
      code: "duplicate_node_id",
      path: `nodes.${nodeId}`,
      message: `Duplicate node id '${nodeId}'.`,
    });
  }

  const listedNodeIds = new Map<string, string>();
  for (const scenario of caseIr.scenarios) {
    const startNode = nodeById.get(scenario.startNodeId);
    if (!startNode) {
      addIssue(issues, {
        severity: "error",
        code: "missing_start_node",
        path: `scenarios.${scenario.id}.startNodeId`,
        message: `Scenario '${scenario.id}' startNodeId points to missing node '${scenario.startNodeId}'.`,
      });
    } else if (startNode.scenarioId !== scenario.id) {
      addIssue(issues, {
        severity: "error",
        code: "node_scenario_mismatch",
        path: `scenarios.${scenario.id}.startNodeId`,
        message: `Scenario '${scenario.id}' start node '${startNode.id}' belongs to '${startNode.scenarioId}'.`,
      });
    }

    for (const nodeId of scenario.nodeIds) {
      const node = nodeById.get(nodeId);
      if (!node) {
        addIssue(issues, {
          severity: "error",
          code: "missing_scenario_node",
          path: `scenarios.${scenario.id}.nodeIds.${nodeId}`,
          message: `Scenario '${scenario.id}' references missing node '${nodeId}'.`,
        });
        continue;
      }

      const previousScenarioId = listedNodeIds.get(nodeId);
      if (previousScenarioId) {
        addIssue(issues, {
          severity: "error",
          code: "duplicate_node_id",
          path: `scenarios.${scenario.id}.nodeIds.${nodeId}`,
          message: `Node '${nodeId}' is listed by both '${previousScenarioId}' and '${scenario.id}'.`,
        });
      }
      listedNodeIds.set(nodeId, scenario.id);

      if (node.scenarioId !== scenario.id) {
        addIssue(issues, {
          severity: "error",
          code: "node_scenario_mismatch",
          path: `nodes.${node.id}.scenarioId`,
          message: `Node '${node.id}' belongs to '${node.scenarioId}' but is listed by '${scenario.id}'.`,
        });
      }
    }
  }

  for (const node of caseIr.nodes) {
    if (!scenarioById.has(node.scenarioId)) {
      addIssue(issues, {
        severity: "error",
        code: "node_scenario_mismatch",
        path: `nodes.${node.id}.scenarioId`,
        message: `Node '${node.id}' references missing scenario '${node.scenarioId}'.`,
      });
    }

    if (!listedNodeIds.has(node.id)) {
      addIssue(issues, {
        severity: "error",
        code: "orphan_node",
        path: `nodes.${node.id}`,
        message: `Node '${node.id}' is not listed by any scenario.nodeIds.`,
      });
    }

    const choiceIds = new Set<string>();
    for (const choice of node.choices) {
      if (choiceIds.has(choice.id)) {
        addIssue(issues, {
          severity: "error",
          code: "duplicate_choice_id",
          path: `nodes.${node.id}.choices.${choice.id}`,
          message: `Node '${node.id}' has duplicate choice id '${choice.id}'.`,
        });
      }
      choiceIds.add(choice.id);

      for (const targetId of getChoiceTargets(choice)) {
        const target = nodeById.get(targetId);
        if (!target) {
          addIssue(issues, {
            severity: "error",
            code: "missing_choice_target",
            path: `nodes.${node.id}.choices.${choice.id}`,
            message: `Choice '${choice.id}' points to missing node '${targetId}'.`,
          });
        } else if (target.scenarioId !== node.scenarioId) {
          addIssue(issues, {
            severity: "error",
            code: "cross_scenario_choice_target",
            path: `nodes.${node.id}.choices.${choice.id}`,
            message: `Choice '${choice.id}' points outside scenario '${node.scenarioId}' to '${targetId}'.`,
          });
        }
      }
    }

    for (const targetId of getPassiveCheckTargets(node)) {
      const target = nodeById.get(targetId);
      if (!target) {
        addIssue(issues, {
          severity: "error",
          code: "missing_skill_check_target",
          path: `nodes.${node.id}.passiveChecks`,
          message: `Passive check on node '${node.id}' points to missing node '${targetId}'.`,
        });
      } else if (target.scenarioId !== node.scenarioId) {
        addIssue(issues, {
          severity: "error",
          code: "cross_scenario_skill_check_target",
          path: `nodes.${node.id}.passiveChecks`,
          message: `Passive check on node '${node.id}' points outside scenario '${node.scenarioId}' to '${targetId}'.`,
        });
      }
    }

    if (!node.terminal && getOutgoingTargets(node).length === 0) {
      addIssue(issues, {
        severity: "error",
        code: "dead_end_node",
        path: `nodes.${node.id}`,
        message: `Node '${node.id}' is non-terminal but has no outgoing targets.`,
      });
    }
  }

  for (const scenario of caseIr.scenarios) {
    const reachable = collectReachableNodeIds(scenario, nodeById);
    for (const nodeId of scenario.nodeIds) {
      if (!reachable.has(nodeId)) {
        addIssue(issues, {
          severity: "error",
          code: "unreachable_node",
          path: `scenarios.${scenario.id}.nodeIds.${nodeId}`,
          message: `Node '${nodeId}' is not reachable from scenario '${scenario.id}' start node '${scenario.startNodeId}'.`,
        });
      }
    }
  }

  const caseIds = new Set(caseIr.cases.map((entry) => entry.id));
  const archetypeIds = new Set(caseIr.questArchetypes.map((entry) => entry.id));
  const archetypeById = new Map(
    caseIr.questArchetypes.map((entry) => [entry.id, entry]),
  );
  const triggerRuleIds = new Set(caseIr.triggerRules.map((entry) => entry.id));

  for (const duplicate of collectDuplicates(
    caseIr.triggerRules,
    (entry) => entry.id,
  )) {
    addIssue(issues, {
      severity: "error",
      code: "duplicate_trigger_rule_id",
      path: `triggerRules.${duplicate}`,
      message: `Duplicate trigger rule id '${duplicate}'.`,
    });
  }

  for (const duplicate of collectDuplicates(
    caseIr.questArchetypes,
    (entry) => entry.id,
  )) {
    addIssue(issues, {
      severity: "error",
      code: "duplicate_quest_archetype_id",
      path: `questArchetypes.${duplicate}`,
      message: `Duplicate quest archetype id '${duplicate}'.`,
    });
  }

  for (const rule of caseIr.triggerRules) {
    if (rule.caseId && !caseIds.has(rule.caseId)) {
      addIssue(issues, {
        severity: "error",
        code: "trigger_rule_unknown_case",
        path: `triggerRules.${rule.id}.caseId`,
        message: `Trigger rule '${rule.id}' references unknown case '${rule.caseId}'.`,
      });
    }
    for (const archetypeId of rule.allowedArchetypeIds ?? []) {
      if (!archetypeIds.has(archetypeId)) {
        addIssue(issues, {
          severity: "error",
          code: "trigger_rule_unknown_archetype",
          path: `triggerRules.${rule.id}.allowedArchetypeIds.${archetypeId}`,
          message: `Trigger rule '${rule.id}' references unknown quest archetype '${archetypeId}'.`,
        });
        continue;
      }

      const archetype = archetypeById.get(archetypeId);
      if (archetype) {
        for (const issue of validateProceduralQuestPermissions(
          rule,
          archetype,
        )) {
          addIssue(issues, {
            severity: "error",
            code: issue.code,
            path: issue.path,
            message: issue.message,
          });
        }
      }
    }
  }

  for (const archetype of caseIr.questArchetypes) {
    if (archetype.stepNodeIds.length === 0) {
      addIssue(issues, {
        severity: "error",
        code: "quest_archetype_no_steps",
        path: `questArchetypes.${archetype.id}.stepNodeIds`,
        message: `Quest archetype '${archetype.id}' has no stepNodeIds.`,
      });
    }
    for (const ruleId of archetype.triggerRuleIds) {
      if (!triggerRuleIds.has(ruleId)) {
        addIssue(issues, {
          severity: "error",
          code: "quest_archetype_unknown_trigger_rule",
          path: `questArchetypes.${archetype.id}.triggerRuleIds.${ruleId}`,
          message: `Quest archetype '${archetype.id}' references unknown trigger rule '${ruleId}'.`,
        });
      }
    }
    for (const stepNodeId of archetype.stepNodeIds) {
      if (!nodeById.has(stepNodeId)) {
        addIssue(issues, {
          severity: "error",
          code: "quest_archetype_missing_step_node",
          path: `questArchetypes.${archetype.id}.stepNodeIds.${stepNodeId}`,
          message: `Quest archetype '${archetype.id}' step node '${stepNodeId}' is not present in Case IR.`,
        });
      }
    }
    if (
      archetype.failForwardNodeId &&
      !nodeById.has(archetype.failForwardNodeId)
    ) {
      addIssue(issues, {
        severity: "error",
        code: "quest_archetype_missing_step_node",
        path: `questArchetypes.${archetype.id}.failForwardNodeId`,
        message: `Quest archetype '${archetype.id}' failForwardNodeId '${archetype.failForwardNodeId}' is not present in Case IR.`,
      });
    }
  }

  return {
    ok: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
};
