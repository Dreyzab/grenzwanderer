import { describe, expect, it } from "vitest";

import {
  AI_CHARACTER_REACTION_SOURCE_VN_SCENE,
  AI_DIALOGUE_SOURCE_SKILL_CHECK,
  AI_DIRECTOR_STEP_SOURCE_VN_NODE_ENTRY,
  AI_DM_TURN_SOURCE_SIDE_PANEL,
  CHARACTER_REACTION_PROPOSAL_JSON_SCHEMA,
  DIRECTOR_STEP_PROPOSAL_JSON_SCHEMA,
  DM_TURN_PROPOSAL_JSON_SCHEMA,
  GENERATE_DIALOGUE_ENVELOPE_JSON_SCHEMA,
  collectFeedbackReportQuoteEvidenceIds,
  feedbackReportQuotesReferenceKnownEvidence,
  isAllowedDirectorReturnBeatId,
  isAllowedDmStateDeltaKey,
  isFeedbackAnalysisReportV1,
  parseAnalyzeFeedbackPayload,
  parseCharacterReactionProposal,
  parseDmTurnProposal,
  parseDirectorStepProposal,
  parseFeedbackAnalysisReportV1,
  parseGenerateCharacterReactionPayload,
  parseGenerateDialogueEnvelope,
  parseGenerateDialoguePayload,
  parseGenerateDialogueResponse,
  parseGenerateDmTurnPayload,
  parseGenerateDirectorStepPayload,
  type FeedbackAnalysisReportV1,
} from "./contracts";

const baseAnalyzeFeedbackPayload = {
  source: "feedback_center",
  reportId: "42",
  outputLanguage: "ru",
  filters: { contentVersion: "v1.0.0", scenarioId: "case01" },
  snapshotHash: "abc123",
  ratingStats: {
    contentCount: 2,
    dialogueCount: 1,
    commentedCount: 2,
    averageOverall: 6.5,
  },
  sources: [
    {
      evidenceId: "src_1",
      kind: "content",
      targetType: "node",
      targetId: "node_a",
      scenarioId: "case01",
      contentVersion: "v1.0.0",
      scoresJson: '{"overallScore":6}',
      comment: "Слишком затянуто.",
    },
    {
      evidenceId: "src_2",
      kind: "dialogue",
      targetType: "node",
      targetId: "node_b",
      scenarioId: "case01",
      scoresJson: '{"score":2}',
      comment: "The line feels off.",
    },
  ],
} as const;

const baseFeedbackReport: FeedbackAnalysisReportV1 = {
  schemaVersion: "v1",
  coverageSummary: "Срез по версии v1.0.0.",
  ratingStatsSummary: "Средний балл 6.5.",
  strengths: [],
  thematicFindings: [
    {
      title: "Темп проседает",
      detail: "Несколько игроков отмечают затянутость.",
      severity: "medium",
      confidence: 0.7,
      affectedTargets: ["node_a"],
      quotes: [{ evidenceId: "src_1", text: "Слишком затянуто." }],
    },
  ],
  opinionSplits: [],
  dataGaps: ["Мало отзывов по боевым сценам."],
  followupQuestions: ["Что именно ощущается затянутым?"],
};

describe("analyze_feedback contract", () => {
  it("parses a valid analyze_feedback payload", () => {
    const payload = parseAnalyzeFeedbackPayload(
      JSON.stringify(baseAnalyzeFeedbackPayload),
    );
    expect(payload?.source).toBe("feedback_center");
    expect(payload?.outputLanguage).toBe("ru");
    expect(payload?.sources).toHaveLength(2);
  });

  it("rejects payloads over the 100-source cap", () => {
    const tooMany = Array.from({ length: 101 }, (_unused, index) => ({
      evidenceId: `src_${index + 1}`,
      kind: "content" as const,
      targetType: "node",
      targetId: "node_a",
      scoresJson: "{}",
    }));
    const payload = parseAnalyzeFeedbackPayload(
      JSON.stringify({ ...baseAnalyzeFeedbackPayload, sources: tooMany }),
    );
    expect(payload).toBeNull();
  });

  it("rejects an invalid output language", () => {
    const payload = parseAnalyzeFeedbackPayload(
      JSON.stringify({ ...baseAnalyzeFeedbackPayload, outputLanguage: "fr" }),
    );
    expect(payload).toBeNull();
  });

  it("parses a valid FeedbackAnalysisReportV1", () => {
    const report = parseFeedbackAnalysisReportV1(
      JSON.stringify(baseFeedbackReport),
    );
    expect(report?.schemaVersion).toBe("v1");
    expect(report?.thematicFindings[0]?.quotes[0]?.evidenceId).toBe("src_1");
  });

  it("collects every quote evidenceId across finding groups", () => {
    const report: FeedbackAnalysisReportV1 = {
      ...baseFeedbackReport,
      opinionSplits: [
        {
          title: "Разные мнения",
          detail: "Кто-то хвалит, кто-то ругает.",
          severity: "low",
          confidence: 0.4,
          affectedTargets: ["node_b"],
          quotes: [{ evidenceId: "src_2", text: "The line feels off." }],
        },
      ],
    };
    expect(collectFeedbackReportQuoteEvidenceIds(report).sort()).toEqual([
      "src_1",
      "src_2",
    ]);
  });

  it("flags reports that cite an unknown evidenceId", () => {
    const allowed = new Set(["src_1"]);
    const report: FeedbackAnalysisReportV1 = {
      ...baseFeedbackReport,
      thematicFindings: [
        {
          ...baseFeedbackReport.thematicFindings[0],
          quotes: [{ evidenceId: "src_999", text: "ghost quote" }],
        },
      ],
    };
    expect(feedbackReportQuotesReferenceKnownEvidence(report, allowed)).toBe(
      false,
    );
  });

  it("accepts reports whose quotes all reference known evidence", () => {
    const allowed = new Set(["src_1", "src_2"]);
    expect(
      feedbackReportQuotesReferenceKnownEvidence(baseFeedbackReport, allowed),
    ).toBe(true);
  });

  it("rejects a report with a confidence outside 0..1", () => {
    const report = {
      ...baseFeedbackReport,
      thematicFindings: [
        { ...baseFeedbackReport.thematicFindings[0], confidence: 1.7 },
      ],
    };
    expect(isFeedbackAnalysisReportV1(report)).toBe(false);
  });
});

describe("ai contracts", () => {
  it("parses dialogue payloads with ensemble metadata", () => {
    const payload = parseGenerateDialoguePayload(
      JSON.stringify({
        source: AI_DIALOGUE_SOURCE_SKILL_CHECK,
        scenarioId: "dog_case_intro",
        nodeId: "node_tailor_audit",
        checkId: "check_tailor_pressure",
        choiceId: "DOG_TAILOR_AUDIT_BOOKS",
        voiceId: "attr_social",
        choiceText: "Lean in and make the tailor talk.",
        passed: true,
        roll: 14,
        difficulty: 12,
        voiceLevel: 3,
        locationName: "Tailor Shop",
        characterName: "Tailor",
        narrativeText: "The room smells like steam, ink, and fear.",
        outcomeGrade: "critical",
        breakdown: [
          { source: "voice", sourceId: "attr_social", delta: 3 },
          { source: "preparation", sourceId: "tailor_dossier", delta: 2 },
        ],
        margin: 7,
        voicePresenceMode: "parliament",
        activeSpeakers: ["attr_social", "attr_logic"],
        psycheProfile: {
          axisX: 62,
          axisY: -18,
          approach: 44,
          dominantInnerVoiceId: "inner_analyst",
          activeInnerVoiceIds: ["inner_analyst", "inner_cynic"],
        },
        ensemble: {
          mode: "duet",
          peerVoiceIds: ["attr_logic", "attr_empathy", "attr_perception"],
        },
        sceneResultEnvelope: {
          source: "skill_check",
          scenarioId: "dog_case_intro",
          nodeId: "node_tailor_audit",
          locationName: "Tailor Shop",
          timestamp: 1_700_000_000_000,
          playerState: {
            flags: ["origin_journalist"],
            activeQuests: [{ questId: "quest_dog", stage: 1 }],
            voiceLevels: { attr_social: 3 },
          },
          checkResult: {
            checkId: "check_tailor_pressure",
            voiceId: "attr_social",
            outcomeGrade: "critical",
            margin: 7,
            breakdown: [{ source: "voice", sourceId: "attr_social", delta: 3 }],
          },
          ensemble: {
            presenceMode: "parliament",
            activeSpeakers: ["attr_social", "attr_logic"],
          },
        },
      }),
    );

    expect(payload?.ensemble?.mode).toBe("duet");
    expect(payload?.ensemble?.peerVoiceIds).toHaveLength(3);
    expect(payload?.psycheProfile?.dominantInnerVoiceId).toBe("inner_analyst");
    expect(payload?.sceneResultEnvelope?.ensemble?.presenceMode).toBe(
      "parliament",
    );
  });

  it("rejects malformed psyche profiles in dialogue payloads", () => {
    const payload = parseGenerateDialoguePayload(
      JSON.stringify({
        source: AI_DIALOGUE_SOURCE_SKILL_CHECK,
        scenarioId: "dog_case_intro",
        nodeId: "node_tailor_audit",
        checkId: "check_tailor_pressure",
        choiceId: "DOG_TAILOR_AUDIT_BOOKS",
        voiceId: "attr_social",
        choiceText: "Lean in and make the tailor talk.",
        passed: true,
        roll: 14,
        difficulty: 12,
        voiceLevel: 3,
        locationName: "Tailor Shop",
        narrativeText: "The room smells like steam, ink, and fear.",
        psycheProfile: {
          axisX: 20,
          axisY: "bad",
          approach: 12,
          dominantInnerVoiceId: "inner_guide",
          activeInnerVoiceIds: ["inner_guide"],
        },
      }),
    );

    expect(payload).toBeNull();
  });

  it("rejects malformed scene result envelopes in dialogue payloads", () => {
    const payload = parseGenerateDialoguePayload(
      JSON.stringify({
        source: AI_DIALOGUE_SOURCE_SKILL_CHECK,
        scenarioId: "dog_case_intro",
        nodeId: "node_tailor_audit",
        checkId: "check_tailor_pressure",
        choiceId: "DOG_TAILOR_AUDIT_BOOKS",
        voiceId: "attr_social",
        choiceText: "Lean in and make the tailor talk.",
        passed: true,
        roll: 14,
        difficulty: 12,
        voiceLevel: 3,
        locationName: "Tailor Shop",
        narrativeText: "The room smells like steam, ink, and fear.",
        sceneResultEnvelope: {
          source: "skill_check",
          scenarioId: "dog_case_intro",
          locationName: "Tailor Shop",
          timestamp: 1_700_000_000_000,
          playerState: {
            flags: [],
            activeQuests: [],
            voiceLevels: {},
          },
          ensemble: {
            presenceMode: "parliament",
            activeSpeakers: "attr_social",
          },
        },
      }),
    );

    expect(payload).toBeNull();
  });

  it("parses envelopes while keeping the base dialogue parser compatible", () => {
    const raw = JSON.stringify({
      text: "Keep him talking. The room wants a confession.",
      canonicalVoiceId: "charisma",
      metadata: {
        promptTokens: 111,
        completionTokens: 24,
        modelId: "gemini-2.5-flash",
        latencyMs: 42,
      },
      suggestedEffects: [
        {
          type: "hypothesis_focus",
          target: "case_hidden_signals",
          value: "occult",
        },
      ],
    });

    expect(parseGenerateDialogueResponse(raw)?.text).toContain("Keep him");
    expect(parseGenerateDialogueEnvelope(raw)?.metadata?.modelId).toBe(
      "gemini-2.5-flash",
    );
    expect(parseGenerateDialogueEnvelope(raw)?.suggestedEffects).toHaveLength(
      1,
    );
    expect(
      parseGenerateDialogueEnvelope(raw)?.suggestedEffects?.[0]?.type,
    ).toBe("hypothesis_focus");
  });

  it("parses constrained character reaction payloads", () => {
    const payload = parseGenerateCharacterReactionPayload(
      JSON.stringify({
        source: AI_CHARACTER_REACTION_SOURCE_VN_SCENE,
        characterId: "char_tailor",
        scenarioId: "dog_case_intro",
        nodeId: "node_tailor_audit",
        eventText: "The detective corners the tailor over missing ledgers.",
        playerPrompt: "Press him carefully.",
        visibleFacts: ["tailor_public_role", "tailor_hands_shaking"],
        relationshipState: {
          trust: -1,
          disposition: "guarded",
        },
      }),
    );

    expect(payload?.characterId).toBe("char_tailor");
    expect(payload?.relationshipState.disposition).toBe("guarded");
  });

  it("rejects malformed character reaction payloads", () => {
    const payload = parseGenerateCharacterReactionPayload(
      JSON.stringify({
        source: AI_CHARACTER_REACTION_SOURCE_VN_SCENE,
        characterId: "char_tailor",
        scenarioId: "dog_case_intro",
        eventText: "The detective corners the tailor over missing ledgers.",
        visibleFacts: ["tailor_public_role"],
        relationshipState: {
          trust: -1,
          disposition: "suspicious",
        },
      }),
    );

    expect(payload).toBeNull();
  });

  it("parses constrained character reaction proposals", () => {
    const proposal = parseCharacterReactionProposal(
      JSON.stringify({
        characterId: "char_tailor",
        reactionType: "evasion",
        text: "He smiles too quickly and reaches for the measuring tape.",
        revealHintFactId: "tailor_debt_hint",
        suggestedEffects: [
          {
            type: "mood_shift",
            value: -1,
          },
        ],
      }),
    );

    expect(proposal?.reactionType).toBe("evasion");
    expect(proposal?.revealHintFactId).toBe("tailor_debt_hint");
  });

  it("rejects character reaction proposals that try to emit executable actions", () => {
    const proposal = parseCharacterReactionProposal(
      JSON.stringify({
        characterId: "char_tailor",
        reactionType: "dialogue",
        text: "Fine. Take the ledger.",
        action: "grant_evidence",
      }),
    );

    expect(proposal).toBeNull();
  });

  it("exports JSON schemas for provider structured output", () => {
    expect(GENERATE_DIALOGUE_ENVELOPE_JSON_SCHEMA.required).toEqual([
      "text",
      "canonicalVoiceId",
    ]);
    expect(
      GENERATE_DIALOGUE_ENVELOPE_JSON_SCHEMA.properties.suggestedEffects
        .description,
    ).toContain("never auto-applied");
    expect(CHARACTER_REACTION_PROPOSAL_JSON_SCHEMA.required).toEqual([
      "characterId",
      "reactionType",
      "text",
    ]);
    expect(
      CHARACTER_REACTION_PROPOSAL_JSON_SCHEMA.properties.reactionType.enum,
    ).toContain("silence");
    expect(DIRECTOR_STEP_PROPOSAL_JSON_SCHEMA.required).toEqual([
      "stepType",
      "framingText",
      "suggestedReturnBeatId",
    ]);
    expect(
      DIRECTOR_STEP_PROPOSAL_JSON_SCHEMA.properties.stepType.enum,
    ).toContain("soft_detour");
    expect(DM_TURN_PROPOSAL_JSON_SCHEMA.required).toEqual([
      "narration",
      "checks",
      "sessionFacts",
      "suggestedStateDeltas",
      "risks",
      "toneMode",
      "canonRemarks",
    ]);
  });

  it("parses director step payloads triggered by VN node entry", () => {
    const payload = parseGenerateDirectorStepPayload(
      JSON.stringify({
        source: AI_DIRECTOR_STEP_SOURCE_VN_NODE_ENTRY,
        scenarioId: "case01_hbf_arrival",
        nodeId: "scene_case01_hbf_arrival_intro",
        currentBeatId: "case01_hbf_arrival",
        allowedBeatIds: ["case01_hbf_arrival", "case01_mayor_briefing"],
        visibleFacts: ["fritz_contact_established"],
        activeFlags: ["freiburg_case01_mainline_active"],
        activeQuests: [{ questId: "quest_case01_main", stage: 1 }],
        routeContext: "Hbf, утро, толпа",
      }),
    );

    expect(payload?.source).toBe(AI_DIRECTOR_STEP_SOURCE_VN_NODE_ENTRY);
    expect(payload?.scenarioId).toBe("case01_hbf_arrival");
    expect(payload?.allowedBeatIds).toHaveLength(2);
  });

  it("rejects director step payloads carrying unsupported player input fields", () => {
    const payload = parseGenerateDirectorStepPayload(
      JSON.stringify({
        source: AI_DIRECTOR_STEP_SOURCE_VN_NODE_ENTRY,
        scenarioId: "case01_hbf_arrival",
        nodeId: "scene_case01_hbf_arrival_intro",
        currentBeatId: "case01_hbf_arrival",
        allowedBeatIds: ["case01_hbf_arrival"],
        visibleFacts: [],
        activeFlags: [],
        activeQuests: [],
        playerSuggestion: "Я хочу свернуть с канона.",
      }),
    );

    expect(payload).toBeNull();
  });

  it("rejects director step payloads with empty allowed beat list", () => {
    const payload = parseGenerateDirectorStepPayload(
      JSON.stringify({
        source: AI_DIRECTOR_STEP_SOURCE_VN_NODE_ENTRY,
        scenarioId: "case01_hbf_arrival",
        nodeId: "scene_case01_hbf_arrival_intro",
        currentBeatId: "case01_hbf_arrival",
        allowedBeatIds: [],
        visibleFacts: [],
        activeFlags: [],
        activeQuests: [],
      }),
    );

    expect(payload).toBeNull();
  });

  it("rejects director step payloads with malformed quests", () => {
    const payload = parseGenerateDirectorStepPayload(
      JSON.stringify({
        source: AI_DIRECTOR_STEP_SOURCE_VN_NODE_ENTRY,
        scenarioId: "case01_hbf_arrival",
        nodeId: "scene_case01_hbf_arrival_intro",
        currentBeatId: "case01_hbf_arrival",
        allowedBeatIds: ["case01_hbf_arrival"],
        visibleFacts: [],
        activeFlags: [],
        activeQuests: [{ questId: "quest_case01_main", stage: "one" }],
      }),
    );

    expect(payload).toBeNull();
  });

  it("parses constrained director step proposals", () => {
    const proposal = parseDirectorStepProposal(
      JSON.stringify({
        stepType: "next_beat_hint",
        framingText: "Голос сцены подталкивает к мэру.",
        suggestedReturnBeatId: "case01_mayor_briefing",
      }),
    );

    expect(proposal?.stepType).toBe("next_beat_hint");
    expect(proposal?.suggestedReturnBeatId).toBe("case01_mayor_briefing");
  });

  it("rejects director proposals that try to emit state mutation fields", () => {
    const proposal = parseDirectorStepProposal(
      JSON.stringify({
        stepType: "soft_detour",
        framingText: "Director adds a small detour.",
        suggestedReturnBeatId: "case01_mayor_briefing",
        flagsToSet: ["bank_investigation_complete"],
      }),
    );

    expect(proposal).toBeNull();
  });

  it("rejects director proposals with empty framing text", () => {
    const proposal = parseDirectorStepProposal(
      JSON.stringify({
        stepType: "framing",
        framingText: "   ",
        suggestedReturnBeatId: "case01_mayor_briefing",
      }),
    );

    expect(proposal).toBeNull();
  });

  it("validates return beat id against allowed list", () => {
    const proposal = parseDirectorStepProposal(
      JSON.stringify({
        stepType: "framing",
        framingText: "Director nudges forward.",
        suggestedReturnBeatId: "case01_mayor_briefing",
      }),
    );

    expect(proposal).not.toBeNull();
    expect(
      isAllowedDirectorReturnBeatId(proposal!, [
        "case01_hbf_arrival",
        "case01_mayor_briefing",
      ]),
    ).toBe(true);
    expect(
      isAllowedDirectorReturnBeatId(proposal!, ["case01_hbf_arrival"]),
    ).toBe(false);
  });

  it("parses DM turn payloads from the side panel", () => {
    const payload = parseGenerateDmTurnPayload(
      JSON.stringify({
        source: AI_DM_TURN_SOURCE_SIDE_PANEL,
        scenarioId: "sandbox_ghost_pilot",
        nodeId: "scene_evidence_collection",
        actionText: "Я пытаюсь запугать Карла так, чтобы он выдал тайный ход.",
        remark: {
          text: "Я хочу убедиться, что он не расскажет общему знакомому.",
          visibility: "private_dm",
        },
        spendFateToken: true,
        fortuneSpend: 1,
        moveTags: ["coercive", "investigation"],
        resources: {
          fate: 6,
          fortune: 0,
          fortuneMod: -1,
          karma: -10,
        },
        psyche: {
          axisX: -35,
          axisY: -20,
          approach: 10,
          dominantInnerVoiceId: "inner_manipulator",
          activeInnerVoiceIds: ["inner_manipulator"],
        },
        bloodCurse: {
          tier: 1,
          pressure: 35,
          power: 0,
          debt: 0,
          alcoholAftertaste: 0,
        },
        activeSessionFacts: [],
        acceptedRemarks: [],
        visibleFacts: ["Karl is nervous around the old pantry."],
        activeFlags: ["origin_witch"],
        toneMode: "gothic_mystery",
        locale: "ru",
      }),
    );

    expect(payload?.source).toBe(AI_DM_TURN_SOURCE_SIDE_PANEL);
    expect(payload?.moveTags).toContain("coercive");
    expect(payload?.remark?.visibility).toBe("private_dm");
  });

  const baseDmTurnPayload = {
    source: AI_DM_TURN_SOURCE_SIDE_PANEL,
    scenarioId: "sandbox_ghost_pilot",
    nodeId: "scene_evidence_collection",
    actionText: "Продолжай сцену.",
    spendFateToken: false,
    moveTags: [],
    resources: { fate: 1, fortune: 0, fortuneMod: 0, karma: 0 },
    psyche: {
      axisX: 0,
      axisY: 0,
      approach: 0,
      dominantInnerVoiceId: null,
      activeInnerVoiceIds: [],
    },
    bloodCurse: {
      tier: 0,
      pressure: 0,
      power: 0,
      debt: 0,
      alcoholAftertaste: 0,
    },
    activeSessionFacts: [],
    acceptedRemarks: [],
    visibleFacts: [],
    activeFlags: [],
    toneMode: "gothic_mystery",
    locale: "ru",
  } as const;

  it("accepts DM turn payloads with a structured regenerationContext", () => {
    const payload = parseGenerateDmTurnPayload(
      JSON.stringify({
        ...baseDmTurnPayload,
        regenerationContext: {
          previousOutput: "Прошлая слабая наррация.",
          authorFeedback: "Усиль напряжение и убери клише.",
          rating: 3,
          qualityIssues: ["pacing", "cliche"],
        },
      }),
    );

    expect(payload?.regenerationContext?.previousOutput).toBe(
      "Прошлая слабая наррация.",
    );
    expect(payload?.regenerationContext?.rating).toBe(3);
  });

  it("accepts DM turn payloads without a regenerationContext", () => {
    const payload = parseGenerateDmTurnPayload(
      JSON.stringify(baseDmTurnPayload),
    );

    expect(payload?.regenerationContext).toBeUndefined();
  });

  it("rejects DM turn payloads carrying an unknown extra key", () => {
    const payload = parseGenerateDmTurnPayload(
      JSON.stringify({ ...baseDmTurnPayload, bogusExtraKey: true }),
    );

    expect(payload).toBeNull();
  });

  it("rejects a malformed regenerationContext", () => {
    const payload = parseGenerateDmTurnPayload(
      JSON.stringify({
        ...baseDmTurnPayload,
        regenerationContext: { previousOutput: 42 },
      }),
    );

    expect(payload).toBeNull();
  });

  it("parses DM proposals with review-only session canon", () => {
    const proposal = parseDmTurnProposal(
      JSON.stringify({
        narration:
          "Карл бледнеет и смотрит на дверь кладовой так, будто там стоит третий собеседник.",
        checks: [
          {
            id: "dm_check_karl_pressure",
            label: "Дожать Карла",
            voiceId: "attr_social",
            difficulty: 11,
            moveTags: ["coercive"],
          },
        ],
        sessionFacts: [
          {
            id: "session.karl.knows_pantry_route",
            text: "Karl knows a pantry route used after midnight.",
            scope: "session",
            source: "dm",
            status: "proposed",
          },
        ],
        suggestedStateDeltas: [
          {
            key: "witch_blood_curse_pressure",
            kind: "add_var",
            value: 10,
            reason: "Veil pressure rises during intimidation.",
          },
        ],
        risks: ["Karl may warn the Baroness if released too quickly."],
        toneMode: "gothic_mystery",
        canonRemarks: ["Session fact must be accepted before use."],
        resourceCosts: {
          fate: 1,
          fortune: 1,
        },
      }),
    );

    expect(proposal?.sessionFacts[0]?.scope).toBe("session");
    expect(proposal?.suggestedStateDeltas[0]?.key).toBe(
      "witch_blood_curse_pressure",
    );
  });

  it("rejects DM proposals that try to mutate immutable canon directly", () => {
    const proposal = parseDmTurnProposal(
      JSON.stringify({
        narration: "The DM tries to solve the case directly.",
        checks: [],
        sessionFacts: [],
        suggestedStateDeltas: [
          {
            key: "case_resolved",
            kind: "set_flag",
            value: true,
            reason: "This would mutate authored canon.",
          },
        ],
        risks: [],
        toneMode: "gothic_mystery",
        canonRemarks: [],
      }),
    );

    expect(proposal).toBeNull();
    expect(isAllowedDmStateDeltaKey("overlay.session.fact")).toBe(true);
    expect(isAllowedDmStateDeltaKey("case_resolved")).toBe(false);
  });
});
