import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { CONTENT_IDS } from "./content-ids";
import { FREIBURG_SOCIAL_CATALOG } from "./data/freiburg_social_catalog";
import { PACK_FREIBURG_GHOST_NODES } from "./data/vn-packs/pack_freiburg_ghost";
import { CASE01_CANON_NODES } from "./data/case01_canon_runtime";
import {
  buildOriginChoiceEffects,
  originProfiles,
} from "../src/features/character/originProfiles";

const getNode = (nodeId: string) => {
  const node = CASE01_CANON_NODES.find((entry) => entry.id === nodeId);
  expect(node, `missing node ${nodeId}`).toBeDefined();
  return node!;
};

const targetFiles = [
  "scripts/data/case01/nodes-arrival.ts",
  "scripts/data/case01_canon_runtime.ts",
  "scripts/data/vn-packs/pack_freiburg_ghost.ts",
  "obsidian/StoryDetective/40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_conclusion_true.md",
  "obsidian/StoryDetective/40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_conclusion_false.md",
];

const mojibakeMarkers = ["\u00d0", "\u00c2", "\u00f0\u0178", "\u00e2\u20ac"];

describe("witch one-shot content", () => {
  it("does not contain mojibake markers in Witch Bureau or Ghost runtime text", () => {
    for (const filePath of targetFiles) {
      const text = readFileSync(filePath, "utf8");
      for (const marker of mojibakeMarkers) {
        expect(text, `${filePath} contains ${marker}`).not.toContain(marker);
      }
    }
  });

  it("registers Witch onboarding compartment letter and station exit incident choices correctly", () => {
    const compartmentLetterNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_train_compartment_letter_witch",
    );
    expect(compartmentLetterNode).toBeDefined();
    expect(compartmentLetterNode?.choices.map((choice) => choice.id)).toEqual(
      expect.arrayContaining([
        "WITCH_LETTER_VEIL_FOCUS",
        "WITCH_LETTER_DRINK_BRANDY",
        "WITCH_LETTER_OPEN_MUNDANE",
      ]),
    );

    const assistantIntroWitchNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_train_assistant_intro_witch",
    );
    expect(assistantIntroWitchNode).toBeDefined();
    expect(assistantIntroWitchNode?.choices.map((choice) => choice.id)).toEqual(
      expect.arrayContaining(["WITCH_TRAIN_ADJUST_SCARF"]),
    );
    expect(
      assistantIntroWitchNode?.choices.find(
        (c) => c.id === "WITCH_TRAIN_ADJUST_SCARF",
      )?.nextNodeId,
    ).toBe("scene_case01_train_dining_car_intro_witch");

    const diningCarIntroWitchNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_train_dining_car_intro_witch",
    );
    expect(diningCarIntroWitchNode).toBeDefined();
    expect(diningCarIntroWitchNode?.choices.map((choice) => choice.id)).toEqual(
      expect.arrayContaining([
        "WITCH_LOTTE_INTRO_RATIONAL",
        "WITCH_LOTTE_INTRO_SOMATIC",
        "WITCH_LOTTE_INTRO_MARRIAGE",
      ]),
    );

    const diningCarMonologueWitchNode = CASE01_CANON_NODES.find(
      (node) =>
        node.id === "scene_case01_train_dining_car_lotte_monologue_witch",
    );
    expect(diningCarMonologueWitchNode).toBeDefined();
    expect(
      diningCarMonologueWitchNode?.choices.map((choice) => choice.id),
    ).toEqual(
      expect.arrayContaining([
        "WITCH_LOTTE_MONOLOGUE_CYNIC",
        "WITCH_LOTTE_MONOLOGUE_GRIEF",
        "WITCH_LOTTE_MONOLOGUE_PRACTICAL",
      ]),
    );

    const vozaCutsceneNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_train_voza_cutscene",
    );
    expect(vozaCutsceneNode).toBeDefined();
    expect(vozaCutsceneNode?.choices.map((choice) => choice.id)).toEqual(
      expect.arrayContaining([
        "CHOICE_VOZA_TO_HBF_DETECTIVE",
        "CHOICE_VOZA_TO_HBF_WITCH",
      ]),
    );

    const platformIncidentNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_hbf_luggage_incident_witch",
    );
    expect(platformIncidentNode).toBeDefined();
    expect(platformIncidentNode?.choices.map((choice) => choice.id)).toEqual(
      expect.arrayContaining([
        "WITCH_HBF_BLOOD_ABSORB",
        "WITCH_HBF_BLOOD_IGNORE",
      ]),
    );

    const masterMeetingNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_witch_bureau_master_meeting",
    );
    expect(masterMeetingNode).toBeDefined();
    expect(masterMeetingNode?.choices.map((choice) => choice.id)).toEqual(
      expect.arrayContaining([
        "WITCH_BUREAU_MASTER_DRINK_SUPPRESSANT",
        "WITCH_BUREAU_MASTER_SIPHON_RELIC",
        "WITCH_BUREAU_MASTER_COMPOSURE",
      ]),
    );

    const estateHandoffNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_witch_estate_handoff",
    );
    expect(estateHandoffNode).toBeDefined();
    expect(estateHandoffNode?.choices.map((c) => c.id)).toContain(
      "AUTO_CONTINUE_WITCH_ESTATE_HANDOFF",
    );
  });

  it("registers Grand Estate, vaults, ghost, night alley, and hotel morning nodes correctly", () => {
    const estateArrivalNode = CASE01_CANON_NODES.find(
      (n) => n.id === "scene_case01_estate_arrival_witch",
    );
    expect(estateArrivalNode).toBeDefined();
    expect(estateArrivalNode?.choices.map((c) => c.id)).toContain(
      "AUTO_CONTINUE_ESTATE_ARRIVAL_WITCH",
    );

    const baronessOfficeNode = CASE01_CANON_NODES.find(
      (n) => n.id === "scene_case01_baroness_office_witch",
    );
    expect(baronessOfficeNode).toBeDefined();
    expect(baronessOfficeNode?.choices.map((c) => c.id)).toEqual(
      expect.arrayContaining(["WITCH_BARONESS_PRESS", "WITCH_BARONESS_BRIBE"]),
    );

    const baronessOfficeCutNode = CASE01_CANON_NODES.find(
      (n) => n.id === "scene_case01_baroness_office_cut_trigger",
    );
    expect(baronessOfficeCutNode).toBeDefined();
    expect(baronessOfficeCutNode?.choices.map((c) => c.id)).toEqual(
      expect.arrayContaining([
        "WITCH_BARONESS_RESIST_SUPPRESSANT",
        "WITCH_BARONESS_RESIST_RELIC",
        "WITCH_BARONESS_FEED",
      ]),
    );

    const officeFeedCoverupNode = CASE01_CANON_NODES.find(
      (n) => n.id === "scene_case01_baroness_office_feed_coverup",
    );
    expect(officeFeedCoverupNode).toBeDefined();
    expect(officeFeedCoverupNode?.choices.map((c) => c.id)).toEqual(
      expect.arrayContaining([
        "WITCH_BARONESS_COVER_PROTOCOL",
        "WITCH_BARONESS_COVER_SUGGESTION",
      ]),
    );

    const estateVaultsNode = CASE01_CANON_NODES.find(
      (n) => n.id === "scene_case01_estate_vaults_witch",
    );
    expect(estateVaultsNode).toBeDefined();
    expect(estateVaultsNode?.choices.map((c) => c.id)).toEqual(
      expect.arrayContaining([
        "WITCH_VAULTS_FEED_RATS",
        "WITCH_VAULTS_FEED_KARL",
        "WITCH_VAULTS_PROCEED_COLD",
      ]),
    );

    const ghostShowdownNode = CASE01_CANON_NODES.find(
      (n) => n.id === "scene_case01_ghost_showdown_witch",
    );
    expect(ghostShowdownNode).toBeDefined();
    expect(ghostShowdownNode?.choices.map((c) => c.id)).toEqual(
      expect.arrayContaining([
        "WITCH_GHOST_JUSTICE",
        "WITCH_GHOST_SUBJUGATE",
        "WITCH_GHOST_BANISH",
      ]),
    );

    const nightAlleyNode = CASE01_CANON_NODES.find(
      (n) => n.id === "scene_case01_night_alley_witch",
    );
    expect(nightAlleyNode).toBeDefined();
    expect(nightAlleyNode?.choices.map((c) => c.id)).toEqual(
      expect.arrayContaining(["WITCH_MUGGER_PAYOFF", "WITCH_MUGGER_THREATEN"]),
    );

    const nightAlleyEscalationNode = CASE01_CANON_NODES.find(
      (n) => n.id === "scene_case01_night_alley_escalation",
    );
    expect(nightAlleyEscalationNode).toBeDefined();
    expect(nightAlleyEscalationNode?.choices.map((c) => c.id)).toEqual(
      expect.arrayContaining(["WITCH_MUGGER_SIPHON_BREAK"]),
    );

    const hotelMorningNode = CASE01_CANON_NODES.find(
      (n) => n.id === "scene_case01_hotel_morning_witch",
    );
    expect(hotelMorningNode).toBeDefined();
    expect(hotelMorningNode?.choices.map((c) => c.id)).toEqual(
      expect.arrayContaining([
        "WITCH_MORNING_BRIBE_MAID",
        "WITCH_MORNING_SORCERY_CLEANSE",
      ]),
    );
  });

  it("uses location-correct Witch VN backgrounds and scene groups", () => {
    expect(getNode("scene_case01_witch_estate_handoff")).toMatchObject({
      backgroundUrl: "/images/scenes/case01/bg_case01_estate_approach.webp",
      sceneGroupId: "witch_grand_estate",
    });
    expect(getNode("scene_case01_estate_arrival_witch")).toMatchObject({
      backgroundUrl: "/images/scenes/case01/bg_case01_estate_gates.webp",
      sceneGroupId: "witch_grand_estate",
    });
    for (const nodeId of [
      "scene_case01_baroness_office_witch",
      "scene_case01_baroness_office_cut_trigger",
      "scene_case01_baroness_office_feed_coverup",
    ]) {
      expect(getNode(nodeId)).toMatchObject({
        backgroundUrl: "/images/scenes/case01/bg_case01_baroness_study.webp",
        characterId: "npc_baroness_elise",
        sceneGroupId: "witch_grand_estate",
      });
    }
    expect(getNode("scene_case01_estate_vaults_witch")).toMatchObject({
      backgroundUrl: "/images/scenes/case01/bg_case01_estate_vaults.webp",
      characterId: "npc_karl_servant",
      sceneGroupId: "witch_grand_estate",
    });
    expect(getNode("scene_case01_ghost_showdown_witch")).toMatchObject({
      backgroundUrl: "/images/scenes/case01/bg_case01_ghost_cellar.webp",
      characterId: "npc_friedrich_wagner",
      sceneGroupId: "witch_grand_estate",
    });
    for (const nodeId of [
      "scene_case01_night_alley_witch",
      "scene_case01_night_alley_escalation",
    ]) {
      expect(getNode(nodeId)).toMatchObject({
        backgroundUrl: "/images/scenes/case01/bg_case01_night_alley.webp",
        characterId: "npc_krebs_mugger",
        sceneGroupId: "witch_freiburg_night",
      });
    }
    for (const nodeId of [
      "scene_case01_hotel_morning_witch",
      "scene_case01_hotel_copper_trace_witch",
    ]) {
      expect(getNode(nodeId)).toMatchObject({
        backgroundUrl: "/images/scenes/case01/bg_case01_hotel_bedroom.webp",
        sceneGroupId: "witch_hotel_morning",
      });
    }
  });

  it("registers Witch-prologue NPC IDs and keeps Elise as runtime canon", () => {
    expect([...CONTENT_IDS.characterIds]).toEqual(
      expect.arrayContaining([
        "npc_bureau_master",
        "npc_karl_servant",
        "npc_friedrich_wagner",
        "npc_krebs_mugger",
        "npc_hotel_maid",
      ]),
    );

    const runtimeText = JSON.stringify(CASE01_CANON_NODES);
    expect(runtimeText).toContain("Элиза");
    expect(runtimeText).not.toContain("Клара");
    expect(runtimeText).not.toContain("Clara");
  });

  it("pins Witch origin pressure at the origin choice effect", () => {
    const witchProfile = originProfiles.find(
      (profile) => profile.choiceId === "BACKSTORY_WITCH",
    );
    expect(witchProfile).toBeDefined();
    expect(buildOriginChoiceEffects(witchProfile!)).toEqual(
      expect.arrayContaining([
        {
          type: "set_var",
          key: "witch_blood_curse_pressure",
          value: 35,
        },
      ]),
    );
  });

  it("applies Heat +2 only on the mugger siphon failure branch", () => {
    const muggerChoice = getNode(
      "scene_case01_night_alley_escalation",
    ).choices.find((choice) => choice.id === "WITCH_MUGGER_SIPHON_BREAK");

    expect(muggerChoice?.skillCheck?.id).toBe("check_mugger_siphon_break");
    expect(muggerChoice?.skillCheck?.onSuccess?.effects).not.toEqual(
      expect.arrayContaining([{ type: "add_heat", amount: 2 }]),
    );
    expect(muggerChoice?.skillCheck?.onFail?.effects).toEqual(
      expect.arrayContaining([
        { type: "set_flag", key: "flag_witch_mugger_killed", value: true },
        { type: "add_heat", amount: 2 },
      ]),
    );
  });

  it("connects the copper-smell flag to a later Felix perception check", () => {
    const hotelNode = getNode("scene_case01_hotel_morning_witch");
    const sorceryChoice = hotelNode.choices.find(
      (choice) => choice.id === "WITCH_MORNING_SORCERY_CLEANSE",
    );
    expect(sorceryChoice?.effects).toEqual(
      expect.arrayContaining([
        { type: "set_flag", key: "flag_witch_copper_smell", value: true },
      ]),
    );
    expect(sorceryChoice?.nextNodeId).toBe(
      "scene_case01_hotel_copper_trace_witch",
    );

    const copperNode = getNode("scene_case01_hotel_copper_trace_witch");
    const copperChoice = copperNode.choices.find(
      (choice) => choice.id === "WITCH_HOTEL_COPPER_TRACE_STEADY",
    );
    expect(copperChoice?.visibleIfAll).toEqual([
      { type: "flag_equals", key: "flag_witch_copper_smell", value: true },
    ]);
    expect(copperChoice?.skillCheck?.id).toBe("check_witch_felix_copper_smell");
    expect(copperChoice?.skillCheck?.onFail?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "set_flag",
          key: "flag_witch_felix_noticed_copper_smell",
          value: true,
        },
      ]),
    );
  });

  it("routes Witch hotel exit through the Adler lobby POV-crossover before HBF exit", () => {
    const copperNode = getNode("scene_case01_hotel_copper_trace_witch");
    for (const choice of copperNode.choices) {
      expect(choice.nextNodeId).toBe("scene_case01_lobby_crossover_witch");
      if (choice.skillCheck) {
        expect(choice.skillCheck.onSuccess?.nextNodeId).toBe(
          "scene_case01_lobby_crossover_witch",
        );
        const failBranch =
          choice.skillCheck.onFail ?? choice.skillCheck.onFailure;
        expect(failBranch?.nextNodeId).toBe(
          "scene_case01_lobby_crossover_witch",
        );
      }
    }

    const lobbyWitchNode = getNode("scene_case01_lobby_crossover_witch");
    expect(lobbyWitchNode.choices.map((c) => c.id)).toEqual(
      expect.arrayContaining([
        "WITCH_LOBBY_VEIL_SIGHT",
        "WITCH_LOBBY_COMPOSED_PASS",
        "WITCH_LOBBY_COMPOSED_PASS_COPPER",
        "WITCH_LOBBY_GREET",
      ]),
    );
    for (const choice of lobbyWitchNode.choices) {
      expect(choice.nextNodeId).toBe("scene_case01_hbf_exit_final");
    }

    const copperPassChoice = lobbyWitchNode.choices.find(
      (c) => c.id === "WITCH_LOBBY_COMPOSED_PASS_COPPER",
    );
    expect(copperPassChoice?.visibleIfAll).toEqual([
      { type: "flag_equals", key: "flag_witch_copper_smell", value: true },
    ]);
    expect(copperPassChoice?.skillCheck?.voiceId).toBe("attr_composure");
    expect(copperPassChoice?.skillCheck?.onFail?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "set_flag",
          key: "flag_lobby_crossover_seen_by_detective",
          value: true,
        },
      ]),
    );

    const greetChoice = lobbyWitchNode.choices.find(
      (c) => c.id === "WITCH_LOBBY_GREET",
    );
    expect(greetChoice?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "set_flag",
          key: "flag_lobby_crossover_seen_by_witch",
          value: true,
        },
        {
          type: "set_flag",
          key: "flag_lobby_crossover_seen_by_detective",
          value: true,
        },
      ]),
    );
  });

  it("opens the Detective Adler lodging into a morning lobby crossover beat", () => {
    const settleNode = getNode("scene_case01_zum_goldenen_adler_settle");
    expect(settleNode.terminal).not.toBe(true);
    expect(settleNode.choices.map((c) => c.id)).toContain(
      "CASE01_zum_goldenen_adler_SETTLE_TO_MORNING",
    );
    expect(settleNode.choices[0]?.nextNodeId).toBe(
      "scene_case01_zum_goldenen_adler_morning",
    );

    const morningNode = getNode("scene_case01_zum_goldenen_adler_morning");
    expect(morningNode.choices.map((c) => c.id)).toEqual(
      expect.arrayContaining([
        "DETECTIVE_LOBBY_OBSERVE",
        "DETECTIVE_LOBBY_NEWSPAPER",
        "DETECTIVE_LOBBY_GREET",
      ]),
    );
    for (const choice of morningNode.choices) {
      expect(choice.nextNodeId).toBe(
        "scene_case01_zum_goldenen_adler_morning_depart",
      );
      expect(choice.effects).toEqual(
        expect.arrayContaining([
          {
            type: "set_flag",
            key: "flag_lobby_crossover_seen_by_detective",
            value: true,
          },
        ]),
      );
    }

    const greetChoice = morningNode.choices.find(
      (c) => c.id === "DETECTIVE_LOBBY_GREET",
    );
    expect(greetChoice?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "set_flag",
          key: "flag_lobby_crossover_seen_by_witch",
          value: true,
        },
      ]),
    );

    const departNode = getNode(
      "scene_case01_zum_goldenen_adler_morning_depart",
    );
    expect(departNode.terminal).toBe(true);
    expect(departNode.choices).toEqual([]);
  });

  it("wires Bank Arrival consumers for lobby-crossover and Heat states", () => {
    const bankArrival = getNode("scene_case01_bank_arrival");

    const copperConsumer = bankArrival.choices.find(
      (c) => c.id === "CASE01_BANK_NOTE_LOBBY_COPPER",
    );
    expect(copperConsumer).toBeDefined();
    expect(copperConsumer?.visibleIfAll).toEqual(
      expect.arrayContaining([
        {
          type: "flag_equals",
          key: "flag_lobby_crossover_seen_by_detective",
          value: true,
        },
        { type: "flag_equals", key: "flag_witch_copper_smell", value: true },
      ]),
    );

    const heatConsumer = bankArrival.choices.find(
      (c) => c.id === "CASE01_BANK_OVERNIGHT_INCIDENT",
    );
    expect(heatConsumer).toBeDefined();
    expect(heatConsumer?.visibleIfAll).toEqual(
      expect.arrayContaining([{ type: "var_gte", key: "heat", value: 2 }]),
    );
  });

  it("adds Witch-specific Veil Sight and Blood Curse hooks to the Grand Estate", () => {
    const evidenceNode = PACK_FREIBURG_GHOST_NODES.find(
      (node) => node.id === "scene_evidence_collection",
    );

    expect(evidenceNode?.choices.map((choice) => choice.id)).toEqual(
      expect.arrayContaining([
        "GHOST_WITCH_VEIL_FOCUS",
        "GHOST_WITCH_BLOOD_TEMPTATION",
      ]),
    );
    expect(
      evidenceNode?.choices.find(
        (choice) => choice.id === "GHOST_WITCH_VEIL_FOCUS",
      )?.effects,
    ).toEqual(
      expect.arrayContaining([
        {
          type: "set_flag",
          key: "ghost_veil_resonance_seen",
          value: true,
        },
        {
          type: "add_var",
          key: "witch_blood_curse_pressure",
          value: 15,
        },
      ]),
    );
  });

  it("ships StoryDetective mini-dossiers for every Witch-prologue NPC", () => {
    const dossierDirectory = path.join(
      "obsidian",
      "StoryDetective",
      "40_GameViewer",
      "Case01",
      "_Characters",
    );
    const expectedDossiers: Array<{ file: string; runtimeId: string }> = [
      {
        file: "char_case01_bureau_master.md",
        runtimeId: "npc_bureau_master",
      },
      {
        file: "char_case01_karl_servant.md",
        runtimeId: "npc_karl_servant",
      },
      {
        file: "char_case01_friedrich_wagner.md",
        runtimeId: "npc_friedrich_wagner",
      },
      {
        file: "char_case01_krebs_mugger.md",
        runtimeId: "npc_krebs_mugger",
      },
      {
        file: "char_case01_hotel_maid.md",
        runtimeId: "npc_hotel_maid",
      },
    ];

    for (const dossier of expectedDossiers) {
      const absolutePath = path.join(dossierDirectory, dossier.file);
      expect(existsSync(absolutePath), `missing dossier ${absolutePath}`).toBe(
        true,
      );
      const markdown = readFileSync(absolutePath, "utf8");
      expect(markdown).toContain(`Runtime id**: \`${dossier.runtimeId}\``);
    }
  });

  it("extends the Freiburg social catalog with Witch-prologue intro flags, services, and the mugger survivor rumor", () => {
    const npcById = new Map(
      FREIBURG_SOCIAL_CATALOG.npcIdentities.map((entry) => [entry.id, entry]),
    );

    expect(npcById.get("npc_bureau_master")?.introFlag).toBe(
      "met_bureau_master_intro",
    );
    expect(npcById.get("npc_bureau_master")?.serviceIds).toEqual(
      expect.arrayContaining(["svc_bureau_occult_protocol"]),
    );

    expect(npcById.get("npc_karl_servant")?.introFlag).toBe(
      "met_karl_servant_intro",
    );
    expect(npcById.get("npc_karl_servant")?.serviceIds).toEqual(
      expect.arrayContaining(["svc_karl_service_corridors"]),
    );

    expect(npcById.get("npc_friedrich_wagner")?.introFlag).toBe(
      "met_friedrich_wagner_intro",
    );
    expect(npcById.get("npc_friedrich_wagner")?.serviceIds).toEqual(
      expect.arrayContaining(["svc_friedrich_ledger_memory"]),
    );

    expect(npcById.get("npc_krebs_mugger")?.introFlag).toBe(
      "met_krebs_mugger_intro",
    );

    expect(npcById.get("npc_hotel_maid")?.introFlag).toBe(
      "met_hotel_maid_intro",
    );
    expect(npcById.get("npc_hotel_maid")?.serviceIds).toEqual(
      expect.arrayContaining(["svc_hotel_discretion"]),
    );

    const serviceIds = new Set(
      FREIBURG_SOCIAL_CATALOG.services.map((entry) => entry.id),
    );
    expect(serviceIds.has("svc_bureau_occult_protocol")).toBe(true);
    expect(serviceIds.has("svc_karl_service_corridors")).toBe(true);
    expect(serviceIds.has("svc_friedrich_ledger_memory")).toBe(true);
    expect(serviceIds.has("svc_hotel_discretion")).toBe(true);

    const hotelDiscretion = FREIBURG_SOCIAL_CATALOG.services.find(
      (entry) => entry.id === "svc_hotel_discretion",
    );
    expect(hotelDiscretion?.unlockFlag).toBe("flag_witch_maid_bribed");

    const muggerRumor = FREIBURG_SOCIAL_CATALOG.rumors.find(
      (entry) => entry.id === "rumor_witch_mugger_survivor",
    );
    expect(muggerRumor).toMatchObject({
      caseId: "quest_banker",
      leadPointId: "loc_hbf",
      sourceNpcId: "npc_krebs_mugger",
      verifiesOn: ["flag_set"],
    });
  });

  it("sets Witch-prologue met_* intro flags on the first meeting of each NPC", () => {
    const introExpectations: Array<{ nodeId: string; flagKey: string }> = [
      {
        nodeId: "scene_case01_hbf_luggage_incident_witch",
        flagKey: "met_karl_servant_intro",
      },
      {
        nodeId: "scene_case01_witch_bureau_master_meeting",
        flagKey: "met_bureau_master_intro",
      },
      {
        nodeId: "scene_case01_ghost_showdown_witch",
        flagKey: "met_friedrich_wagner_intro",
      },
      {
        nodeId: "scene_case01_night_alley_witch",
        flagKey: "met_krebs_mugger_intro",
      },
      {
        nodeId: "scene_case01_hotel_morning_witch",
        flagKey: "met_hotel_maid_intro",
      },
    ];

    for (const expectation of introExpectations) {
      const node = getNode(expectation.nodeId);
      expect(node.onEnter).toEqual(
        expect.arrayContaining([
          {
            type: "set_flag",
            key: expectation.flagKey,
            value: true,
          },
        ]),
      );
    }
  });

  it("applies Karl relationship and ghost-testimony effects per Witch branch", () => {
    const helpKarlChoice = getNode(
      "scene_case01_hbf_luggage_incident_witch",
    ).choices.find((choice) => choice.id === "WITCH_HBF_BLOOD_IGNORE");
    expect(helpKarlChoice?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "change_relationship",
          characterId: "npc_karl_servant",
          delta: 10,
        },
      ]),
    );

    const feedKarlChoice = getNode(
      "scene_case01_estate_vaults_witch",
    ).choices.find((choice) => choice.id === "WITCH_VAULTS_FEED_KARL");
    expect(feedKarlChoice?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "change_relationship",
          characterId: "npc_karl_servant",
          delta: -40,
        },
        {
          type: "change_faction_signal",
          factionId: "house_of_pledges",
          delta: -5,
          reason: "Witch fed on Karl in the estate vaults",
        },
        {
          type: "set_flag",
          key: "ghost_karl_testimony_compromised",
          value: true,
        },
      ]),
    );
  });

  it("attaches Friedrich ledger evidence and faction consequences to the showdown branches", () => {
    const justiceChoice = getNode(
      "scene_case01_ghost_showdown_witch",
    ).choices.find((choice) => choice.id === "WITCH_GHOST_JUSTICE");
    expect(justiceChoice?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "grant_evidence",
          evidenceId: "ev_friedrich_ledger_testimony",
        },
        {
          type: "set_flag",
          key: "ghost_session_hook_spirit_bargain",
          value: true,
        },
        {
          type: "change_relationship",
          characterId: "npc_friedrich_wagner",
          delta: 20,
        },
      ]),
    );

    const subjugateChoice = getNode(
      "scene_case01_ghost_showdown_witch",
    ).choices.find((choice) => choice.id === "WITCH_GHOST_SUBJUGATE");
    const subjugationCheck = subjugateChoice?.passiveChecks?.find(
      (entry) => entry.id === "check_ghost_subjugation",
    );
    expect(subjugationCheck?.onSuccess?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "grant_evidence",
          evidenceId: "ev_friedrich_ledger_testimony",
        },
        {
          type: "change_relationship",
          characterId: "npc_friedrich_wagner",
          delta: -30,
        },
      ]),
    );

    const banishChoice = getNode(
      "scene_case01_ghost_showdown_witch",
    ).choices.find((choice) => choice.id === "WITCH_GHOST_BANISH");
    expect(banishChoice?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "change_relationship",
          characterId: "npc_friedrich_wagner",
          delta: -50,
        },
        {
          type: "change_faction_signal",
          factionId: "the_returned",
          delta: -10,
          reason: "Witch banished Friedrich and burned his ledger",
        },
      ]),
    );
    expect(
      banishChoice?.effects?.some(
        (effect) =>
          effect.type === "grant_evidence" &&
          effect.evidenceId === "ev_friedrich_ledger_testimony",
      ),
    ).toBe(false);
  });

  it("registers the mugger survivor rumor only on the Composure success branch", () => {
    const muggerChoice = getNode(
      "scene_case01_night_alley_escalation",
    ).choices.find((choice) => choice.id === "WITCH_MUGGER_SIPHON_BREAK");
    expect(muggerChoice?.skillCheck?.onSuccess?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "register_rumor",
          rumorId: "rumor_witch_mugger_survivor",
        },
      ]),
    );
    expect(
      muggerChoice?.skillCheck?.onFail?.effects?.some(
        (effect) =>
          effect.type === "register_rumor" &&
          effect.rumorId === "rumor_witch_mugger_survivor",
      ),
    ).toBe(false);
  });

  it("rewards a maid bribe with a hotel-side relationship boost", () => {
    const bribeChoice = getNode(
      "scene_case01_hotel_morning_witch",
    ).choices.find((choice) => choice.id === "WITCH_MORNING_BRIBE_MAID");
    expect(bribeChoice?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "change_relationship",
          characterId: "npc_hotel_maid",
          delta: 10,
        },
        {
          type: "set_flag",
          key: "flag_witch_maid_bribed",
          value: true,
        },
      ]),
    );
  });

  it("gates new Witch ghost-case hooks by Karl and Friedrich outcomes", () => {
    const evidenceNode = PACK_FREIBURG_GHOST_NODES.find(
      (node) => node.id === "scene_evidence_collection",
    );
    expect(evidenceNode).toBeDefined();
    const choiceIds = evidenceNode!.choices.map((choice) => choice.id);
    expect(choiceIds).toEqual(
      expect.arrayContaining([
        "GHOST_WITCH_FRIENDRICH_LEDGER_MEMORY",
        "GHOST_WITCH_KARL_SERVICE_CORRIDOR",
        "GHOST_WITCH_KARL_PANIC_TRACE",
      ]),
    );

    const ledgerChoice = evidenceNode!.choices.find(
      (choice) => choice.id === "GHOST_WITCH_FRIENDRICH_LEDGER_MEMORY",
    );
    expect(ledgerChoice?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "grant_evidence",
          evidenceId: "ev_friedrich_ledger_testimony",
        },
        {
          type: "set_flag",
          key: "ghost_session_hook_spirit_bargain",
          value: true,
        },
      ]),
    );
    expect(ledgerChoice?.visibleIfAll).toEqual(
      expect.arrayContaining([
        { type: "flag_equals", key: "origin_witch", value: true },
      ]),
    );
    expect(
      ledgerChoice?.visibleIfAll?.some(
        (condition) =>
          condition.type === "logic_or" &&
          condition.conditions.some(
            (inner) =>
              inner.type === "flag_equals" &&
              inner.key === "flag_witch_ghost_freed" &&
              inner.value === true,
          ) &&
          condition.conditions.some(
            (inner) =>
              inner.type === "flag_equals" &&
              inner.key === "flag_witch_ghost_bound" &&
              inner.value === true,
          ),
      ),
    ).toBe(true);

    const corridorChoice = evidenceNode!.choices.find(
      (choice) => choice.id === "GHOST_WITCH_KARL_SERVICE_CORRIDOR",
    );
    expect(corridorChoice?.visibleIfAll).toEqual(
      expect.arrayContaining([
        { type: "flag_equals", key: "origin_witch", value: true },
        {
          type: "flag_equals",
          key: "flag_witch_helped_karl_hbf",
          value: true,
        },
        {
          type: "flag_equals",
          key: "flag_witch_attacked_karl",
          value: false,
        },
      ]),
    );
    expect(corridorChoice?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "grant_evidence",
          evidenceId: "ev_karl_service_corridor_testimony",
        },
        {
          type: "set_flag",
          key: "ghost_session_hook_karl_smuggling_key",
          value: true,
        },
      ]),
    );

    const panicChoice = evidenceNode!.choices.find(
      (choice) => choice.id === "GHOST_WITCH_KARL_PANIC_TRACE",
    );
    expect(panicChoice?.visibleIfAll).toEqual(
      expect.arrayContaining([
        { type: "flag_equals", key: "origin_witch", value: true },
        {
          type: "flag_equals",
          key: "flag_witch_attacked_karl",
          value: true,
        },
      ]),
    );
    expect(panicChoice?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "set_flag",
          key: "ghost_karl_testimony_compromised",
          value: true,
        },
      ]),
    );
  });
});
