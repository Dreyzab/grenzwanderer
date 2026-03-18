import { describe, expect, it, vi } from "vitest";

import {
  buildActiveSnapshotQuery,
  buildPlayerFlagQuery,
  buildPlayerQuestQuery,
  buildPlayerVarQuery,
  buildRecentDialogueQuery,
  buildSceneContext,
} from "./ai-context-builder";
import { AI_DIALOGUE_SOURCE_SKILL_CHECK } from "../src/features/ai/contracts";
import { createHypothesisFocusFlagKey } from "../src/features/mindpalace/focusLens";
import { createTestSnapshot } from "../src/features/vn/snapshotTestUtils";
import type { GenerateDialoguePayload } from "../src/features/ai/contracts";

const fixturePayload: GenerateDialoguePayload = {
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
  outcomeGrade: "success",
  voicePresenceMode: "text_variability",
  activeSpeakers: ["attr_social"],
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
      margin: 5,
      breakdown: [
        { source: "voice", sourceId: "attr_social", delta: 3 },
        { source: "preparation", sourceId: "tailor_dossier", delta: 2 },
      ],
    },
    ensemble: {
      presenceMode: "parliament",
      activeSpeakers: ["attr_social", "attr_logic"],
    },
  },
};

const jsonResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

describe("ai-context-builder", () => {
  it("builds player-scoped SQL queries", () => {
    expect(buildRecentDialogueQuery("player-hex")).toContain(
      "WHERE player_id = 'player-hex'",
    );
    expect(buildPlayerQuestQuery("player-hex")).toContain(
      "WHERE player_id = 'player-hex'",
    );
    expect(buildPlayerFlagQuery("player-hex")).toContain(
      "WHERE player_id = 'player-hex'",
    );
    expect(buildPlayerVarQuery("player-hex")).toContain(
      "WHERE player_id = 'player-hex'",
    );
    expect(buildActiveSnapshotQuery()).toContain("FROM content_snapshot cs");
    expect(buildActiveSnapshotQuery()).toContain("JOIN content_version cv");
  });

  it("builds scene context with filtered dialogue history and quest overlap", async () => {
    const snapshot = createTestSnapshot({
      scenarios: [
        {
          id: "dog_case_intro",
          title: "Dog Case Intro",
          startNodeId: "node_tailor_audit",
          nodeIds: ["node_tailor_audit"],
        },
      ],
      nodes: [
        {
          id: "node_tailor_audit",
          scenarioId: "dog_case_intro",
          title: "Tailor Audit",
          body: "The room smells like steam, ink, and fear.",
          characterId: "char_tailor",
          choices: [],
        },
      ],
      map: {
        defaultRegionId: "FREIBURG_1905",
        regions: [
          {
            id: "FREIBURG_1905",
            name: "Freiburg",
            geoCenterLat: 47.9959,
            geoCenterLng: 7.8522,
            zoom: 14.2,
          },
        ],
        points: [
          {
            id: "point_tailor_shop",
            title: "Tailor Shop",
            regionId: "FREIBURG_1905",
            lat: 47.0,
            lng: 7.0,
            category: "PUBLIC",
            locationId: "loc_tailor",
            bindings: [
              {
                id: "binding_tailor_intro",
                trigger: "card_primary",
                label: "Enter",
                priority: 1,
                intent: "interaction",
                actions: [
                  {
                    type: "start_scenario",
                    scenarioId: "dog_case_intro",
                  },
                ],
              },
            ],
          },
        ],
      },
      questCatalog: [
        {
          id: "quest_dog",
          title: "Dog Case",
          stages: [
            {
              stage: 1,
              title: "Tailor Lead",
              objectiveHint: "Press the tailor about the missing ledger.",
              objectivePointIds: ["point_tailor_shop"],
            },
          ],
        },
      ],
      mindPalace: {
        cases: [
          {
            id: "case_hidden_signals",
            title: "Hidden Signals",
          },
        ],
        facts: [],
        hypotheses: [
          {
            id: "hyp_hidden_echo_threshold",
            caseId: "case_hidden_signals",
            key: "case01_occult_occult_proven",
            text: "A threshold-bound echo is nesting in Freiburg's blind spots.",
            requiredFactIds: [],
            requiredVars: [],
            rewardEffects: [],
          },
        ],
        thoughts: [],
      },
    });

    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse([
          {
            payload_json: JSON.stringify(fixturePayload),
            response_json: JSON.stringify({
              text: "Keep him talking. He wants the room calm.",
              canonicalVoiceId: "charisma",
            }),
            updated_at: new Date().toISOString(),
          },
          {
            payload_json: JSON.stringify({
              ...fixturePayload,
              scenarioId: "other_case_intro",
            }),
            response_json: JSON.stringify({
              text: "Wrong scenario line.",
              canonicalVoiceId: "logic",
            }),
            updated_at: new Date().toISOString(),
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            quest_id: "quest_dog",
            stage: 1,
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          { key: "origin_journalist", value: true },
          { key: "track_whistleblower_selected", value: true },
          { key: "case01_occult_archive_entry_pending", value: true },
          {
            key: createHypothesisFocusFlagKey(
              "case_hidden_signals",
              "hyp_hidden_echo_threshold",
            ),
            value: true,
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          { key: "mystic_awakening", float_value: 61 },
          { key: "mystic_exposure", float_value: 2 },
          { key: "mystic_sight_mode_tier", float_value: 1 },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            checksum: "snapshot-1",
            payload_json: JSON.stringify(snapshot),
          },
        ]),
      );

    const context = await buildSceneContext(
      { playerId: "player-hex" },
      fixturePayload,
      {
        fetchImpl,
        host: "http://127.0.0.1:3000",
        database: "grezwandererdata",
        token: "operator-token",
        staleThresholdHours: 48,
      },
    );

    expect(context.sceneSnapshot).toContain("Dog Case Intro");
    expect(context.sceneSnapshot).toContain("Tailor Audit");
    expect(context.sceneSnapshot).toContain("Outcome: critical success");
    expect(context.sceneSnapshot).toContain("Outcome margin: 5");
    expect(context.sceneSnapshot).toContain("Journalist Origin");
    expect(context.sceneSnapshot).toContain("Whistleblower");
    expect(context.sceneSnapshot).toContain("Voice presence: parliament");
    expect(context.sceneSnapshot).toContain(
      "Active speakers: attr_social, attr_logic",
    );
    expect(context.sceneSnapshot).toContain(
      "Hidden-layer status: archive verification pending",
    );
    expect(context.sceneSnapshot).toContain("Route step: archive verification");
    expect(context.sceneSnapshot).toContain(
      "Occult exposure: Awakening opening (61/100), exposure 2, sight sensitive",
    );
    expect(context.sceneSnapshot).toContain(
      "Active hypothesis: Hidden Signals -> A threshold-bound echo is nesting in Freiburg's blind spots.",
    );
    expect(context.recentDialogue).toEqual([
      "Keep him talking. He wants the room calm.",
    ]);
    expect(context.activeQuestSummary).toContain("Dog Case");
    expect(context.activeQuestSummary).toContain("Tailor Lead");
    expect(context.originProfileId).toBe("journalist");
    expect(context.selectedTrackId).toBe("journalist_whistleblower");
    expect(context.parliamentPresetId).toBe("journalist_cityroom");
    expect(context.routeStep).toBe("archive verification");
    expect(context.occultExposure).toContain("Awakening opening");
  });

  it("degrades to empty enrichment when authored overlap is missing", async () => {
    const snapshot = createTestSnapshot();
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            checksum: "snapshot-2",
            payload_json: JSON.stringify(snapshot),
          },
        ]),
      );

    const context = await buildSceneContext(
      { playerId: "player-hex" },
      fixturePayload,
      {
        fetchImpl,
        host: "http://127.0.0.1:3000",
        database: "grezwandererdata",
        token: "operator-token",
      },
    );

    expect(context.recentDialogue).toEqual([]);
    expect(context.activeQuestSummary).toBe("");
    expect(context.sceneSnapshot).toContain("Tailor Shop");
  });
});
