import { describe, expect, it } from "vitest";
import { buildPsycheProfile } from "./features/character/psycheProfile";
import { isChoiceAvailable, parseSnapshot } from "./features/vn/vnContent";

describe("pilot helpers", () => {
  it("builds contested alignment when reputations are close", () => {
    const profile = buildPsycheProfile({
      flags: {},
      vars: {
        rep_civic: 2.5,
        rep_underworld: 2.2,
      },
    });

    expect(profile.alignment.tier).toBe("contested");
  });

  it("parses snapshot payload and validates choices", () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        schemaVersion: 1,
        scenarios: [
          {
            id: "sc_a",
            title: "Scenario A",
            startNodeId: "node_a",
            nodeIds: ["node_a"],
          },
        ],
        nodes: [
          {
            id: "node_a",
            scenarioId: "sc_a",
            title: "Node A",
            body: "Body",
            choices: [
              {
                id: "c1",
                text: "Choice",
                nextNodeId: "node_a",
                conditions: [
                  {
                    type: "flag_equals",
                    key: "has_key",
                    value: true,
                  },
                ],
              },
            ],
          },
        ],
      }),
    );

    expect(parsed).not.toBeNull();
    const choice = parsed?.nodes[0].choices[0];
    expect(choice).toBeDefined();
    if (!choice) {
      return;
    }

    expect(isChoiceAvailable(choice, { has_key: true }, {})).toBe(true);
    expect(isChoiceAvailable(choice, { has_key: false }, {})).toBe(false);
  });

  it("parses schema v2 snapshot with mindPalace payload", () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        schemaVersion: 2,
        scenarios: [],
        nodes: [],
        mindPalace: {
          cases: [{ id: "case_1", title: "Case 1" }],
          facts: [
            {
              id: "fact_1",
              caseId: "case_1",
              sourceType: "vn_choice",
              sourceId: "scenario::node::choice",
              text: "Fact text",
            },
          ],
          hypotheses: [
            {
              id: "hyp_1",
              caseId: "case_1",
              key: "k1",
              text: "Hypothesis",
              requiredFactIds: ["fact_1"],
              requiredVars: [{ key: "v1", op: "gte", value: 1 }],
              rewardEffects: [
                {
                  type: "discover_fact",
                  caseId: "case_1",
                  factId: "fact_1",
                },
              ],
            },
          ],
        },
      }),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.schemaVersion).toBe(2);
    expect(parsed?.mindPalace?.cases).toHaveLength(1);
    expect(parsed?.mindPalace?.hypotheses).toHaveLength(1);
  });

  it("validates choice with new condition types (evidence, quest, relationship)", () => {
    const choice = {
      id: "c1",
      text: "Choice",
      nextNodeId: "node_x",
      conditions: [
        { type: "has_evidence", evidenceId: "ev_1" },
        { type: "quest_stage_gte", questId: "q_1", stage: 2 },
        { type: "relationship_gte", characterId: "char_1", value: 10 },
      ],
    } as const;

    // Note: The frontend isChoiceAvailable currently only checks flags and vars
    // for local preview purposes. We'll verify it doesn't crash and returns false
    // for unsupported conditions without a proper context.

    // In actual implementation, these conditions are evaluated on the backend
    // using the player's SpacetimeDB state (Evidence, Quest, Relationship tables).

    // Test that the frontend local evaluator safely denies the choice if it can't
    // evaluate the condition (which it currently can't for these new types).
    expect(isChoiceAvailable(choice as any, {}, {})).toBe(false);
  });

  it("parses optional completionRoute for scenario handoff", () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        schemaVersion: 2,
        scenarios: [
          {
            id: "sandbox_intro_pilot",
            title: "Intro",
            startNodeId: "scene_start",
            nodeIds: ["scene_start"],
            completionRoute: {
              nextScenarioId: "intro_journalist",
              requiredFlagsAll: ["origin_journalist"],
              blockedIfFlagsAny: ["met_anna_intro"],
            },
          },
        ],
        nodes: [
          {
            id: "scene_start",
            scenarioId: "sandbox_intro_pilot",
            title: "Start",
            body: "Body",
            terminal: true,
            choices: [],
          },
        ],
        mindPalace: { cases: [], facts: [], hypotheses: [] },
      }),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.scenarios[0].completionRoute?.nextScenarioId).toBe(
      "intro_journalist",
    );
  });

  it("parses vnRuntime.defaultEntryScenarioId", () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        schemaVersion: 2,
        scenarios: [
          {
            id: "sandbox_case01_pilot",
            title: "Case 01",
            startNodeId: "scene_intro_journey",
            nodeIds: ["scene_intro_journey"],
          },
        ],
        nodes: [
          {
            id: "scene_intro_journey",
            scenarioId: "sandbox_case01_pilot",
            title: "Start",
            body: "Body",
            choices: [],
          },
        ],
        vnRuntime: {
          defaultEntryScenarioId: "sandbox_case01_pilot",
        },
        mindPalace: { cases: [], facts: [], hypotheses: [] },
      }),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.vnRuntime?.defaultEntryScenarioId).toBe(
      "sandbox_case01_pilot",
    );
  });

  it("rejects malformed completionRoute payloads", () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        schemaVersion: 2,
        scenarios: [
          {
            id: "sandbox_intro_pilot",
            title: "Intro",
            startNodeId: "scene_start",
            nodeIds: ["scene_start"],
            completionRoute: {
              nextScenarioId: 777,
            },
          },
        ],
        nodes: [
          {
            id: "scene_start",
            scenarioId: "sandbox_intro_pilot",
            title: "Start",
            body: "Body",
            choices: [],
          },
        ],
        mindPalace: { cases: [], facts: [], hypotheses: [] },
      }),
    );

    expect(parsed).toBeNull();
  });

  it("parses journalist origin scenario with branching choices and effects", () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        schemaVersion: 2,
        scenarios: [
          {
            id: "intro_journalist",
            title: "Cafe Riegler – News & Nerves",
            startNodeId: "scene_journalist_intro",
            nodeIds: [
              "scene_journalist_intro",
              "scene_journalist_shivers",
              "scene_journalist_key_secret",
              "scene_journalist_messenger",
              "scene_journalist_show_telegram",
              "scene_journalist_anna_tip",
              "scene_journalist_exit",
            ],
          },
        ],
        nodes: [
          {
            id: "scene_journalist_intro",
            scenarioId: "intro_journalist",
            title: "Cafe Riegler",
            body: "Opening scene",
            choices: [
              {
                id: "JOURNALIST_SHIVERS_CHECK",
                text: "Shivers",
                nextNodeId: "scene_journalist_shivers",
              },
              {
                id: "JOURNALIST_SELECTIVE_EXCAVATION",
                text: "Excavation",
                nextNodeId: "scene_journalist_key_secret",
              },
            ],
          },
          {
            id: "scene_journalist_shivers",
            scenarioId: "intro_journalist",
            title: "Shivers",
            body: "Shivers realization",
            choices: [
              {
                id: "JOURNALIST_SHIVERS_CONTINUE",
                text: "Continue",
                nextNodeId: "scene_journalist_key_secret",
              },
            ],
          },
          {
            id: "scene_journalist_key_secret",
            scenarioId: "intro_journalist",
            title: "Key Secret",
            body: "Key secret",
            choices: [
              {
                id: "JOURNALIST_KEY_SECRET_CONTINUE",
                text: "Continue",
                nextNodeId: "scene_journalist_messenger",
              },
            ],
          },
          {
            id: "scene_journalist_messenger",
            scenarioId: "intro_journalist",
            title: "Messenger",
            body: "Messenger arrival",
            choices: [
              {
                id: "JOURNALIST_SHOW_SEAL",
                text: "Show seal",
                nextNodeId: "scene_journalist_show_telegram",
                skillCheck: {
                  id: "check_journalist_show_seal",
                  voiceId: "attr_deception",
                  difficulty: 12,
                  onSuccess: {
                    nextNodeId: "scene_journalist_show_telegram",
                    effects: [
                      {
                        type: "change_relationship",
                        characterId: "npc_anna_mahler",
                        delta: 15,
                      },
                      {
                        type: "set_flag",
                        key: "anna_knows_secret",
                        value: true,
                      },
                    ],
                  },
                  onFail: {
                    nextNodeId: "scene_journalist_exit",
                    effects: [{ type: "add_heat", amount: 1 }],
                  },
                },
              },
              {
                id: "JOURNALIST_HIDE_SEAL",
                text: "Hide seal",
                nextNodeId: "scene_journalist_exit",
              },
            ],
          },
          {
            id: "scene_journalist_show_telegram",
            scenarioId: "intro_journalist",
            title: "Show Telegram",
            body: "Show telegram",
            choices: [
              {
                id: "JOURNALIST_TELEGRAM_CONTINUE",
                text: "Continue",
                nextNodeId: "scene_journalist_anna_tip",
              },
            ],
          },
          {
            id: "scene_journalist_anna_tip",
            scenarioId: "intro_journalist",
            title: "Anna Tip",
            body: "Anna tip",
            onEnter: [
              { type: "grant_evidence", evidenceId: "ev_bank_master_key" },
            ],
            choices: [
              {
                id: "JOURNALIST_TIP_CONTINUE",
                text: "Continue",
                nextNodeId: "scene_journalist_exit",
              },
            ],
          },
          {
            id: "scene_journalist_exit",
            scenarioId: "intro_journalist",
            title: "Exit",
            body: "Exit scene",
            terminal: true,
            onEnter: [
              { type: "set_flag", key: "met_anna_intro", value: true },
              { type: "unlock_group", groupId: "loc_ka_rathaus" },
            ],
            choices: [],
          },
        ],
        mindPalace: { cases: [], facts: [], hypotheses: [] },
      }),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.scenarios).toHaveLength(1);
    expect(parsed?.nodes).toHaveLength(7);

    // Branching: intro has 2 choices
    const introNode = parsed?.nodes.find(
      (n) => n.id === "scene_journalist_intro",
    );
    expect(introNode?.choices).toHaveLength(2);

    // Terminal node
    const exitNode = parsed?.nodes.find(
      (n) => n.id === "scene_journalist_exit",
    );
    expect(exitNode?.terminal).toBe(true);

    // Messenger branch: show_seal is now skill-check driven
    const messengerNode = parsed?.nodes.find(
      (n) => n.id === "scene_journalist_messenger",
    );
    const showSeal = messengerNode?.choices.find(
      (c) => c.id === "JOURNALIST_SHOW_SEAL",
    );
    expect(showSeal?.skillCheck?.id).toBe("check_journalist_show_seal");
    expect(showSeal?.skillCheck?.onSuccess?.effects).toHaveLength(2);

    // Anna tip node grants evidence via onEnter
    const annaTipNode = parsed?.nodes.find(
      (n) => n.id === "scene_journalist_anna_tip",
    );
    expect(annaTipNode?.onEnter).toHaveLength(1);
    expect((annaTipNode?.onEnter?.[0] as any)?.type).toBe("grant_evidence");
  });
});
