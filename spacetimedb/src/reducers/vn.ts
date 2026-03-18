import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import {
  applyEffects,
  areConditionsSatisfied,
  arePassiveChecksResolved,
  createSessionKey,
  createSkillCheckResultKey,
  emitTelemetry,
  ensureIdempotent,
  ensurePlayerProfile,
  getActiveSnapshot,
  getFlag,
  getNode,
  getScenario,
  getVar,
  isChoiceAllowed,
  isNodeEntryAllowed,
  resolveSkillCheckOutcome,
  resolveDiceMode,
  rollSkillDie,
  type VnSkillCheck,
} from "./helpers";

const hasOptionalValue = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === "object" && value !== null && "tag" in value) {
    const tagged = value as { tag?: string };
    return tagged.tag === "some";
  }
  return true;
};

const hasCompletedSession = (session: { completedAt: unknown }): boolean =>
  hasOptionalValue(session.completedAt);

const getOptionalValue = <T>(value: unknown): T | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "object" && value !== null && "tag" in value) {
    const tagged = value as { tag: string; value: T };
    return tagged.tag === "some" ? tagged.value : undefined;
  }
  return value as T;
};

const withScenarioFlowTag = (
  scenario: { packId?: any },
  tags: Record<string, unknown>,
): Record<string, unknown> =>
  getOptionalValue(scenario.packId) === "system_origin_bootstrap"
    ? { ...tags, systemFlow: "origin_bootstrap" }
    : tags;

export interface StartScenarioInternalResult {
  activeVersion: { version: string };
  scenario: { id: string; packId?: unknown };
  startNode: { id: string; terminal?: boolean };
}

export interface StartScenarioInternalOptions {
  skipInboundRouteValidation?: boolean;
}

export const startScenarioInternal = (
  ctx: any,
  scenarioId: string,
  options: StartScenarioInternalOptions = {},
): StartScenarioInternalResult => {
  if (!scenarioId || scenarioId.trim().length === 0) {
    throw new SenderError("scenarioId must not be empty");
  }

  ensurePlayerProfile(ctx);

  const { snapshot, activeVersion } = getActiveSnapshot(ctx);
  const scenario = getScenario(snapshot, scenarioId);
  const startNode = getNode(snapshot, scenario.startNodeId);

  const inboundScenarios = snapshot.scenarios.filter(
    (entry) => entry.completionRoute?.nextScenarioId === scenarioId,
  );
  if (!options.skipInboundRouteValidation && inboundScenarios.length > 0) {
    const hasValidInboundRoute = inboundScenarios.some((sourceScenario) => {
      const route = sourceScenario.completionRoute;
      if (!route) {
        return false;
      }

      const sourceSession = ctx.db.vnSession.sessionKey.find(
        createSessionKey(ctx.sender, sourceScenario.id),
      );
      if (!sourceSession || !hasCompletedSession(sourceSession)) {
        return false;
      }

      const requiredFlagsMet = (route.requiredFlagsAll ?? []).every(
        (flag) => getFlag(ctx, flag) === true,
      );
      if (!requiredFlagsMet) {
        return false;
      }

      const blocked = (route.blockedIfFlagsAny ?? []).some(
        (flag) => getFlag(ctx, flag) === true,
      );
      return !blocked;
    });

    if (!hasValidInboundRoute) {
      emitTelemetry(ctx, "transition_rejected", {
        ...withScenarioFlowTag(scenario, {
          scenarioId,
          reason: "completion_route_blocked",
          inboundScenarioIds: inboundScenarios.map((entry) => entry.id),
        }),
      });
      throw new SenderError(
        "Scenario start is blocked by completion route rules",
      );
    }
  }

  if (startNode.scenarioId !== scenario.id) {
    throw new SenderError("Scenario start node mismatch");
  }
  if (!isNodeEntryAllowed(ctx, startNode)) {
    emitTelemetry(ctx, "transition_rejected", {
      ...withScenarioFlowTag(scenario, {
        scenarioId,
        nodeId: startNode.id,
        reason: "start_node_preconditions_failed",
      }),
    });
    throw new SenderError(
      "Scenario start node preconditions are not satisfied",
    );
  }

  const sessionKey = createSessionKey(ctx.sender, scenarioId);
  const existing = ctx.db.vnSession.sessionKey.find(sessionKey);
  const completedAt = startNode.terminal ? ctx.timestamp : undefined;

  if (existing) {
    ctx.db.vnSession.sessionKey.update({
      ...existing,
      nodeId: startNode.id,
      updatedAt: ctx.timestamp,
      completedAt,
    });
  } else {
    ctx.db.vnSession.insert({
      sessionKey,
      playerId: ctx.sender,
      scenarioId,
      nodeId: startNode.id,
      updatedAt: ctx.timestamp,
      completedAt,
    });
  }

  applyEffects(ctx, startNode.onEnter, {
    sourceType: "vn_on_enter",
    sourceId: `${scenarioId}::${startNode.id}`,
  });

  emitTelemetry(ctx, "scenario_started", {
    ...withScenarioFlowTag(scenario, {
      scenarioId,
      nodeId: startNode.id,
      contentVersion: activeVersion.version,
    }),
  });

  return {
    activeVersion,
    scenario,
    startNode,
  };
};

export const perform_skill_check = spacetimedb.reducer(
  {
    requestId: t.string(),
    scenarioId: t.string(),
    checkId: t.string(),
  },
  (ctx, { requestId, scenarioId, checkId }) => {
    if (!scenarioId || scenarioId.trim().length === 0) {
      throw new SenderError("scenarioId must not be empty");
    }
    if (!checkId || checkId.trim().length === 0) {
      throw new SenderError("checkId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "perform_skill_check");
    ensurePlayerProfile(ctx);

    const { snapshot, activeVersion } = getActiveSnapshot(ctx);
    getScenario(snapshot, scenarioId);
    const sessionKey = createSessionKey(ctx.sender, scenarioId);
    const session = ctx.db.vnSession.sessionKey.find(sessionKey);
    if (!session) {
      throw new SenderError("Scenario has not been started");
    }

    const currentNode = getNode(snapshot, session.nodeId);
    if (currentNode.scenarioId !== scenarioId) {
      throw new SenderError("Current node scenario mismatch");
    }

    let check: VnSkillCheck | undefined;
    let checkOwnerChoice: (typeof currentNode.choices)[number] | undefined;

    if (currentNode.passiveChecks) {
      check = currentNode.passiveChecks.find((entry) => entry.id === checkId);
    }

    if (!check) {
      for (const choice of currentNode.choices) {
        if (choice.skillCheck?.id === checkId) {
          check = choice.skillCheck;
          checkOwnerChoice = choice;
          break;
        }
      }
    }

    if (!check) {
      throw new SenderError(
        `Skill check ${checkId} not found on node ${currentNode.id}`,
      );
    }

    // Prevent re-rolling the same check
    const resultKey = createSkillCheckResultKey(
      ctx.sender,
      scenarioId,
      currentNode.id,
      checkId,
    );
    const existingResult = ctx.db.vnSkillCheckResult.resultKey.find(resultKey);
    if (existingResult) {
      throw new SenderError("Skill check already performed");
    }

    if (checkOwnerChoice && !isChoiceAllowed(ctx, checkOwnerChoice)) {
      emitTelemetry(ctx, "transition_rejected", {
        scenarioId,
        nodeId: currentNode.id,
        choiceId: checkOwnerChoice.id,
        checkId,
        reason: "choice_gated",
      });
      throw new SenderError(
        "Choice gating conditions are not satisfied for this skill check",
      );
    }

    const diceMode = resolveDiceMode(snapshot, scenarioId);
    const roll = rollSkillDie(ctx.timestamp, ctx.sender, checkId, diceMode);
    const voiceLevel = Math.floor(getVar(ctx, check.voiceId));

    // Resolve modifiers deterministically from player state
    const breakdown: { source: string; sourceId: string; delta: number }[] = [
      { source: "voice", sourceId: check.voiceId, delta: voiceLevel },
    ];
    let modifierTotal = 0;
    if (check.modifiers) {
      for (const mod of check.modifiers) {
        const conditionsMet =
          !mod.condition || areConditionsSatisfied(ctx, [mod.condition]);
        if (conditionsMet) {
          modifierTotal += mod.delta;
          breakdown.push({
            source: mod.source,
            sourceId: mod.sourceId,
            delta: mod.delta,
          });
        }
      }
    }

    const total = roll + voiceLevel + modifierTotal;
    const passed = total >= check.difficulty;
    const margin = total - check.difficulty;

    // Determine outcome grade and branch.
    const { outcomeGrade, outcome, costEffects } = resolveSkillCheckOutcome({
      check,
      passed,
      margin,
    });

    const nextNodeId = outcome?.nextNodeId;
    let nextNode: ReturnType<typeof getNode> | null = null;
    if (nextNodeId) {
      const candidate = getNode(snapshot, nextNodeId);
      if (candidate.scenarioId !== scenarioId) {
        throw new SenderError(
          "Skill check outcome points to node outside scenario",
        );
      }
      if (!isNodeEntryAllowed(ctx, candidate)) {
        emitTelemetry(ctx, "transition_rejected", {
          scenarioId,
          nodeId: currentNode.id,
          checkId,
          reason: "next_node_preconditions_failed",
          targetNodeId: candidate.id,
        });
        throw new SenderError("Next node preconditions are not satisfied");
      }
      nextNode = candidate;
    }

    // Record result with breakdown and outcome grade
    ctx.db.vnSkillCheckResult.insert({
      resultKey,
      playerId: ctx.sender,
      scenarioId,
      nodeId: currentNode.id,
      checkId,
      roll,
      voiceLevel,
      difficulty: check.difficulty,
      passed,
      nextNodeId,
      breakdownJson: JSON.stringify(breakdown),
      outcomeGrade,
      createdAt: ctx.timestamp,
    });

    // Apply outcome effects
    if (outcome?.effects) {
      applyEffects(ctx, outcome.effects, {
        sourceType: "vn_skill_check",
        sourceId: `${scenarioId}::${currentNode.id}::${checkId}`,
      });
    }

    // Apply cost effects for success_with_cost
    if (costEffects) {
      applyEffects(ctx, costEffects, {
        sourceType: "vn_skill_check_cost",
        sourceId: `${scenarioId}::${currentNode.id}::${checkId}`,
      });
    }

    // Transition to outcome node if specified
    if (nextNode) {
      applyEffects(ctx, nextNode.onEnter, {
        sourceType: "vn_on_enter",
        sourceId: `${scenarioId}::${nextNode.id}`,
      });

      ctx.db.vnSession.sessionKey.update({
        ...session,
        nodeId: nextNode.id,
        updatedAt: ctx.timestamp,
        completedAt: nextNode.terminal ? ctx.timestamp : undefined,
      });
    }

    emitTelemetry(ctx, "skill_check_performed", {
      scenarioId,
      nodeId: currentNode.id,
      checkId,
      voiceId: check.voiceId,
      roll,
      voiceLevel,
      modifierTotal,
      difficulty: check.difficulty,
      passed,
      outcomeGrade,
      margin,
      nextNodeId: nextNodeId ?? null,
      diceMode,
      contentVersion: activeVersion.version,
    });
  },
);

export const start_scenario = spacetimedb.reducer(
  {
    requestId: t.string(),
    scenarioId: t.string(),
  },
  (ctx, { requestId, scenarioId }) => {
    ensureIdempotent(ctx, requestId, "start_scenario");
    startScenarioInternal(ctx, scenarioId);
  },
);

export const record_choice = spacetimedb.reducer(
  {
    requestId: t.string(),
    scenarioId: t.string(),
    choiceId: t.string(),
  },
  (ctx, { requestId, scenarioId, choiceId }) => {
    if (!scenarioId || scenarioId.trim().length === 0) {
      throw new SenderError("scenarioId must not be empty");
    }
    if (!choiceId || choiceId.trim().length === 0) {
      throw new SenderError("choiceId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "record_choice");
    ensurePlayerProfile(ctx);

    const { snapshot, activeVersion } = getActiveSnapshot(ctx);
    const scenario = getScenario(snapshot, scenarioId);
    const sessionKey = createSessionKey(ctx.sender, scenarioId);
    const session = ctx.db.vnSession.sessionKey.find(sessionKey);
    if (!session) {
      throw new SenderError("Scenario has not been started");
    }

    if (!scenario.nodeIds.includes(session.nodeId)) {
      throw new SenderError("Current node does not belong to scenario");
    }

    const currentNode = getNode(snapshot, session.nodeId);
    if (currentNode.scenarioId !== scenarioId) {
      throw new SenderError("Current node scenario mismatch");
    }
    if (currentNode.terminal) {
      throw new SenderError("Scenario already completed");
    }

    if (
      !arePassiveChecksResolved(
        ctx,
        scenarioId,
        currentNode.id,
        currentNode.passiveChecks,
      )
    ) {
      throw new SenderError("Passive checks pending");
    }

    const choice = currentNode.choices.find((entry) => entry.id === choiceId);
    if (!choice) {
      throw new SenderError(`Choice ${choiceId} not found in current node`);
    }

    if (!isChoiceAllowed(ctx, choice)) {
      emitTelemetry(ctx, "transition_rejected", {
        scenarioId,
        nodeId: currentNode.id,
        choiceId,
        reason: "choice_gated",
      });
      throw new SenderError("Choice gating conditions are not satisfied");
    }

    if (choice.skillCheck) {
      const resultKey = createSkillCheckResultKey(
        ctx.sender,
        scenarioId,
        currentNode.id,
        choice.skillCheck.id,
      );
      const skillResult = ctx.db.vnSkillCheckResult.resultKey.find(resultKey);
      if (!skillResult) {
        throw new SenderError("Skill check is required before this choice");
      }

      const hasBranchNode = hasOptionalValue(skillResult.nextNodeId);
      if (!skillResult.passed) {
        if (!hasBranchNode) {
          throw new SenderError("Skill check failed");
        }
        throw new SenderError("Inconsistent skill check state");
      }

      if (hasBranchNode) {
        throw new SenderError("Inconsistent skill check state");
      }
    }

    const nextNode = getNode(snapshot, choice.nextNodeId);
    if (nextNode.scenarioId !== scenarioId) {
      throw new SenderError("Choice points to node outside scenario");
    }
    if (!isNodeEntryAllowed(ctx, nextNode)) {
      emitTelemetry(ctx, "transition_rejected", {
        scenarioId,
        nodeId: currentNode.id,
        choiceId,
        reason: "next_node_preconditions_failed",
        targetNodeId: nextNode.id,
      });
      throw new SenderError("Next node preconditions are not satisfied");
    }

    applyEffects(ctx, choice.effects, {
      sourceType: "vn_choice",
      sourceId: `${scenarioId}::${currentNode.id}::${choiceId}`,
    });

    applyEffects(ctx, nextNode.onEnter, {
      sourceType: "vn_on_enter",
      sourceId: `${scenarioId}::${nextNode.id}`,
    });

    ctx.db.vnSession.sessionKey.update({
      ...session,
      nodeId: nextNode.id,
      updatedAt: ctx.timestamp,
      completedAt: nextNode.terminal ? ctx.timestamp : undefined,
    });

    emitTelemetry(ctx, "choice_recorded", {
      scenarioId,
      fromNodeId: currentNode.id,
      choiceId,
      toNodeId: nextNode.id,
      contentVersion: activeVersion.version,
      terminal: Boolean(nextNode.terminal),
    });
  },
);
