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
    const openingNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_opening_arrival_video",
    );
    expect(openingNode).toMatchObject({
      backgroundVideoUrl: "/VN/start/video/Bahn.mp4",
      backgroundVideoPosterUrl: "/VN/start/image/compartment_cinema.png",
      backgroundVideoSoundPrompt: true,
      advanceOnVideoEnd: true,
    });
    expect(openingNode?.choices.map((choice) => choice.id)).toContain(
      "CASE01_WITCH_START_TO_DROWSE",
    );
    expect(
      openingNode?.choices.find(
        (choice) => choice.id === "CASE01_WITCH_START_TO_DROWSE",
      )?.nextNodeId,
    ).toBe("scene_case01_opening_arrival_video_witch");

    const drowseNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_opening_arrival_video_witch",
    );
    expect(drowseNode).toMatchObject({
      backgroundUrl: "/VN/start/image/witch_compartment_drowse_final.png",
      narrativeLayout: "log",
    });
    expect(drowseNode?.visualSequence).toBeUndefined();
    expect(drowseNode?.choices).toEqual([
      expect.objectContaining({
        id: "AUTO_CONTINUE_WITCH_DROWSE_TO_MEMORY",
        nextNodeId: "scene_case01_witch_compartment_memory",
      }),
    ]);

    const memoryNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_witch_compartment_memory",
    );
    expect(memoryNode).toMatchObject({
      backgroundUrl: "/VN/start/image/witch_compartment_drowse_final.png",
      bodyOverride: "",
      narrativeLayout: "fullscreen",
      visualSequence: {
        skippable: true,
        advanceOnEnd: true,
      },
    });
    expect(memoryNode?.visualSequence?.frames).toHaveLength(10);
    expect(
      memoryNode?.visualSequence?.frames.reduce(
        (total, frame) => total + frame.durationMs,
        0,
      ),
    ).toBe(36_200);
    expect(memoryNode?.visualSequence?.frames.slice(-5)).toEqual([
      expect.objectContaining({
        imageUrl: "/VN/start/image/witch_memory/07_first_hunger.png",
        caption: "Сначала пришёл голод.",
      }),
      expect.objectContaining({
        imageUrl: "/VN/start/image/witch_memory/08_bureau_arrival.png",
        caption: "«Спокойно. Мы из Бюро».",
      }),
      expect.objectContaining({
        imageUrl: "/VN/start/image/witch_memory/09_bureau_offer.png",
        caption: "Бюро предложило не спасение. Работу.",
      }),
      expect.objectContaining({
        imageUrl: "/VN/start/image/witch_memory/06_felix_says_no.png",
        caption: "«Нет, матушка».",
      }),
      expect.objectContaining({
        imageUrl: "/VN/start/image/witch_memory/10_bureau_seal.png",
        caption: "Печать Бюро не спорит и не просит. Она ждет.",
      }),
    ]);
    expect(memoryNode?.choices).toEqual([
      expect.objectContaining({
        id: "AUTO_CONTINUE_WITCH_DROWSE_TO_THIRST",
        nextNodeId: "scene_case01_witch_thirst_mask",
      }),
    ]);
    for (const frame of memoryNode?.visualSequence?.frames ?? []) {
      expect(frame.imageUrl).toContain("/VN/start/image/witch_memory/");
      expect(existsSync(path.join("public", frame.imageUrl))).toBe(true);
    }

    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_witch_thirst_mask",
      ),
    ).toMatchObject({
      backgroundUrl: "/VN/start/image/witch_compartment_thirst_closeup_v2.png",
    });
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_witch_thirst_mask",
      )?.onEnter,
    ).toEqual(
      expect.arrayContaining([
        { type: "add_var", key: "witch_blood_curse_pressure", value: 10 },
      ]),
    );
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_witch_thirst_mask",
      )?.bodyOverride,
    ).not.toContain("inner_cynic");
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_witch_thirst_mask",
      )?.bodyOverride,
    ).not.toContain("звенит серебро");
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_witch_thirst_mask",
      )?.choices.map((choice) => choice.id),
    ).toEqual(["AUTO_CONTINUE_WITCH_THIRST_TO_COIN"]);
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_witch_thirst_mask",
      )?.choices[0]?.nextNodeId,
    ).toBe("scene_case01_witch_coin_clang");
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_witch_coin_clang",
      ),
    ).toMatchObject({
      narrativeLayout: "log",
      sceneGroupId: "witch_train_compartment",
    });
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_witch_coin_clang",
      )?.bodyOverride,
    ).toContain("Кляк");
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_witch_coin_wake",
      )?.bodyOverride,
    ).toContain(
      "Лязг метала заставляет напрячься каждый мускул, а восприятие обостриться.",
    );
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_witch_coin_wake",
      )?.bodyOverride,
    ).toContain("ему девятнадцать");
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_witch_coin_wake",
      )?.bodyOverride,
    ).not.toContain("Монета падает и катится");
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_witch_coin_wake",
      )?.bodyOverride,
    ).not.toContain("двадцать три");
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_witch_coin_wake",
      ),
    ).toMatchObject({
      backgroundUrl: "/VN/start/image/witch_coin_floor.png",
    });
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_witch_coin_wake",
      )?.choices.map((choice) => choice.id),
    ).toEqual(
      expect.arrayContaining([
        "WITCH_COIN_REBUKE",
        "WITCH_COIN_DRY_JOKE",
        "WITCH_COIN_SOFT_ARISTOCRATIC",
      ]),
    );
    for (const choice of CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_witch_coin_wake",
    )?.choices ?? []) {
      expect(choice.nextNodeId).toBe(
        "scene_case01_train_assistant_intro_witch",
      );
    }

    const compartmentLetterNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_train_compartment_letter_witch",
    );
    expect(compartmentLetterNode).toBeDefined();
    expect(compartmentLetterNode).toMatchObject({
      backgroundUrl: "/VN/start/image/witch_compartment_after_felix.png",
      sceneGroupId: "witch_train_compartment",
    });
    expect(compartmentLetterNode?.choices.map((choice) => choice.id)).toEqual([
      "AUTO_CONTINUE_WITCH_LETTER_TO_AFTERTHOUGHTS",
    ]);
    expect(compartmentLetterNode?.choices[0]?.nextNodeId).toBe(
      "scene_case01_witch_letter_afterthoughts",
    );

    const letterAfterthoughtsNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_witch_letter_afterthoughts",
    );
    expect(letterAfterthoughtsNode).toMatchObject({
      backgroundUrl: "/VN/start/image/witch_compartment_after_felix.png",
      sceneGroupId: "witch_train_compartment",
      narrativeLayout: "log",
    });
    expect(letterAfterthoughtsNode?.choices.map((choice) => choice.id)).toEqual(
      expect.arrayContaining([
        "WITCH_LETTER_AFTERTHOUGHT_VEIL_FOCUS",
        "WITCH_LETTER_AFTERTHOUGHT_DRINK_BRANDY",
        "WITCH_LETTER_AFTERTHOUGHT_COMPOSE",
      ]),
    );
    for (const choice of letterAfterthoughtsNode?.choices ?? []) {
      expect(choice.nextNodeId).toBe(
        "scene_case01_witch_dining_car_buffet_first_look",
      );
    }

    const lotteBuffetFirstLookNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_witch_dining_car_buffet_first_look",
    );
    expect(lotteBuffetFirstLookNode).toMatchObject({
      backgroundUrl: "/VN/start/image/witch_lotte_buffet_counter.png",
      characterId: "npc_weber_dispatcher",
      sceneGroupId: "train_dining_car",
    });
    expect(
      lotteBuffetFirstLookNode?.choices.map((choice) => choice.id),
    ).toEqual(
      expect.arrayContaining([
        "WITCH_LOTTE_COUNTER_OBSERVE",
        "WITCH_LOTTE_COUNTER_APPROACH",
      ]),
    );
    for (const choice of lotteBuffetFirstLookNode?.choices ?? []) {
      expect(choice.nextNodeId).toBe("scene_case01_witch_lotte_counter_intro");
    }

    const lotteCounterIntroNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_witch_lotte_counter_intro",
    );
    expect(lotteCounterIntroNode).toMatchObject({
      backgroundUrl: "/VN/start/image/witch_lotte_buffet_counter.png",
      characterId: "npc_weber_dispatcher",
      sceneGroupId: "train_dining_car",
    });
    expect(lotteCounterIntroNode?.choices.map((choice) => choice.id)).toEqual(
      expect.arrayContaining([
        "WITCH_LOTTE_GREETING_COMPOSURE",
        "WITCH_LOTTE_GREETING_HONEST",
        "WITCH_LOTTE_GREETING_SOCIAL",
        "WITCH_LOTTE_GREETING_CYNIC",
        "WITCH_LOTTE_GREETING_AUTHORITY",
        "WITCH_LOTTE_GREETING_BLOOD_SENSE",
      ]),
    );
    for (const choice of lotteCounterIntroNode?.choices ?? []) {
      expect(choice.nextNodeId).toBe(
        "scene_case01_train_dining_car_intro_witch",
      );
    }

    const assistantIntroWitchNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_train_assistant_intro_witch",
    );
    expect(assistantIntroWitchNode).toBeDefined();
    expect(assistantIntroWitchNode).toMatchObject({
      backgroundUrl: "/VN/start/image/witch_coin_floor.png",
    });
    expect(assistantIntroWitchNode?.bodyOverride).toContain(
      "— Подойдите, Феликс. Развернитесь.",
    );
    expect(assistantIntroWitchNode?.choices.map((choice) => choice.id)).toEqual(
      expect.arrayContaining(["AUTO_CONTINUE_WITCH_ASSISTANT_TO_COLLAR"]),
    );
    expect(
      assistantIntroWitchNode?.choices.find(
        (c) => c.id === "AUTO_CONTINUE_WITCH_ASSISTANT_TO_COLLAR",
      )?.nextNodeId,
    ).toBe("scene_case01_train_collar_choice_witch");

    const collarChoiceNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_train_collar_choice_witch",
    );
    expect(collarChoiceNode).toBeDefined();
    expect(collarChoiceNode).toMatchObject({
      backgroundUrl: "/VN/start/image/witch_felix_collar_v2.png",
    });
    expect(collarChoiceNode?.bodyOverride).not.toContain(
      "— Подойдите, Феликс. Развернитесь.",
    );
    expect(collarChoiceNode?.choices.map((choice) => choice.id)).toEqual(
      expect.arrayContaining([
        "WITCH_COLLAR_COMMAND",
        "WITCH_COLLAR_DRY_JOKE",
        "WITCH_COLLAR_RARE_TRUST",
      ]),
    );
    for (const choice of collarChoiceNode?.choices ?? []) {
      expect(choice.nextNodeId).toBe("scene_case01_witch_felix_exit");
      expect(choice.visibleIfAll).toBeUndefined();
      expect(choice.requireAll).toHaveLength(1);
    }
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_witch_felix_exit",
      ),
    ).toMatchObject({
      backgroundUrl: "/VN/start/image/witch_compartment_after_felix.png",
    });
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_witch_felix_exit",
      )?.choices[0]?.nextNodeId,
    ).toBe("scene_case01_train_compartment_letter_witch");

    const diningCarIntroWitchNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_train_dining_car_intro_witch",
    );
    expect(diningCarIntroWitchNode).toBeDefined();
    expect(diningCarIntroWitchNode).toMatchObject({
      backgroundUrl: "/VN/start/image/witch_lotte_table_first_talk.png",
    });
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
    expect(diningCarMonologueWitchNode).toMatchObject({
      backgroundUrl: "/VN/start/image/witch_lotte_table_life_monologue.png",
    });
    expect(
      diningCarMonologueWitchNode?.choices.map((choice) => choice.id),
    ).toEqual(
      expect.arrayContaining([
        "WITCH_LOTTE_MONOLOGUE_CYNIC",
        "WITCH_LOTTE_MONOLOGUE_GRIEF",
        "WITCH_LOTTE_MONOLOGUE_PRACTICAL",
      ]),
    );
    const monologueChoiceById = new Map(
      diningCarMonologueWitchNode?.choices.map((choice) => [choice.id, choice]),
    );
    expect(
      monologueChoiceById.get("WITCH_LOTTE_MONOLOGUE_CYNIC")?.nextNodeId,
    ).toBe("scene_case01_witch_lotte_monologue_cynic_reaction");
    expect(
      monologueChoiceById.get("WITCH_LOTTE_MONOLOGUE_GRIEF")?.nextNodeId,
    ).toBe("scene_case01_witch_lotte_monologue_grief_reaction");
    expect(
      monologueChoiceById.get("WITCH_LOTTE_MONOLOGUE_PRACTICAL")?.nextNodeId,
    ).toBe("scene_case01_witch_lotte_monologue_practical_reaction");

    const lotteReactionNodes = [
      {
        id: "scene_case01_witch_lotte_monologue_cynic_reaction",
        backgroundUrl: "/VN/start/image/witch_lotte_notebook_suspicion.png",
        continueId: "AUTO_CONTINUE_WITCH_LOTTE_CYNIC_REACTION",
      },
      {
        id: "scene_case01_witch_lotte_monologue_grief_reaction",
        backgroundUrl: "/VN/start/image/witch_lotte_warm_hand.png",
        continueId: "AUTO_CONTINUE_WITCH_LOTTE_GRIEF_REACTION",
      },
      {
        id: "scene_case01_witch_lotte_monologue_practical_reaction",
        backgroundUrl:
          "/VN/start/image/witch_lotte_felix_arrival_interrupt.png",
        continueId: "AUTO_CONTINUE_WITCH_LOTTE_PRACTICAL_REACTION",
      },
    ];
    for (const expectedNode of lotteReactionNodes) {
      const reactionNode = CASE01_CANON_NODES.find(
        (node) => node.id === expectedNode.id,
      );
      expect(reactionNode).toMatchObject({
        backgroundUrl: expectedNode.backgroundUrl,
      });
      expect(reactionNode?.choices[0]).toMatchObject({
        id: expectedNode.continueId,
        nextNodeId: "scene_case01_train_ankommen_video",
      });
    }

    const vozaCutsceneNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_train_voza_cutscene",
    );
    expect(vozaCutsceneNode).toBeDefined();
    expect(vozaCutsceneNode?.choices.map((choice) => choice.id)).toEqual(
      expect.arrayContaining([
        "CHOICE_VOZA_TO_HBF_DETECTIVE",
        "CHOICE_VOZA_TO_HBF_WITCH_LOTTE_GOODBYE",
        "CHOICE_VOZA_TO_HBF_WITCH",
      ]),
    );
    expect(
      vozaCutsceneNode?.choices.find(
        (choice) => choice.id === "CHOICE_VOZA_TO_HBF_WITCH_LOTTE_GOODBYE",
      )?.nextNodeId,
    ).toBe("scene_case01_witch_lotte_goodbye_platform");

    const lotteGoodbyeNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_witch_lotte_goodbye_platform",
    );
    expect(lotteGoodbyeNode).toMatchObject({
      backgroundUrl: "/VN/start/image/witch_lotte_goodbye_sunrise_platform.png",
    });
    expect(lotteGoodbyeNode?.choices[0]).toMatchObject({
      id: "AUTO_CONTINUE_WITCH_LOTTE_GOODBYE_PLATFORM",
      nextNodeId: "scene_case01_hbf_luggage_incident_witch",
    });

    const platformIncidentNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_hbf_luggage_incident_witch",
    );
    expect(platformIncidentNode).toBeDefined();
    expect(platformIncidentNode?.choices.map((choice) => choice.id)).toEqual(
      expect.arrayContaining([
        "AUTO_WITCH_HBF_SASHA_SOFT",
        "AUTO_WITCH_HBF_SASHA_THIRST",
      ]),
    );
    expect(
      platformIncidentNode?.choices.find(
        (choice) => choice.id === "AUTO_WITCH_HBF_SASHA_SOFT",
      )?.visibleIfAll,
    ).toEqual(
      expect.arrayContaining([
        { type: "var_lte", key: "witch_blood_curse_pressure", value: 44 },
      ]),
    );
    expect(
      platformIncidentNode?.choices.find(
        (choice) => choice.id === "AUTO_WITCH_HBF_SASHA_THIRST",
      )?.visibleIfAll,
    ).toEqual(
      expect.arrayContaining([
        { type: "var_gte", key: "witch_blood_curse_pressure", value: 45 },
      ]),
    );

    const sashaThirstNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_hbf_luggage_sasha_thirst",
    );
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_hbf_luggage_sasha_soft",
      ),
    ).toMatchObject({
      backgroundUrl: "/VN/start/image/witch_sasha_luggage_soft.png",
    });
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_hbf_luggage_sasha_soft",
      )?.choices.map((choice) => choice.id),
    ).toEqual(
      expect.arrayContaining([
        "WITCH_HBF_SASHA_ACCEPT_COVER",
        "WITCH_HBF_SASHA_THANK_QUIETLY",
        "WITCH_HBF_SASHA_DISMISS_CONCERN",
      ]),
    );
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_hbf_luggage_sasha_soft",
      )?.choices.find((choice) => choice.id === "WITCH_HBF_SASHA_THANK_QUIETLY")
        ?.nextNodeId,
    ).toBe("scene_case01_hbf_luggage_sasha_thank_quietly");
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_hbf_luggage_sasha_soft",
      )?.choices.find(
        (choice) => choice.id === "WITCH_HBF_SASHA_DISMISS_CONCERN",
      )?.nextNodeId,
    ).toBe("scene_case01_hbf_luggage_sasha_dismiss_concern");
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_hbf_luggage_sasha_thank_quietly",
      ),
    ).toMatchObject({
      backgroundUrl: "/VN/start/image/witch_sasha_luggage_thank.png",
      choices: [
        expect.objectContaining({
          id: "AUTO_CONTINUE_WITCH_HBF_SASHA_THANK_QUIETLY",
          nextNodeId: "scene_case01_hbf_departure",
        }),
      ],
    });
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_hbf_luggage_sasha_dismiss_concern",
      ),
    ).toMatchObject({
      backgroundUrl: "/VN/start/image/witch_sasha_luggage_dismiss.png",
      choices: [
        expect.objectContaining({
          id: "AUTO_CONTINUE_WITCH_HBF_SASHA_DISMISS_CONCERN",
          nextNodeId: "scene_case01_hbf_departure",
        }),
      ],
    });
    expect(sashaThirstNode).toMatchObject({
      backgroundUrl: "/VN/start/image/witch_sasha_luggage_thirst.png",
    });
    expect(sashaThirstNode?.choices.map((choice) => choice.id)).toEqual(
      expect.arrayContaining([
        "WITCH_HBF_BLOOD_ABSORB",
        "WITCH_HBF_BLOOD_IGNORE",
        "WITCH_HBF_SEND_FELIX_AWAY",
      ]),
    );
    expect(
      sashaThirstNode?.choices.find(
        (choice) => choice.id === "WITCH_HBF_SEND_FELIX_AWAY",
      )?.nextNodeId,
    ).toBe("scene_case01_hbf_luggage_sasha_send_felix_away");
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_hbf_luggage_sasha_send_felix_away",
      ),
    ).toMatchObject({
      backgroundUrl: "/VN/start/image/witch_sasha_send_felix_away.png",
      choices: [
        expect.objectContaining({
          id: "AUTO_CONTINUE_WITCH_HBF_SASHA_SEND_FELIX_AWAY",
          nextNodeId: "scene_case01_hbf_departure",
        }),
      ],
    });

    const hbfDepartureNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_hbf_departure",
    );
    expect(hbfDepartureNode?.choices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "CASE01_HBF_EXIT_WITCH_HOTEL_CHECKIN",
          nextNodeId: "scene_case01_witch_hotel_checkin",
        }),
      ]),
    );
    expect(
      CASE01_CANON_NODES.find(
        (node) => node.id === "scene_case01_witch_hotel_checkin",
      ),
    ).toMatchObject({
      backgroundUrl:
        "/VN/start/image/witch_hotel_checkin_zum_goldenen_adler.png",
      choices: [
        expect.objectContaining({
          id: "AUTO_CONTINUE_WITCH_HOTEL_TO_BUREAU",
          nextNodeId: "scene_case01_witch_bureau_entry",
        }),
      ],
    });

    const masterMeetingNode = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_witch_bureau_master_meeting",
    );
    expect(masterMeetingNode).toBeDefined();
    expect(masterMeetingNode?.choices.map((choice) => choice.id)).toEqual(
      expect.arrayContaining([
        "WITCH_BUREAU_MASTER_DRINK_SUPPRESSANT",
        "WITCH_BUREAU_MASTER_DRINK_SUPPRESSANT_NOTICED",
        "WITCH_BUREAU_MASTER_SIPHON_RELIC",
        "WITCH_BUREAU_MASTER_COMPOSURE",
      ]),
    );
    expect(
      masterMeetingNode?.choices.find(
        (choice) => choice.id === "WITCH_BUREAU_MASTER_DRINK_SUPPRESSANT",
      )?.visibleIfAll,
    ).toEqual(
      expect.arrayContaining([
        {
          type: "logic_not",
          condition: {
            type: "flag_equals",
            key: "flag_witch_absorbed_hbf_blood",
            value: true,
          },
        },
      ]),
    );
    const noticedSuppressantChoice = masterMeetingNode?.choices.find(
      (choice) => choice.id === "WITCH_BUREAU_MASTER_DRINK_SUPPRESSANT_NOTICED",
    );
    expect(noticedSuppressantChoice?.nextNodeId).toBe(
      "scene_case01_witch_bureau_master_noticed_hbf_blood",
    );
    expect(noticedSuppressantChoice?.visibleIfAll).toEqual(
      expect.arrayContaining([
        {
          type: "flag_equals",
          key: "flag_witch_absorbed_hbf_blood",
          value: true,
        },
      ]),
    );
    expect(noticedSuppressantChoice?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "set_flag",
          key: "flag_witch_master_noticed_hbf_blood",
          value: true,
        },
      ]),
    );
    expect(
      CASE01_CANON_NODES.find(
        (node) =>
          node.id === "scene_case01_witch_bureau_master_noticed_hbf_blood",
      ),
    ).toMatchObject({
      backgroundUrl:
        "/VN/start/image/witch_bureau_master_noticed_hbf_blood.png",
      choices: [
        expect.objectContaining({
          id: "AUTO_CONTINUE_WITCH_BUREAU_MASTER_NOTICED_HBF_BLOOD",
          nextNodeId: "scene_case01_witch_bureau_exit",
        }),
      ],
    });

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
        "WITCH_VAULTS_FEED_SASHA",
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
      characterId: "npc_sasha_hartmann_servant",
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
        "npc_sasha_hartmann_servant",
        "npc_friedrich_wagner",
        "npc_krebs_mugger",
        "npc_hotel_maid",
      ]),
    );

    const runtimeText = JSON.stringify(CASE01_CANON_NODES);
    expect(runtimeText).not.toContain("npc_karl_servant");
    expect(runtimeText).not.toContain("met_karl_servant_intro");
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

  it("seeds the Witch parliament emphasis at origin selection", () => {
    const witchProfile = originProfiles.find(
      (profile) => profile.choiceId === "BACKSTORY_WITCH",
    );
    const effects = buildOriginChoiceEffects(witchProfile!);

    expect(effects).toEqual(
      expect.arrayContaining([
        {
          type: "set_var",
          key: "inner_voice_rank_inner_leader",
          value: 2,
        },
        {
          type: "set_var",
          key: "inner_voice_rank_inner_cynic",
          value: 1,
        },
      ]),
    );
  });

  it("assigns every player-facing Witch choice a canonical source", () => {
    const choices = CASE01_CANON_NODES.flatMap((node) => node.choices).filter(
      (choice) => choice.id.startsWith("WITCH_"),
    );
    const neutralIds = new Set([
      "WITCH_FINALE_CLOSE",
      "WITCH_FINALE_ENTER_SANDBOX",
    ]);

    for (const choice of choices) {
      if (neutralIds.has(choice.id)) {
        expect(choice.choiceSource).toBeUndefined();
        continue;
      }
      expect(choice.choiceSource, choice.id).toBeDefined();
      expect(choice.text, choice.id).not.toMatch(/^\[[^\]]+\]/);
    }

    expect(
      choices.find((choice) => choice.id === "WITCH_COIN_DRY_JOKE"),
    ).toMatchObject({
      choiceSource: "voice",
      presentationVoiceId: "attr_composure",
    });
    expect(
      choices.find((choice) => choice.id === "WITCH_HBF_WARM_VETO_TEND_HAND"),
    ).toMatchObject({
      choiceSource: "volition",
      requireAll: [
        { type: "var_gte", key: "resource_volition_token", value: 1 },
      ],
    });
  });

  it("reveals Shame on concrete harm and failed Facade outcomes", () => {
    const revealEffect = {
      type: "set_flag",
      key: "flag_witch_shame_revealed",
      value: true,
    } as const;
    const choiceById = (id: string) =>
      CASE01_CANON_NODES.flatMap((node) => node.choices).find(
        (choice) => choice.id === id,
      );

    expect(choiceById("WITCH_HBF_BLOOD_ABSORB")?.effects).toEqual(
      expect.arrayContaining([revealEffect]),
    );
    expect(choiceById("WITCH_BARONESS_FEED")?.effects).toEqual(
      expect.arrayContaining([revealEffect]),
    );
    expect(choiceById("WITCH_VAULTS_FEED_SASHA")?.effects).toEqual(
      expect.arrayContaining([revealEffect]),
    );
    expect(
      choiceById("WITCH_MUGGER_SIPHON_BREAK")?.skillCheck?.onFail?.effects,
    ).toEqual(expect.arrayContaining([revealEffect]));
    expect(
      choiceById("WITCH_BARONESS_RESIST_RELIC")?.passiveChecks?.[0]?.onFail
        ?.effects,
    ).toEqual(expect.arrayContaining([revealEffect]));
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
        const failBranch = choice.skillCheck.onFail;
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
      expect(choice.nextNodeId).toBe("scene_case01_witch_estate_epilogue");
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
        file: "char_case01_sasha_hartmann_servant.md",
        runtimeId: "npc_sasha_hartmann_servant",
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

    const sasha = npcById.get("npc_sasha_hartmann_servant");
    expect(sasha).toMatchObject({
      displayName: 'Alexander "Sasha"',
      publicRole: "Hartmann family servant",
      portraitUrl:
        "/images/characters/sasha_hartmann_servant/sasha_hartmann_servant.webp",
    });
    expect(sasha?.introFlag).toBe("met_sasha_servant_intro");
    expect(sasha?.serviceIds).toEqual(
      expect.arrayContaining(["svc_sasha_service_corridors"]),
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
    expect(serviceIds.has("svc_sasha_service_corridors")).toBe(true);
    expect(serviceIds.has("svc_friedrich_ledger_memory")).toBe(true);
    expect(serviceIds.has("svc_hotel_discretion")).toBe(true);

    const sashaCorridors = FREIBURG_SOCIAL_CATALOG.services.find(
      (entry) => entry.id === "svc_sasha_service_corridors",
    );
    expect(sashaCorridors).toMatchObject({
      npcId: "npc_sasha_hartmann_servant",
      unlockFlag: "met_sasha_servant_intro",
      qualityNote:
        "Knows service routes, can settle a domestic crisis without attracting public attention, and keeps composure under pressure.",
      consequenceNote:
        "If Eleonora uses his blood or warmth, Sasha does not become a frightened extra; he becomes a silent witness whose trust is broken.",
    });

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
        flagKey: "met_sasha_servant_intro",
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

  it("applies Sasha relationship and ghost-testimony effects per Witch branch", () => {
    const softSashaChoice = getNode(
      "scene_case01_hbf_luggage_sasha_soft",
    ).choices.find((choice) => choice.id === "WITCH_HBF_SASHA_ACCEPT_COVER");
    expect(softSashaChoice?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "change_relationship",
          characterId: "npc_sasha_hartmann_servant",
          delta: 10,
        },
        {
          type: "set_flag",
          key: "flag_witch_helped_sasha_hbf",
          value: true,
        },
      ]),
    );

    const helpSashaChoice = getNode(
      "scene_case01_hbf_luggage_sasha_thirst",
    ).choices.find((choice) => choice.id === "WITCH_HBF_BLOOD_IGNORE");
    expect(helpSashaChoice?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "change_relationship",
          characterId: "npc_sasha_hartmann_servant",
          delta: 10,
        },
        {
          type: "set_flag",
          key: "flag_witch_helped_sasha_hbf",
          value: true,
        },
      ]),
    );

    const feedSashaChoice = getNode(
      "scene_case01_estate_vaults_witch",
    ).choices.find((choice) => choice.id === "WITCH_VAULTS_FEED_SASHA");
    expect(feedSashaChoice?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "change_relationship",
          characterId: "npc_sasha_hartmann_servant",
          delta: -40,
        },
        {
          type: "change_faction_signal",
          factionId: "house_of_pledges",
          delta: -5,
          reason: "Witch fed on Sasha in the estate vaults",
        },
        {
          type: "set_flag",
          key: "ghost_sasha_testimony_compromised",
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

  it("gates new Witch ghost-case hooks by Sasha and Friedrich outcomes", () => {
    const evidenceNode = PACK_FREIBURG_GHOST_NODES.find(
      (node) => node.id === "scene_evidence_collection",
    );
    expect(evidenceNode).toBeDefined();
    const choiceIds = evidenceNode!.choices.map((choice) => choice.id);
    expect(choiceIds).toEqual(
      expect.arrayContaining([
        "GHOST_WITCH_FRIENDRICH_LEDGER_MEMORY",
        "GHOST_WITCH_SASHA_SERVICE_CORRIDOR",
        "GHOST_WITCH_SASHA_PANIC_TRACE",
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
      (choice) => choice.id === "GHOST_WITCH_SASHA_SERVICE_CORRIDOR",
    );
    expect(corridorChoice?.visibleIfAll).toEqual(
      expect.arrayContaining([
        { type: "flag_equals", key: "origin_witch", value: true },
        {
          type: "flag_equals",
          key: "flag_witch_helped_sasha_hbf",
          value: true,
        },
        {
          type: "flag_equals",
          key: "flag_witch_attacked_sasha",
          value: false,
        },
      ]),
    );
    expect(corridorChoice?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "grant_evidence",
          evidenceId: "ev_sasha_service_corridor_testimony",
        },
        {
          type: "set_flag",
          key: "ghost_session_hook_sasha_smuggling_key",
          value: true,
        },
      ]),
    );

    const panicChoice = evidenceNode!.choices.find(
      (choice) => choice.id === "GHOST_WITCH_SASHA_PANIC_TRACE",
    );
    expect(panicChoice?.visibleIfAll).toEqual(
      expect.arrayContaining([
        { type: "flag_equals", key: "origin_witch", value: true },
        {
          type: "flag_equals",
          key: "flag_witch_attacked_sasha",
          value: true,
        },
      ]),
    );
    expect(panicChoice?.effects).toEqual(
      expect.arrayContaining([
        {
          type: "set_flag",
          key: "ghost_sasha_testimony_compromised",
          value: true,
        },
      ]),
    );
  });
});
