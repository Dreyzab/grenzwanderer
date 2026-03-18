import { describe, expect, it } from "vitest";

import {
  AI_CHARACTER_REACTION_SOURCE_VN_SCENE,
  AI_DIALOGUE_SOURCE_SKILL_CHECK,
  parseCharacterReactionProposal,
  parseGenerateCharacterReactionPayload,
  parseGenerateDialogueEnvelope,
  parseGenerateDialoguePayload,
  parseGenerateDialogueResponse,
} from "./contracts";

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
        ensemble: {
          mode: "duet",
          peerVoiceIds: ["attr_logic", "attr_empathy", "attr_perception"],
        },
      }),
    );

    expect(payload?.ensemble?.mode).toBe("duet");
    expect(payload?.ensemble?.peerVoiceIds).toHaveLength(3);
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

  it("parses future character reaction payloads", () => {
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

  it("parses future character reaction proposals", () => {
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
});
