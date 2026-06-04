import type { NodeBlueprint } from "../../vn-blueprint-types";
import {
CASE01_DEFAULT_ENTRY_SCENARIO_ID,
CASE01_DINING_FAREWELL_NODE_IDS,
CASE01_DINING_FLAGS,
CASE01_DINING_NODE_IDS,
CASE01_HBF_BG,
CASE01_LUGGAGE_BG,
CASE01_NEWSBOY_BG,
CASE01_PLATFORM_FAREWELL_BG,
CASE01_PLATFORM_STILL_BG,
CASE01_POLICE_BG,
CASE01_START_VIDEO_BASE_PATH,
CASE01_TRAIN_HUB_ASPECT_RATIO,
CASE01_TRAIN_HUB_IMAGE_URL,
CASE01_TRAIN_HUB_NODE_ID,
CASE01_TRAIN_HUB_SCHEMA_ID,
CASE01_TRAIN_HUB_VIEW_BOX,
CASE01_TRAIN_HUB_ZONE_IDS,
CASE01_TRAIN_HUB_ZONE_PATHS,
CASE01_TRAIN_ASSISTANT_BG,
CASE01_TRAIN_COMPARTMENT_BG,
CASE01_TRAIN_DINING_CAR_BG,
CASE01_TRAIN_DINING_CAR_FELIX_BG,
CASE01_TRAIN_DINING_CAR_GROUP_BG,
CASE01_TRAIN_DINING_CAR_MOTHER_BG,
CASE01_TRAIN_DINING_CAR_MOTHER_EYE_CONTACT_BG,
CASE01_TRAIN_DINING_CAR_OLD_BADENER_BG,
CASE01_TRAIN_DINING_CAR_WINE_BG,
CASE01_BG_ESTATE_BUREAU
} from "./shared";

const trainHubZoneEffect = (
  zoneId: (typeof CASE01_TRAIN_HUB_ZONE_IDS)[keyof typeof CASE01_TRAIN_HUB_ZONE_IDS],
) => ({
  type: "set_hub_zone" as const,
  hubSchemaId: CASE01_TRAIN_HUB_SCHEMA_ID,
  zoneId,
});

const returnToTrainHubChoice = {
  id: "return_to_train_hub",
  text: "Back to the train map",
  nextNodeId: CASE01_TRAIN_HUB_NODE_ID,
} satisfies NodeBlueprint["choices"][number];

const trainHubSchema = {
  id: CASE01_TRAIN_HUB_SCHEMA_ID,
  imageUrl: CASE01_TRAIN_HUB_IMAGE_URL,
  viewBox: CASE01_TRAIN_HUB_VIEW_BOX,
  aspectRatio: CASE01_TRAIN_HUB_ASPECT_RATIO,
  defaultCurrentZoneId: CASE01_TRAIN_HUB_ZONE_IDS.compartment,
  zones: [
    {
      id: CASE01_TRAIN_HUB_ZONE_IDS.compartment,
      label: "Compartment",
      svgPath: CASE01_TRAIN_HUB_ZONE_PATHS.compartment,
    },
    {
      id: CASE01_TRAIN_HUB_ZONE_IDS.corridor,
      label: "Corridor",
      svgPath: CASE01_TRAIN_HUB_ZONE_PATHS.corridor,
    },
    {
      id: CASE01_TRAIN_HUB_ZONE_IDS.diningCar,
      label: "Dining car",
      svgPath: CASE01_TRAIN_HUB_ZONE_PATHS.dining_car,
      occupants: [
        {
          npcId: "npc_felix_hartmann",
          visibleIfAll: [
            {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.metFelix,
              value: true,
            },
          ],
        },
        {
          npcId: "npc_mother_hartmann",
          visibleIfAll: [
            {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.metMother,
              value: true,
            },
          ],
        },
      ],
    },
    {
      id: CASE01_TRAIN_HUB_ZONE_IDS.vestibule,
      label: "Vestibule",
      svgPath: CASE01_TRAIN_HUB_ZONE_PATHS.vestibule,
    },
  ],
} satisfies NonNullable<NodeBlueprint["hubSchema"]>;

export const arrivalNodes: NodeBlueprint[] = [
{
    id: "scene_case01_opening_arrival_video",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Approach by rail",
    bodyOverride: "**[Элеонора]**:\n— Что ж, Феликс. Фрайбург не терпит опозданий. Детектив, присмотрите за ним. Он склонен теряться в… деталях, забывая о главном.\n\n**[Лотте]**:\n— На перроне лучше не останавливаться, детектив. Здесь даже прощания занимают очередь.\n\n**[Narrator]**:\nОни уходят в толпу — Элеонора и Лотте, плечом к плечу, негромко разговаривая. Рыжие волосы Лотте — последнее яркое пятно в сером паре перрона. За ними остаётся запах дорогого табака и след невысказанных обещаний.",
    backgroundUrl: CASE01_TRAIN_COMPARTMENT_BG,
    narrativeLayout: "fullscreen",
    sceneGroupId: "train_compartment",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_COMPARTMENT_CINEMA",
        text: "Continue.",
        nextNodeId: "scene_case01_train_compartment_letter",
        visibleIfAll: [
          {
            type: "logic_not",
            condition: { type: "flag_equals", key: "origin_journalist", value: true }
          },
          {
            type: "logic_not",
            condition: { type: "flag_equals", key: "origin_aristocrat", value: true }
          },
          {
            type: "logic_not",
            condition: { type: "flag_equals", key: "origin_veteran", value: true }
          },
          {
            type: "logic_not",
            condition: { type: "flag_equals", key: "origin_archivist", value: true }
          },
          {
            type: "logic_not",
            condition: { type: "flag_equals", key: "origin_witch", value: true }
          }
        ]
      },
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_COMPARTMENT_CINEMA_WITCH",
        text: "Continue.",
        nextNodeId: "scene_case01_train_compartment_letter_witch",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_witch", value: true }
        ]
      },
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_COMPARTMENT_CINEMA_JOURNALIST",
        text: "Continue.",
        nextNodeId: "scene_case01_train_compartment_letter_journalist",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_journalist", value: true }
        ],
        effects: [
          { type: "set_quest_stage", questId: "quest_journalist", stage: 1 }
        ]
      },
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_COMPARTMENT_CINEMA_ARISTOCRAT",
        text: "Continue.",
        nextNodeId: "scene_case01_train_compartment_letter_aristocrat",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_aristocrat", value: true }
        ]
      },
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_COMPARTMENT_CINEMA_VETERAN",
        text: "Continue.",
        nextNodeId: "scene_case01_train_compartment_letter_veteran",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_veteran", value: true }
        ]
      },
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_COMPARTMENT_CINEMA_ARCHIVIST",
        text: "Continue.",
        nextNodeId: "scene_case01_train_compartment_letter_archivist",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_archivist", value: true }
        ]
      }
    ],
  },
  {
    id: "scene_case01_train_compartment_letter",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Orders from the Agency",
    bodyOverride:
      "Dear detective.\n\nI await your swift arrival in Freiburg. I trust your talent shall reveal the truth behind the bank robbery. Your quarters at '[fact:Zum Eber:case01/zum_goldenen_adler]' are prepared.\n\nBut remember... the most obvious path often leads to a dead end.\n\nWith respect,\n[fact:Master:case01/master]",
    backgroundUrl: CASE01_TRAIN_COMPARTMENT_BG,
    narrativePresentation: "letter",
    narrativeLayout: "letter_overlay",
    sceneGroupId: "train_compartment",
    letterOverlayRevealDelayMs: 2800,
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_COMPARTMENT_LETTER",
        text: "Continue.",
        nextNodeId: "scene_case01_train_assistant_intro",
      },
    ],
  },
  {
    id: "scene_case01_train_compartment_letter_journalist",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Press Telegram",
    bodyOverride:
      "To the Editorial Office.\n\nYour assignment in Freiburg is confirmed. The Bankhaus Krebs heist is the front-page story we need. Your lodgings at '[fact:Zum Eber:case01/zum_goldenen_adler]' are paid for by the press syndicate.\n\nExpose the truth behind the municipal ledger, avoid the police sensors, and get the scoop before the local authorities bury it.\n\nEditor-in-Chief,\n[fact:Master:case01/master]",
    backgroundUrl: CASE01_TRAIN_COMPARTMENT_BG,
    narrativePresentation: "letter",
    narrativeLayout: "letter_overlay",
    sceneGroupId: "train_compartment",
    letterOverlayRevealDelayMs: 2800,
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_COMPARTMENT_LETTER_JOURNALIST",
        text: "Continue.",
        nextNodeId: "scene_case01_train_assistant_intro",
      },
    ],
  },
  {
    id: "scene_case01_train_compartment_letter_aristocrat",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Letter from the Bureau",
    bodyOverride:
      "My dear Charlotte.\n\nThe Bureau has prepared your landing in Freiburg. The local bank scandal is the perfect cover for your research. Your quarters at '[fact:Zum Eber:case01/zum_goldenen_adler]' have been secured, including the necessary... provisions to soothe your condition.\n\nFind the seal, lift the blood curse before it claims you, and remember that our power thrives in the shadows.\n\nIn sisterhood,\n[fact:Master:case01/master]",
    backgroundUrl: CASE01_TRAIN_COMPARTMENT_BG,
    narrativePresentation: "letter",
    narrativeLayout: "letter_overlay",
    sceneGroupId: "train_compartment",
    letterOverlayRevealDelayMs: 2800,
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_COMPARTMENT_LETTER_ARISTOCRAT",
        text: "Continue.",
        nextNodeId: "scene_case01_train_assistant_intro",
      },
    ],
  },
  {
    id: "scene_case01_train_compartment_letter_veteran",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Military Dispatch",
    bodyOverride:
      "Soldier.\n\nYour redeployment to Freiburg is finalized. The bank vault intrusion suggests specialized sabotage. Quarters at '[fact:Zum Eber:case01/zum_goldenen_adler]' are requisitioned for your tactical operations.\n\nEstablish the courier network route, retrieve the lost unit dispatch, and complete your mission with utmost discretion.\n\nCommanding Officer,\n[fact:Master:case01/master]",
    backgroundUrl: CASE01_TRAIN_COMPARTMENT_BG,
    narrativePresentation: "letter",
    narrativeLayout: "letter_overlay",
    sceneGroupId: "train_compartment",
    letterOverlayRevealDelayMs: 2800,
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_COMPARTMENT_LETTER_VETERAN",
        text: "Continue.",
        nextNodeId: "scene_case01_train_assistant_intro",
      },
    ],
  },
  {
    id: "scene_case01_train_compartment_letter_archivist",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Archival Request",
    bodyOverride:
      "Esteemed Colleague.\n\nYour transfer to the Freiburg Municipal Archives is approved. The disruption at Bankhaus Krebs threatens historical tax records. Quarters at '[fact:Zum Eber:case01/zum_goldenen_adler]' are reserved for your research.\n\nRebuild the restricted index card files, audit the missing seals, and ensure no forbidden knowledge escapes the vaults.\n\nChief Archivist,\n[fact:Master:case01/master]",
    backgroundUrl: CASE01_TRAIN_COMPARTMENT_BG,
    narrativePresentation: "letter",
    narrativeLayout: "letter_overlay",
    sceneGroupId: "train_compartment",
    letterOverlayRevealDelayMs: 2800,
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_COMPARTMENT_LETTER_ARCHIVIST",
        text: "Continue.",
        nextNodeId: "scene_case01_train_assistant_intro",
      },
    ],
  },
  {
    id: "scene_case01_train_compartment_letter_witch",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Recruitment Invitation",
    bodyOverride:
      "Дитя моё.\n\nБюро приветствует ваше прибытие во Фрайбург. Город полон не только обычных тайн, но и тех, что сокрыты глубоко за духовной завесой. Ваши врожденные способности к ведовству будут крайне полезны.\n\nЖду вас в секретном отделе архивов Бюро — это приглашение действительно немедленно по приезде. Также учтите, что старый особняк Гранд-Эстейт на окраине скрывает беспокойную сущность, расследованием которой вам предстоит заняться.\n\nС уважением,\n[fact:Master:case01/master]",
    backgroundUrl: CASE01_TRAIN_COMPARTMENT_BG,
    narrativePresentation: "letter",
    narrativeLayout: "letter_overlay",
    sceneGroupId: "train_compartment",
    letterOverlayRevealDelayMs: 2800,
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_COMPARTMENT_LETTER_WITCH",
        text: "Continue.",
        nextNodeId: "scene_case01_train_assistant_intro",
      },
    ],
  },
  {
    id: "scene_case01_train_assistant_intro",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Narrator]**:\nДверь в купе открывается со скрипом, и в проеме возникает высокая фигура с выдающимися скулами, из-за которых вошедший казался намного старше своих лет.\n\n**[Assistant]**:\n— Сэр, я проверил во время остановки: в газетах пусто, по радио тоже тишина.\n\n**[inner_cynic]**:\nТишина — это не отсутствие звука. Это присутствие чьей-то очень дорогой воли.",
    backgroundUrl: CASE01_TRAIN_ASSISTANT_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
    characterId: "npc_felix_hartmann",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_ASSISTANT_INTRO",
        text: "Continue.",
        nextNodeId: "scene_case01_train_door_creaks",
      },
    ],
  },
  {
    id: "scene_case01_train_door_creaks",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Assistant]**:\n— Вы уверены, что это не розыгрыш?",
    backgroundUrl: CASE01_TRAIN_ASSISTANT_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
    characterId: "npc_felix_hartmann",
    choices: [
      {
        id: "CASE01_TRAIN_DOOR_CREAKS_LOGIC",
        text: "Письмо доставлено частной службой, бумага и чернила стоят недешево. Розыгрыш обошелся бы слишком дорого.",
        nextNodeId: "scene_case01_train_assistant_departure",
        inlineText: "**[Assistant]**:\n— Вы правы, сэр. Не стали бы они арендовать нам номер просто так.",
        effects: [
          { type: "add_var", key: "attr_logic", value: 1 },
          {
            type: "change_inner_voice_rank",
            voiceId: "inner_analyst",
            delta: 1,
          },
        ],
        innerVoiceHints: [
          {
            voiceId: "inner_analyst",
            stance: "supports",
            text: "Холодный расчет прежде всего."
          }
        ]
      },
      {
        id: "CASE01_TRAIN_DOOR_CREAKS_AUTHORITY",
        text: "Не имеет значения, розыгрыш это или нет. Нам бросили вызов, и мы не имеем права его игнорировать.",
        nextNodeId: "scene_case01_train_assistant_departure",
        inlineText: "**[Assistant]**:\n— Полностью согласен, сэр. Мы не можем оставить это без внимания.",
        effects: [
          { type: "add_var", key: "attr_authority", value: 1 },
          {
            type: "change_inner_voice_rank",
            voiceId: "inner_leader",
            delta: 1,
          },
        ],
        innerVoiceHints: [
          {
            voiceId: "inner_leader",
            stance: "supports",
            text: "Дисциплина и долг не терпят сомнений."
          }
        ]
      },
      {
        id: "CASE01_TRAIN_DOOR_CREAKS_INTUITION",
        text: "Что-то мне подсказывает, что за этим письмом кроется нечто гораздо большее, чем кажется на первый взгляд.",
        nextNodeId: "scene_case01_train_assistant_departure",
        inlineText: "**[Assistant]**:\n— Ваше чутье вас редко подводит, сэр. Будем настороже.",
        effects: [
          { type: "add_var", key: "attr_intuition", value: 1 },
          {
            type: "change_inner_voice_rank",
            voiceId: "inner_guide",
            delta: 1,
          },
        ],
        innerVoiceHints: [
          {
            voiceId: "inner_guide",
            stance: "supports",
            text: "Слушай свой внутренний голос. Здесь скрыта тайна."
          }
        ]
      }
    ],
  },
  {
    id: "scene_case01_train_assistant_departure",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Assistant]**:\n— Мы скоро прибудем на место. Я схожу в вагон-ресторан за матушкой.",
    backgroundUrl: CASE01_TRAIN_ASSISTANT_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
    characterId: "npc_felix_hartmann",
    choices: [
      {
        id: "CASE01_TRAIN_ASSISTANT_LEADER_COMMITMENT",
        text: "Give Felix a clear order: keep the compartment together until Freiburg.",
        nextNodeId: CASE01_DINING_NODE_IDS.intro,
        visibleIfAll: [
          { type: "inner_voice_rank_gte", voiceId: "inner_leader", value: 1 },
        ],
        innerVoiceHints: [
          {
            voiceId: "inner_leader",
            stance: "supports",
            text: "A group survives the crossing when someone accepts command.",
          },
          {
            voiceId: "inner_cynic",
            stance: "opposes",
            text: "Authority makes you visible before the city has shown its teeth.",
          },
        ],
        effects: [
          {
            type: "discover_fact",
            caseId: "case_bankhaus_krebs_false_trail",
            factId: "fact_inner_leader_route_committed",
          },
          {
            type: "track_event",
            eventName: "inner_leader_train_commitment",
            tags: { voiceId: "inner_leader" },
          },
        ],
      },
      {
        id: "CASE01_TRAIN_ASSISTANT_EAT_TOGETHER",
        text: "Wait for me! I've worked up an appetite—I need a bite to eat.",
        nextNodeId: CASE01_DINING_NODE_IDS.intro,
        effects: [
          {
            type: "change_relationship",
            characterId: "npc_felix_hartmann",
            delta: 1,
          },
        ],
      },
      {
        id: "CASE01_TRAIN_ASSISTANT_MEET_LATER",
        text: "Say nothing",
        nextNodeId: "scene_case01_train_silent_beat",
      },
    ],
  },
  {
    id: "scene_case01_train_silent_beat",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride:
      "**[Narrator]**:\nA short nod. The door slams shut. The rest of the journey you spend in the company of the letter and your growing distrust.",
    backgroundUrl: CASE01_TRAIN_ASSISTANT_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_SILENT_BEAT",
        text: "Continue.",
        nextNodeId: CASE01_TRAIN_HUB_NODE_ID,
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.compartment)],
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.intro,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Narrator]**:\nThe dining car greets you with the chime of crystal and the scent of expensive tobacco. Felix leads the way with confidence through the rows of tables.\n\n**[Assistant]**:\n— Mother always finds company, even on a train. It seems she's already made an acquaintance. Try to be... indulgent with her directness.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
    choices: [
      {
        id: "AUTO_CONTINUE_DINING_CAR_INTRO",
        text: "Continue.",
        nextNodeId: CASE01_DINING_NODE_IDS.mother,
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.mother,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Narrator]**:\nЗа угловым столиком расположилась матушка Феликса. Она неторопливо потягивала белое вино, внимательно слушая свою спутницу — девушку с ярко-рыжими волосами, которая что-то оживленно рассказывала, активно жестикулируя. Огненный цвет ее волос казался вызывающе ярким в приглушенном утреннем свете вагона.\n\n**[Redhead]**:\n— ...и этот чиновник всерьез грозился засудить телеграфную службу, потому что точки в его депеше показались ему «недостаточно почтительными»... Это же просто смешно... Элеонора?",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
    onEnter: [
      { type: "set_flag", key: CASE01_DINING_FLAGS.metMother, value: true },
      { type: "set_flag", key: CASE01_DINING_FLAGS.metFelix, value: true },
      { type: "set_flag", key: CASE01_DINING_FLAGS.metRedhead, value: true },
    ],
    choices: [
      {
        id: "AUTO_CONTINUE_DINING_CAR_MOTHER",
        text: "Continue.",
        nextNodeId: CASE01_DINING_NODE_IDS.motherMonologueHappiness,
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.motherMonologueHappiness,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride:
      "**[Redhead]**:\n— Слушай, рядом многие не ощущают праздника жизни. А вот мы едем, смотри, это уже счастье.\n\n**[Eleonora]**:\n— Не сутулься.\n\n**[Redhead]**:\n— Мы разговариваем, это тоже счастье, посмотри. Я всегда удивляюсь — вот он скучающе едет и скучающе смотрит...",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
    choices: [
      {
        id: "AUTO_CONTINUE_DINING_CAR_LOTTE_MONOLOGUE_HAPPINESS",
        text: "Continue.",
        nextNodeId: CASE01_DINING_NODE_IDS.motherMonologueChosen,
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.motherMonologueChosen,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride:
      "**[Narrator]**:\nВзгляд Лотте на мгновение задерживается на соседнем столике — там пожилой господин в традиционном баденском платье смотрит в окно с тем же затухшим выражением.\n\n**[Redhead]**:\n— Да понимает ли он, что он избранник? От одного этого с ума можно сойти. Избранник мироздания. Вынули на секунду из небытия — и через секунду опять вечная тьма несуществования. Да ведь он вопить от радости должен, что живёт, а ему скучно... Элеонора?",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_OLD_BADENER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
    choices: [
      {
        id: "AUTO_CONTINUE_DINING_CAR_LOTTE_MONOLOGUE_CHOSEN",
        text: "Continue.",
        nextNodeId: CASE01_DINING_NODE_IDS.motherReaction,
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.motherReaction,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Assistant]**:\n— Матушка, мы решили выпить перед прибытием. Не представите нас вашей спутнице?",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_EYE_CONTACT_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
    choices: [
      {
        id: "AUTO_CONTINUE_DINING_CAR_MOTHER_REACTION",
        text: "Continue.",
        nextNodeId: CASE01_DINING_NODE_IDS.marriageJoke,
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.marriageJoke,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_GROUP_BG,
    bodyOverride: "**[Элеонора]**:\n— Разумеется. Лотте Вебер. О Фрайбурге она знает улицы, людей и такие двери, которые приличные дома предпочитают не замечать. А это — мой сын Феликс Хартманн. Он смотрит в окно, когда хочет, чтобы разговор обошелся без него.\n\n**[Лотте]**:\n— Элеонора делает из меня почти учреждение. Я всего лишь запоминаю, куда люди торопятся, когда уверяют, что просто гуляют.",
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
    choices: [
      {
        id: "CASE01_TRAIN_DINING_SILENT",
        text: "Stay silent",
        nextNodeId: CASE01_DINING_NODE_IDS.silentBranch,
      },
      {
        id: "CASE01_TRAIN_DINING_INTRO_SELF",
        text: "Introduce yourself",
        nextNodeId: CASE01_DINING_NODE_IDS.introSelfBranch,
      },
      {
        id: "CASE01_TRAIN_DINING_HOTEL",
        text: "— Pardon the interruption—since you know the city so well, have you heard of the Zum Eber hotel?",
        nextNodeId: CASE01_DINING_NODE_IDS.hotelBranch,
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.silentBranch,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Assistant]**:\n— Извините. Это детектив [Name]. Он помогает нам с переездом.\n\n**[Narrator]**:\nФеликс произносит «нам» без всякого тепла, но вовремя: неловкость успевает стать его, а не вашей.\n\n**[Лотте]**:\n— Тогда будем знакомы. Люди, которые умеют молчать за столом, во Фрайбурге долго не останутся незамеченными.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_GROUP_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
    choices: [
      {
        id: "AUTO_CONTINUE_DINING_SILENT",
        text: "Continue.",
        nextNodeId: CASE01_DINING_NODE_IDS.wineBeat,
        effects: [
          {
            type: "set_flag",
            key: CASE01_DINING_FLAGS.silentObservation,
            value: true,
          },
        ],
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.introSelfBranch,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Detective]**:\n— Разрешите представиться. Детектив [Name]. Прибыл во Фрайбург по делу.\n\n**[Narrator]**:\nЭлеонора повторяет ваше имя беззвучно, одними губами, будто примеряет его к будущей карточке на столе.\n\n**[Лотте]**:\n— Лотте Вебер. Рада встрече, детектив. По делу — тоже, раз уж оно привело вас в наш вагон.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_GROUP_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
    choices: [
      {
        id: "AUTO_CONTINUE_DINING_INTRO_SELF",
        text: "Continue.",
        nextNodeId: CASE01_DINING_NODE_IDS.wineBeat,
        effects: [
          {
            type: "set_flag",
            key: CASE01_DINING_FLAGS.introducedSelf,
            value: true,
          },
        ],
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.hotelBranch,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Лотте]**:\n— «Zum Eber»? Хороший выбор. Старый камень, тяжелые портьеры, постояльцы, которым нравится, когда их не замечают.\n\n**[Narrator]**:\nОна произносит название без вопроса. Не вспоминает — сверяет.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_GROUP_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
    choices: [
      {
        id: "AUTO_CONTINUE_DINING_HOTEL",
        text: "Continue.",
        nextNodeId: CASE01_DINING_NODE_IDS.wineBeat,
        effects: [
          {
            type: "set_flag",
            key: CASE01_DINING_FLAGS.askedLodgingRoute,
            value: true,
          },
          {
            type: "set_flag",
            key: CASE01_DINING_FLAGS.askedZumGoldenenAdler,
            value: true,
          },
        ],
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.wineBeat,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Элеонора]**:\n— Попробуйте. Маркграфлерланд.\n\n**[Narrator]**:\nОфициант берет бутылку за основание, оставляет этикетку на виду и льет медленно, тонкой ровной струйкой. В конце бутылка едва поворачивается, и скатерть остается чистой.\n\n**[Элеонора]**:\n— Не бойтесь — это не экзамен. Пока не экзамен.\n\n**[attr_tradition]**:\nОфициант не спрашивает. Он знает, в чей бокал лить первым.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_WINE_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_mother_hartmann",
    passiveChecks: [
      {
        id: "check_case01_wine_perception",
        voiceId: "attr_perception",
        difficulty: 8,
        showChancePercent: false,
        isPassive: true,
        onSuccess: {
          effects: [
            { type: "grant_xp", amount: 5 },
            { type: "set_flag", key: CASE01_DINING_FLAGS.noticedRingRemoved, value: true },
          ],
          inlineText:
            "**[Perception — Успех]**:\nЕё пальцы — ухоженные, но не праздные. На безымянном — след от кольца, снятого недавно. Она привыкла управлять тем, что видят другие.",
        },
      },
    ],
    choices: [
      {
        id: "CASE01_WINE_ACCEPT",
        text: "Принять бокал.",
        nextNodeId: CASE01_DINING_NODE_IDS.felixInterrupts,
        effects: [
          { type: "set_flag", key: CASE01_DINING_FLAGS.jokedWithMother, value: true },
          {
            type: "set_flag",
            key: CASE01_DINING_FLAGS.acceptedEleonoraHospitality,
            value: true,
          },
        ],
      },
      {
        id: "CASE01_WINE_DECLINE",
        text: "Вежливо отклониться.",
        nextNodeId: CASE01_DINING_NODE_IDS.felixInterrupts,
        effects: [
          {
            type: "set_flag",
            key: CASE01_DINING_FLAGS.declinedEleonoraHospitality,
            value: true,
          },
        ],
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.felixInterrupts,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Narrator]**:\nЗа перегородкой щелкает микрофон. Кондуктор объявляет: до Фрайбурга двадцать минут.\n\n**[Assistant]**:\n— Двадцать минут. Пора убирать.\n\n**[Narrator]**:\nЭлеонора смотрит на него поверх бокала. Не спорит.\n\n**[Элеонора]**:\n— Хорошо. Убирайте.\n\n**[Narrator]**:\nЛотте закрывает блокнот синхронно с объявлением — ни секундой раньше, ни секундой позже.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_FELIX_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_felix_hartmann",
    passiveChecks: [
      {
        id: "check_case01_felix_empathy",
        voiceId: "attr_empathy",
        difficulty: 11,
        showChancePercent: false,
        isPassive: true,
        onSuccess: {
          effects: [
            { type: "grant_xp", amount: 5 },
            { type: "set_flag", key: CASE01_DINING_FLAGS.noticedFelixApathy, value: true },
          ],
          inlineText:
            "**[Empathy — Успех]**:\nОн не раздражён. Он устал. Устал быть представленным как приложение к матери. Взгляд на часы — не нетерпение, а единственный приличный способ прервать разговор, который за него уже ведут.",
        },
      },
    ],
    choices: [
      {
        id: "CASE01_FELIX_DEFEND",
        text: "Поддержать паузу и помочь свернуть разговор.",
        nextNodeId: CASE01_DINING_NODE_IDS.eleonoraFarewell,
        visibleIfAll: [
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.silentObservation,
              value: true,
            },
          },
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.askedZumGoldenenAdler,
              value: true,
            },
          },
        ],
        effects: [
          { type: "set_flag", key: CASE01_DINING_FLAGS.defendedFelix, value: true },
          { type: "change_relationship", characterId: "npc_felix_hartmann", delta: 1 },
        ],
      },
      {
        id: "CASE01_FELIX_DEFEND_SILENT",
        text: "Поддержать паузу и помочь свернуть разговор.",
        nextNodeId: CASE01_DINING_FAREWELL_NODE_IDS.silentDefend,
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.silentObservation,
            value: true,
          },
        ],
        effects: [
          { type: "set_flag", key: CASE01_DINING_FLAGS.defendedFelix, value: true },
          { type: "change_relationship", characterId: "npc_felix_hartmann", delta: 1 },
        ],
      },
      {
        id: "CASE01_FELIX_DEFEND_HOTEL",
        text: "Поддержать паузу и помочь свернуть разговор.",
        nextNodeId: CASE01_DINING_FAREWELL_NODE_IDS.hotelDefend,
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.askedZumGoldenenAdler,
            value: true,
          },
        ],
        effects: [
          { type: "set_flag", key: CASE01_DINING_FLAGS.defendedFelix, value: true },
          { type: "change_relationship", characterId: "npc_felix_hartmann", delta: 1 },
        ],
      },
      {
        id: "CASE01_FELIX_OBSERVE",
        text: "Проследить, что именно убирает Лотте.",
        nextNodeId: CASE01_DINING_FAREWELL_NODE_IDS.introObserve,
        visibleIfAll: [
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.silentObservation,
              value: true,
            },
          },
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.askedZumGoldenenAdler,
              value: true,
            },
          },
        ],
        effects: [
          {
            type: "set_flag",
            key: CASE01_DINING_FLAGS.noticedLotteSchedule,
            value: true,
          },
        ],
      },
      {
        id: "CASE01_FELIX_OBSERVE_SILENT",
        text: "Проследить, что именно убирает Лотте.",
        nextNodeId: CASE01_DINING_FAREWELL_NODE_IDS.silentObserve,
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.silentObservation,
            value: true,
          },
        ],
        effects: [
          {
            type: "set_flag",
            key: CASE01_DINING_FLAGS.noticedLotteSchedule,
            value: true,
          },
        ],
      },
      {
        id: "CASE01_FELIX_OBSERVE_HOTEL",
        text: "Проследить, что именно убирает Лотте.",
        nextNodeId: CASE01_DINING_FAREWELL_NODE_IDS.hotelObserve,
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.askedZumGoldenenAdler,
            value: true,
          },
        ],
        effects: [
          {
            type: "set_flag",
            key: CASE01_DINING_FLAGS.noticedLotteSchedule,
            value: true,
          },
        ],
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.eleonoraFarewell,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Narrator]**:\nОна поднимается первой. Лотте убирает блокнот в карман пальто — не в сумку. Элеонора касается плеча Феликса: мимолётно, будто поправляя воротник.\n\n**[Лотте]**:\n— До встречи, [Name]. Фрайбург маленький — а имена в нём ходят быстрее людей.\n\n**[Элеонора]**:\n— Фрайбург нас ждёт. Впрочем, Фрайбург всегда ждёт.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_GROUP_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_mother_hartmann",
    choices: [
      {
        id: "AUTO_CONTINUE_ELEONORA_FAREWELL",
        text: "Continue.",
        nextNodeId: "scene_case01_corridor_reflection",
      },
    ],
  },
  {
    id: CASE01_DINING_FAREWELL_NODE_IDS.silentDefend,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride:
      "**[Narrator]**:\nОна поднимается первой. Лотте убирает блокнот в карман пальто — не в сумку. Элеонора касается плеча Феликса: мимолётно, будто поправляя воротник.\n\n**[Лотте]**:\n— До встречи. Вы хороший слушатель — для детектива это редкость. Обычно они говорят, пока собеседник не сдастся.\n\n**[Элеонора]**:\n— Фрайбург нас ждёт. Впрочем, Фрайбург всегда ждёт.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_GROUP_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_mother_hartmann",
    choices: [
      {
        id: "AUTO_CONTINUE_ELEONORA_FAREWELL_SILENT_DEFEND",
        text: "Continue.",
        nextNodeId: "scene_case01_corridor_reflection_silent_defend",
      },
    ],
  },
  {
    id: CASE01_DINING_FAREWELL_NODE_IDS.hotelDefend,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride:
      "**[Narrator]**:\nОна поднимается первой. Лотте убирает блокнот в карман пальто — не в сумку. Элеонора касается плеча Феликса: мимолётно, будто поправляя воротник.\n\n**[Лотте]**:\n— До встречи, детектив. «Zum Eber» — хороший выбор. Если вдруг переедете, я обычно знаю раньше хозяина.\n\n**[Элеонора]**:\n— Фрайбург нас ждёт. Впрочем, Фрайбург всегда ждёт.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_GROUP_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_mother_hartmann",
    choices: [
      {
        id: "AUTO_CONTINUE_ELEONORA_FAREWELL_HOTEL_DEFEND",
        text: "Continue.",
        nextNodeId: "scene_case01_corridor_reflection_hotel_defend",
      },
    ],
  },
  {
    id: CASE01_DINING_FAREWELL_NODE_IDS.introObserve,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride:
      "**[Narrator]**:\nВы успеваете увидеть страницу: не фразы, а столбик времени — 08:12, 08:27, 08:41. Одна строка зачёркнута так ровно, будто это не пометка, а отменённый маршрут.\n\nЛотте убирает блокнот в карман пальто — не в сумку. Элеонора касается плеча Феликса: мимолётно, будто поправляя воротник.\n\n**[Лотте]**:\n— До встречи, [Name]. Фрайбург маленький — а имена в нём ходят быстрее людей.\n\n**[Элеонора]**:\n— Фрайбург нас ждёт. Впрочем, Фрайбург всегда ждёт.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_GROUP_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_mother_hartmann",
    choices: [
      {
        id: "AUTO_CONTINUE_ELEONORA_FAREWELL_INTRO_OBSERVE",
        text: "Continue.",
        nextNodeId: "scene_case01_corridor_reflection_intro_observe",
      },
    ],
  },
  {
    id: CASE01_DINING_FAREWELL_NODE_IDS.silentObserve,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Narrator]**:\nВы успеваете увидеть страницу: не фразы, а столбик времени — 08:12, 08:27, 08:41. Одна строка зачёркнута так ровно, будто это не пометка, а отменённый маршрут.\n\nЛотте убирает блокнот в карман пальто — не в сумку. Элеонора касается плеча Феликса: мимолётно, будто поправляя воротник.\n\n**[Лотте]**:\n— До встречи. Вы хороший слушатель — для детектива это редкость. Обычно они говорят, пока собеседник не сдастся.\n\n**[Элеонора]**:\n— Фрайбург нас ждёт. Впрочем, Фрайбург всегда ждёт.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_GROUP_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_mother_hartmann",
    choices: [
      {
        id: "AUTO_CONTINUE_ELEONORA_FAREWELL_SILENT_OBSERVE",
        text: "Continue.",
        nextNodeId: "scene_case01_corridor_reflection_silent_observe",
      },
    ],
  },
  {
    id: CASE01_DINING_FAREWELL_NODE_IDS.hotelObserve,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Narrator]**:\nВы успеваете увидеть страницу: не фразы, а столбик времени — 08:12, 08:27, 08:41. Рядом с нижней строкой стоит ваше имя, ещё без титула.\n\nЛотте убирает блокнот в карман пальто — не в сумку. Элеонора касается плеча Феликса: мимолётно, будто поправляя воротник.\n\n**[Лотте]**:\n— До встречи, детектив. «Zum Eber» — хороший выбор. Если вдруг переедете, я обычно знаю раньше хозяина.\n\n**[Элеонора]**:\n— Фрайбург нас ждёт. Впрочем, Фрайбург всегда ждёт.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_GROUP_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_mother_hartmann",
    choices: [
      {
        id: "AUTO_CONTINUE_ELEONORA_FAREWELL_HOTEL_OBSERVE",
        text: "Continue.",
        nextNodeId: "scene_case01_corridor_reflection_hotel_observe",
      },
    ],
  },
  {
    id: "scene_case01_corridor_reflection",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Corridor Reflection",
    bodyOverride:
      "**[Narrator]**:\nВ купе тихо. Только ритм рельсов и мысли, которые ещё не оформились в вопросы.\n\n**[attr_intuition]**:\nТри попутчика. Один обед. Достаточно ли этого, чтобы понять — стоит ли им доверять? Или правильнее — стоит ли, чтобы они начали доверять вам?",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_GROUP_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_corridor",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_CORRIDOR_REFLECTION",
        text: "Поезд замедляется.",
        nextNodeId: CASE01_TRAIN_HUB_NODE_ID,
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.corridor)],
      },
    ],
  },
  {
    id: "scene_case01_corridor_reflection_silent_defend",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Corridor Reflection",
    bodyOverride:
      "**[Narrator]**:\nФеликс не поблагодарил. Но он заметил — это видно по тому, как он НЕ посмотрел в вашу сторону при прощании. Молчание тоже разведка. Они говорили — вы слушали. Теперь вопрос: что из услышанного пригодится.\n\n**[attr_intuition]**:\nТри попутчика. Один обед. Достаточно ли этого, чтобы понять — стоит ли им доверять? Или правильнее — стоит ли, чтобы они начали доверять вам?",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_GROUP_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_corridor",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_CORRIDOR_REFLECTION_SILENT_DEFEND",
        text: "Поезд замедляется.",
        nextNodeId: CASE01_TRAIN_HUB_NODE_ID,
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.corridor)],
      },
    ],
  },
  {
    id: "scene_case01_corridor_reflection_hotel_defend",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Corridor Reflection",
    bodyOverride:
      "**[Narrator]**:\nФеликс не поблагодарил. Но он заметил — это видно по тому, как он НЕ посмотрел в вашу сторону при прощании.\n\n**[attr_intuition]**:\nТри попутчика. Один обед. Достаточно ли этого, чтобы понять — стоит ли им доверять? Или правильнее — стоит ли, чтобы они начали доверять вам?",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_GROUP_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_corridor",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_CORRIDOR_REFLECTION_HOTEL_DEFEND",
        text: "Поезд замедляется.",
        nextNodeId: CASE01_TRAIN_HUB_NODE_ID,
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.corridor)],
      },
    ],
  },
  {
    id: "scene_case01_corridor_reflection_intro_observe",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Corridor Reflection",
    bodyOverride:
      "**[Narrator]**:\nУсталость Феликса бросалась в глаза. Двадцать минут до Фрайбурга — и он считает каждую.\n\n**[attr_intuition]**:\nТри попутчика. Один обед. Достаточно ли этого, чтобы понять — стоит ли им доверять? Или правильнее — стоит ли, чтобы они начали доверять вам?",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_GROUP_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_corridor",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_CORRIDOR_REFLECTION_INTRO_OBSERVE",
        text: "Поезд замедляется.",
        nextNodeId: CASE01_TRAIN_HUB_NODE_ID,
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.corridor)],
      },
    ],
  },
  {
    id: "scene_case01_corridor_reflection_silent_observe",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Corridor Reflection",
    bodyOverride:
      "**[Narrator]**:\nМолчание тоже разведка. Они говорили — вы слушали. Теперь вопрос: что из услышанного пригодится.\n\n**[attr_intuition]**:\nТри попутчика. Один обед. Достаточно ли этого, чтобы понять — стоит ли им доверять? Или правильнее — стоит ли, чтобы они начали доверять вам?",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_GROUP_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_corridor",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_CORRIDOR_REFLECTION_SILENT_OBSERVE",
        text: "Поезд замедляется.",
        nextNodeId: CASE01_TRAIN_HUB_NODE_ID,
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.corridor)],
      },
    ],
  },
  {
    id: "scene_case01_corridor_reflection_hotel_observe",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Corridor Reflection",
    bodyOverride:
      "**[Narrator]**:\nВ купе тихо. Только ритм рельсов и мысли о гостинице «Zum Eber», которая вас ожидает.\n\n**[attr_intuition]**:\nТри попутчика. Один обед. Достаточно ли этого, чтобы понять — стоит ли им доверять? Или правильнее — стоит ли, чтобы они начали доверять вам?",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_GROUP_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_corridor",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_CORRIDOR_REFLECTION_HOTEL_OBSERVE",
        text: "Поезд замедляется.",
        nextNodeId: CASE01_TRAIN_HUB_NODE_ID,
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.corridor)],
      },
    ],
  },

  {
    id: CASE01_TRAIN_HUB_NODE_ID,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Train Map",
    bodyOverride:
      "**[Narrator]**:\nThe train sways underfoot. Fog gathers against the windows, and Freiburg is close enough now to feel like a decision rather than a destination.",
    backgroundUrl: CASE01_TRAIN_COMPARTMENT_BG,
    narrativeLayout: "log",
    interactionMode: "hub",
    sceneGroupId: "train_corridor",
    hubSchema: trainHubSchema,
    choices: [
      {
        id: "hub_to_compartment_revisit",
        text: "Return to the compartment",
        nextNodeId: "scene_case01_train_compartment_revisit",
        hotspot: {
          zoneId: CASE01_TRAIN_HUB_ZONE_IDS.compartment,
          priority: 10,
        },
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.compartment)],
      },
      {
        id: "hub_to_corridor_revisit",
        text: "Step into the corridor",
        nextNodeId: "scene_case01_train_corridor_revisit",
        hotspot: {
          zoneId: CASE01_TRAIN_HUB_ZONE_IDS.corridor,
          priority: 10,
        },
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.corridor)],
      },
      {
        id: "hub_to_dining_first_visit",
        text: "Find Felix in the dining car",
        nextNodeId: CASE01_DINING_NODE_IDS.intro,
        visibleIfAll: [
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.metMother,
              value: true,
            },
          },
        ],
        hotspot: {
          zoneId: CASE01_TRAIN_HUB_ZONE_IDS.diningCar,
          priority: 20,
        },
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.diningCar)],
      },
      {
        id: "hub_to_dining_revisit",
        text: "Look back into the dining car",
        nextNodeId: "scene_case01_train_dining_car_revisit",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.metMother,
            value: true,
          },
        ],
        hotspot: {
          zoneId: CASE01_TRAIN_HUB_ZONE_IDS.diningCar,
          priority: 10,
        },
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.diningCar)],
      },
      {
        id: "hub_to_vestibule_revisit",
        text: "Check the vestibule",
        nextNodeId: "scene_case01_train_vestibule_revisit",
        hotspot: {
          zoneId: CASE01_TRAIN_HUB_ZONE_IDS.vestibule,
          priority: 10,
        },
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.vestibule)],
      },
      {
        id: "hub_continue_to_arrival",
        text: "Prepare for arrival",
        nextNodeId: "scene_case01_train_ankommen_video",
      },
    ],
  },
  {
    id: "scene_case01_train_compartment_revisit",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Compartment",
    bodyOverride:
      "**[Narrator]**:\nYour compartment is quiet again. The letter waits where you left it, folded with bureaucratic precision.",
    backgroundUrl: CASE01_TRAIN_COMPARTMENT_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_compartment",
    onEnter: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.compartment)],
    choices: [{ ...returnToTrainHubChoice }],
  },
  {
    id: "scene_case01_train_corridor_revisit",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Corridor",
    bodyOverride:
      "**[Narrator]**:\nThe corridor narrows each passing thought. Beyond the glass, the countryside blurs into grey-green lines.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_GROUP_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_corridor",
    onEnter: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.corridor)],
    choices: [{ ...returnToTrainHubChoice }],
  },
  {
    id: "scene_case01_train_dining_car_revisit",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Dining Car",
    bodyOverride:
      "**[Narrator]**:\nThe dining car has settled into polite aftermath: cooling cups, folded napkins, and the trace of a conversation that ended too neatly.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_GROUP_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    onEnter: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.diningCar)],
    choices: [{ ...returnToTrainHubChoice }],
  },
  {
    id: "scene_case01_train_vestibule_revisit",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Vestibule",
    bodyOverride:
      "**[Narrator]**:\nCold air leaks around the carriage door. The metal handle trembles with every turn of the wheels.",
    backgroundUrl: CASE01_TRAIN_ASSISTANT_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_vestibule",
    onEnter: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.vestibule)],
    choices: [{ ...returnToTrainHubChoice }],
  },
  {
    id: "scene_case01_train_ankommen_video",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Approach to Freiburg",
    bodyOverride: "",
    backgroundVideoUrl: `${CASE01_START_VIDEO_BASE_PATH}/Ankommen.mp4`,
    backgroundVideoPosterUrl: CASE01_PLATFORM_STILL_BG,
    narrativeLayout: "fullscreen",
    sceneGroupId: "train_ankommen_video",
    advanceOnVideoEnd: true,
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_ANKOMMEN_VIDEO",
        text: "Continue.",
        nextNodeId: "scene_case01_train_voza_cutscene",
      },
    ],
  },
  {
    id: "scene_case01_train_voza_cutscene",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Platform Landing",
    bodyOverride:
      "**[Narrator]**:\nПар бьёт в лицо — отдых кончился. Вокзал грубый: чугунные балки, стекло в копоти, носильщики с тележками; пахнет углём и мокрой шерстью.\n\nЧасы над перроном показывают 08:47. Город уже на ногах — и не обязан был подстраиваться под ваше пробуждение.\n\n**[attr_encyclopedia]**:\nНеоренессанс. Построено при расширении Баденских железных дорог. Базель в часе пути, Страсбург — в двух. Для контрабанды и побегов — идеальный узел.",
    backgroundVideoUrl: `${CASE01_START_VIDEO_BASE_PATH}/Video_voza_na_peronu.mp4`,
    backgroundVideoPosterUrl: CASE01_HBF_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_platform_landing",
    passiveChecks: [
      {
        id: "check_voza_spot_fritz",
        voiceId: "attr_perception",
        difficulty: 6,
        showChancePercent: false,
        isPassive: true,
        onSuccess: {
          effects: [
            { type: "grant_xp", amount: 3 },
            { type: "set_flag", key: "flag_spotted_fritz_early", value: true },
          ],
          inlineText:
            "**[Perception — Успех]:**\nВ толпе — форма. Не железнодорожная: полицейская. Кто-то ждёт, и ждёт именно вас. Рука в кармане, взгляд по перрону — ищет не вагон, а лицо.",
        },
      }
    ],
    choices: [
      {
        id: "AUTO_CONTINUE_VOZA_TO_HBF",
        text: "Сойти на платформу.",
        nextNodeId: "scene_case01_hbf_porter_greeting",
      },
    ],
  },
  {
    id: "scene_case01_hbf_porter_greeting",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "The Porter",
    bodyOverride: "",
    backgroundUrl: CASE01_PLATFORM_STILL_BG,
    narrativeLayout: "log",
    sceneGroupId: "platform_disembark",
    choices: [
      {
        id: "CHOICE_PORTER_HOSPITALITY",
        text: "Continue.",
        nextNodeId: "scene_case01_train_disembark_journal",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.acceptedEleonoraHospitality,
            value: true,
          }
        ],
        inlineText: "**[Носильщик]**:\n— Добро пожаловать во Фрайбург, господин. Экипаж госпожи Хартманн ожидает у южного выхода. Позвольте ваш багаж?\n\n**[Narrator]**:\nОн кланяется — не глубоко, но с той профессиональной точностью, которая выдаёт привычку обслуживать тех, кто платит золотом."
      },
      {
        id: "CHOICE_PORTER_DEFAULT",
        text: "Continue.",
        nextNodeId: "scene_case01_train_disembark_journal",
        visibleIfAll: [
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.acceptedEleonoraHospitality,
              value: true,
            }
          }
        ],
        inlineText: "**[Носильщик]**:\n— Извозчики слева, господин. Не задерживайте проход.\n\n**[Narrator]**:\nОн проходит мимо, даже не взглянув на вас. Во Фрайбурге уважение — это валюта, которую вы ещё не заработали."
      }
    ]
  },
  {
    id: "scene_case01_train_disembark_journal",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "On the platform",
    bodyOverride:
      "The platform receives you like a room that was warned in advance.\n\nOne part of your mind starts counting exits, uniforms, luggage carts, the honest geometry of escape. Another part notices the silence first: no public outrage, no raised voices, no appetite for scandal. Freiburg has decided to keep its pulse hidden.\n\nA third, less useful but never absent, whispers that the city already knows your name and resents you for arriving late.\n\nGood. Let it resent. Silence is still testimony, if you stand inside it long enough.",
    backgroundUrl: CASE01_PLATFORM_STILL_BG,
    narrativeLayout: "log",
    sceneGroupId: "platform_disembark",
    characterId: "inspector",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_DISEMBARK_JOURNAL",
        text: "Continue.",
        nextNodeId: "scene_case01_train_platform_parting",
      },
    ],
  },
  {
    id: "scene_case01_train_platform_parting",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Parting",
    bodyOverride: "**[Элеонора]**:\n— Что ж, Феликс. Фрайбург не терпит опозданий. Детектив, присмотрите за ним. Он склонен теряться в… деталях, забывая о главном.\n\n**[Лотте]**:\n— На перроне лучше не останавливаться, детектив. Здесь даже прощания занимают очередь.\n\n**[Narrator]**:\nОни уходят в толпу — Элеонора и Лотте, плечом к плечу, негромко разговаривая. Рыжие волосы Лотте — последнее яркое пятно в сером паре перрона. За ними остаётся запах дорогого табака и след невысказанных обещаний.",
    backgroundUrl: CASE01_PLATFORM_FAREWELL_BG,
    narrativeLayout: "log",
    sceneGroupId: "platform_disembark",
    choices: [
      {
        id: "CHOICE_PARTING_INTRO_SELF_ECHO",
        text: "Continue.",
        nextNodeId: "scene_case01_hbf_echo_intro_self",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.introducedSelf,
            value: true,
          },
        ],
      },
      {
        id: "CHOICE_PARTING_ACCEPTED_HOSPITALITY_ECHO",
        text: "Continue.",
        nextNodeId: "scene_case01_hbf_echo_hospitality_accepted",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.acceptedEleonoraHospitality,
            value: true,
          },
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.introducedSelf,
              value: true,
            },
          },
        ],
      },
      {
        id: "CHOICE_PARTING_SECRET",
        text: "Continue.",
        nextNodeId: "scene_case01_beat1_atmosphere",
        visibleIfAll: [
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.introducedSelf,
              value: true,
            },
          },
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.acceptedEleonoraHospitality,
              value: true,
            },
          },
          {
            type: "logic_or",
            conditions: [
              {
                type: "flag_equals",
                key: CASE01_DINING_FLAGS.jokedWithMother,
                value: true,
              },
              {
                type: "flag_equals",
                key: CASE01_DINING_FLAGS.silentObservation,
                value: true,
              },
            ],
          },
        ],
        effects: [
          {
            type: "set_flag",
            key: "mother_redhead_secret_potential",
            value: true,
          },
        ],
      },
      {
        id: "CHOICE_PARTING_NORMAL",
        text: "Continue.",
        nextNodeId: "scene_case01_beat1_atmosphere",
        visibleIfAll: [
          {
            type: "logic_not",
            condition: {
              type: "logic_or",
              conditions: [
                {
                  type: "flag_equals",
                  key: CASE01_DINING_FLAGS.jokedWithMother,
                  value: true,
                },
                {
                  type: "flag_equals",
                  key: CASE01_DINING_FLAGS.silentObservation,
                  value: true,
                },
                {
                  type: "flag_equals",
                  key: CASE01_DINING_FLAGS.introducedSelf,
                  value: true,
                },
                {
                  type: "flag_equals",
                  key: CASE01_DINING_FLAGS.acceptedEleonoraHospitality,
                  value: true,
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: "scene_case01_hbf_echo_intro_self",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Name in Circulation",
    bodyOverride:
      "A porter checks a card before you can give your name. He does not greet you as a stranger; he makes room as if the station has already been told where to place you.\n\nIt is useful, in the way a locked door is useful when someone else holds the key.",
    backgroundUrl: CASE01_HBF_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    choices: [
      {
        id: "AUTO_CONTINUE_HBF_ECHO_INTRO_SELF",
        text: "Continue.",
        nextNodeId: "scene_case01_beat1_atmosphere",
      },
    ],
  },
  {
    id: "scene_case01_hbf_echo_hospitality_accepted",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Hartmann Courtesy",
    bodyOverride:
      "A porter tips his cap before you ask for help. 'The Hartmann party has already passed word,' he says, and lifts your bag with the care reserved for property that belongs near influence.\n\nThe courtesy saves a minute. It also tells you whose shadow reached the platform first.",
    backgroundUrl: CASE01_HBF_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    choices: [
      {
        id: "AUTO_CONTINUE_HBF_ECHO_HOSPITALITY_ACCEPTED",
        text: "Continue.",
        nextNodeId: "scene_case01_beat1_atmosphere",
      },
    ],
  },
  {
    id: "scene_case01_beat1_atmosphere",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Hauptbahnhof, Freiburg",
    bodyOverride:
      "Steam folds around the iron columns and the first rush of arriving passengers. A boy with newspapers cuts between trunks like a thought no one can pin down. Somewhere farther down the platform, metal tags knock softly against a luggage grille, and beyond that a police post studies the crowd with professional boredom.\n\nFreiburg has not greeted you. It has merely failed to hide.",
    backgroundUrl: CASE01_HBF_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    choices: [
      {
        id: "CASE01_BEAT1_NEWSBOY",
        text: "Speak to the newspaper boy.",
        nextNodeId: "scene_case01_hbf_newsboy_approach",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: "freiburg_case01_mainline_active",
            value: true,
          },
        ],
      },
      {
        id: "CASE01_BEAT1_LUGGAGE",
        text: "Go to the luggage counter.",
        nextNodeId: "scene_case01_hbf_luggage",
      },
      {
        id: "CASE01_BEAT1_POLICE",
        text: "Approach the railway police post.",
        nextNodeId: "scene_case01_hbf_police",
      },
      {
        id: "CASE01_BEAT1_EXIT",
        text: "Step out into the city.",
        nextNodeId: "scene_case01_hbf_departure",
      },
    ],
  },
  {
    id: "scene_case01_hbf_newsboy_approach",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Evening edition",
    bodyOverride:
      "You approach the newspaper boy under a soot-dark column. Up close his eyes are too quick: pocket, watch chain, luggage strap, police post, pocket again. The papers are not his trade so much as his license to stand here.\n\n'Evening edition, sir. Bankhaus J.A. Krebs. Mayor's notice. Reward money.' He says the last two words louder than the headline, because reward money sells better than civic duty.",
    backgroundUrl: CASE01_NEWSBOY_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_newsboy",
    choices: [
      {
        id: "CASE01_NEWSBOY_BUY",
        text: "Buy the paper and read the notice.",
        nextNodeId: "scene_case01_hbf_newsboy_buy",
      },
      {
        id: "CASE01_NEWSBOY_OBSERVE",
        text: "Read the boy before you read the paper.",
        nextNodeId: "scene_case01_hbf_newsboy_observe",
      },
    ],
  },
  {
    id: "scene_case01_hbf_newsboy_buy",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    bodyOverride:
      "You hand over a coin. The front page is still damp enough to mark the glove: Mayor Vogel calls upon physicians, locksmiths, chemists, criminologists, former policemen, and any citizen with useful information to assist in the Bankhaus Krebs investigation. A reward is promised not only for the thief, but for verifiable information.\n\nIt is a public invitation wearing a respectable hat. It also tells every ambitious liar in Freiburg where to queue.\n\nWhile your attention is on the notice, the boy steps closer. Too close. His hand moves in a neat, practiced arc toward your coat - toward the chain of your pocket watch.",
    backgroundUrl: CASE01_NEWSBOY_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_newsboy",
    onEnter: [
      {
        type: "set_flag",
        key: "case01_mayor_reward_notice_seen",
        value: true,
      },
      {
        type: "set_flag",
        key: "case01_forensics_reward_lead_seen",
        value: true,
      },
    ],
    choices: [
      {
        id: "CASE01_NEWSBOY_CATCH",
        text: "Catch his wrist before the watch goes.",
        nextNodeId: "scene_case01_hbf_newsboy_theft",
        skillCheck: {
          id: "check_case01_newsboy_watch_chain",
          voiceId: "attr_agility",
          difficulty: 11,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_case01_hbf_newsboy_theft",
            effects: [
              { type: "grant_xp", amount: 5 },
              {
                type: "set_flag",
                key: "case01_newsboy_caught",
                value: true,
              },
            ],
            inlineText:
              "**[Agility - Success]**:\nThe wrist arrives exactly where the calculation said it would. Small bones, cold skin, no hesitation left.",
          },
          onFail: {
            nextNodeId: "scene_case01_hbf_newsboy_watch_stolen",
            effects: [
              { type: "add_tension", amount: 1 },
              {
                type: "track_event",
                eventName: "case01_watch_stolen",
                tags: { source: "hbf_newsboy" },
              },
            ],
            inlineText:
              "**[Agility - Failure]**:\nThe plan was elegant. The platform was not. A porter turns, a suitcase opens, and your hand closes on empty air.",
          },
        },
      },
      {
        id: "CASE01_NEWSBOY_CATCH_PERCEPTION",
        text: "[Perception] Spot his fingers sliding toward your pocket early and step back.",
        nextNodeId: "scene_case01_hbf_newsboy_theft",
        skillCheck: {
          id: "check_case01_newsboy_watch_perception",
          voiceId: "attr_perception",
          difficulty: 10,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_case01_hbf_newsboy_theft",
            effects: [
              { type: "grant_xp", amount: 5 },
              {
                type: "set_flag",
                key: "case01_newsboy_caught",
                value: true,
              },
            ],
            inlineText:
              "**[Perception - Success]**:\nYou catch a minor muscle twitch in his forearm from the corner of your eye. A sudden step back, and the boy's fingers close on empty air, leaving him exposed.",
          },
          onFail: {
            nextNodeId: "scene_case01_hbf_newsboy_watch_stolen",
            effects: [
              { type: "add_tension", amount: 1 },
              {
                type: "track_event",
                eventName: "case01_watch_stolen",
                tags: { source: "hbf_newsboy" },
              },
            ],
            inlineText:
              "**[Perception - Failure]**:\nThe din of HBF distracts you. A steam hiss from a boiler car drowns out the soft brush of fingers, and by the time you look down, the pocket is already empty.",
          },
        },
      },
      {
        id: "CASE01_NEWSBOY_CATCH_SOCIAL",
        text: "[Social] Commandingly freeze him with a sharp word before his fingers reach.",
        nextNodeId: "scene_case01_hbf_newsboy_theft",
        skillCheck: {
          id: "check_case01_newsboy_watch_social",
          voiceId: "attr_social",
          difficulty: 10,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_case01_hbf_newsboy_theft",
            effects: [
              { type: "grant_xp", amount: 5 },
              {
                type: "set_flag",
                key: "case01_newsboy_caught",
                value: true,
              },
            ],
            inlineText:
              "**[Social - Success]**:\n'Careful, boy.' Your low, razor-sharp command halts him mid-reach. He goes pale, withdrawing his hands into his pockets as he realizes he has chosen the wrong mark.",
          },
          onFail: {
            nextNodeId: "scene_case01_hbf_newsboy_watch_stolen",
            effects: [
              { type: "add_tension", amount: 1 },
              {
                type: "track_event",
                eventName: "case01_watch_stolen",
                tags: { source: "hbf_newsboy" },
              },
            ],
            inlineText:
              "**[Social - Failure]**:\nYour attempt to command him is swallowed by the rattle of a nearby luggage trolley. The boy doesn't even flinch; his practiced hands complete the theft in silence.",
          },
        },
      },
    ],
  },
  {
    id: "scene_case01_hbf_newsboy_theft",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Caught",
    bodyOverride:
      "Your fingers close around his wrist before his fingers close around the watch. The boy freezes with the weary discipline of someone who has been caught before and has already counted the likely punishments.\n\nFritz Wendt steps out of the crowd. Hat low, eyes steady, no hurry. He does not rescue the boy and does not condemn him. He simply waits to see what sort of detective you are.\n\n'Please, sir,' the boy whispers. 'I have a sister. Eight years old. I did not mean-' He stops. Even he knows that sentence cannot end honestly.",
    backgroundUrl: CASE01_NEWSBOY_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_newsboy",
    choices: [
      {
        id: "CASE01_NEWSBOY_RELEASE",
        text: "Let the boy run.",
        nextNodeId: "scene_case01_hbf_newsboy_release",
        effects: [
          {
            type: "set_flag",
            key: "case01_newsboy_spared",
            value: true,
          },
          {
            type: "set_flag",
            key: "case01_newsboy_thread_resolved",
            value: true,
          },
        ],
      },
      {
        id: "CASE01_NEWSBOY_HANDOFF",
        text: "Hand him to the railway police.",
        nextNodeId: "scene_case01_hbf_newsboy_handoff",
        effects: [
          {
            type: "set_flag",
            key: "case01_newsboy_handed_to_police",
            value: true,
          },
          {
            type: "set_flag",
            key: "case01_newsboy_thread_resolved",
            value: true,
          },
          { type: "add_tension", amount: 1 },
        ],
      },
    ],
  },
  {
    id: "scene_case01_hbf_newsboy_watch_stolen",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Watch Chain",
    bodyOverride:
      "The boy vanishes into the luggage stream with your watch and the neat little dignity of a successful professional. A lady complains about ink on her glove. A porter apologizes to the wrong man. By the time Fritz reaches your side, the crowd has already healed around the absence.\n\n'Old-clothes men by the gates,' Fritz says quietly. 'Pawn trays behind taverns. If he is clever, the watch will pass through three hands before supper.'\n\nThe police post is ten paces away. The officers there have already decided not to see this kind of crime unless it arrives with a letterhead.",
    backgroundUrl: CASE01_NEWSBOY_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_newsboy",
    onEnter: [
      {
        type: "set_flag",
        key: "case01_watch_stolen",
        value: true,
      },
      {
        type: "set_flag",
        key: "case01_watch_recovery_open",
        value: true,
      },
      {
        type: "set_flag",
        key: "case01_newsboy_thread_resolved",
        value: true,
      },
      { type: "set_quest_stage", questId: "quest_watch_recovery", stage: 1 },
    ],
    choices: [
      {
        id: "CASE01_NEWSBOY_WATCH_POLICE",
        text: "Report the theft to the railway police.",
        nextNodeId: "scene_case01_hbf_police",
        effects: [
          {
            type: "set_flag",
            key: "case01_watch_reported_to_hbf_police",
            value: true,
          },
          {
            type: "set_flag",
            key: "case01_hbf_police_cover_suspected",
            value: true,
          },
        ],
      },
      {
        id: "CASE01_NEWSBOY_WATCH_RETURN",
        text: "Mark the loss and return to the platform.",
        nextNodeId: "scene_case01_beat1_atmosphere",
      },
    ],
  },
  {
    id: "scene_case01_hbf_newsboy_observe",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Reading the Boy",
    bodyOverride:
      "**[attr_perception]**:\nHe is not selling. He is measuring. Watch the fingers - they count pockets, not coins. The newspapers are scenery. The real trade is distraction.\n\nYou meet his eyes and hold them without accusation. The grin drops away by half an inch.\n\n'You are not an ordinary traveler,' he says.\n\n'And you are not an ordinary newspaper boy.'\n\nHe glances toward the police post. No one there moves. Their indifference gives him courage.",
    backgroundUrl: CASE01_NEWSBOY_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_newsboy",
    onEnter: [
      {
        type: "set_flag",
        key: "case01_newsboy_read_as_picker",
        value: true,
      },
    ],
    choices: [
      {
        id: "CASE01_NEWSBOY_OBSERVE_CONTINUE",
        text: "Let him talk.",
        nextNodeId: "scene_case01_hbf_newsboy_mayor_info",
      },
    ],
  },
  {
    id: "scene_case01_hbf_newsboy_mayor_info",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Mayor's Notice",
    bodyOverride:
      "'Mayor Vogel paid for the notice,' the boy says, tightening his grip on the papers. 'Anyone with criminology, locks, chemistry, doctoring, police work - anyone who can help with the bank - should present themselves. Reward for help. Reward for information too, if it proves useful.'\n\nHe sniffs. 'That means every retired constable, every student with a microscope, every liar with a cousin in a tavern. The Rathaus wants answers. It also wants a list of everyone who thinks they have one.'\n\nThen he slips between two trunks before gratitude can turn into questions. The paper remains in your hand: not darkness, not yet. An invitation with money behind it, and a city already sorting truth by usefulness.",
    backgroundUrl: CASE01_NEWSBOY_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_newsboy",
    onEnter: [
      {
        type: "set_flag",
        key: "case01_mayor_reward_notice_seen",
        value: true,
      },
      {
        type: "set_flag",
        key: "case01_forensics_reward_lead_seen",
        value: true,
      },
      {
        type: "set_flag",
        key: "case01_newsboy_thread_resolved",
        value: true,
      },
      {
        type: "track_event",
        eventName: "case01_mayor_reward_notice_seen",
      },
    ],
    choices: [
      {
        id: "CASE01_NEWSBOY_MAYOR_RETURN",
        text: "Return to the platform.",
        nextNodeId: "scene_case01_beat1_atmosphere",
      },
    ],
  },
  {
    id: "scene_case01_hbf_newsboy_handoff",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    bodyOverride:
      "Fritz takes the boy by the collar and leads him to the police post. 'Order is order, even for small fish.'\n\nThe officer accepts the boy with the bored irritation of a man receiving laundry. No question about the watch chain. No question about accomplices. Just a hand on the back of the neck and a ledger opened to the wrong page.\n\nThe platform resumes its Sunday manners. One small truth has been established, and the city has already begun filing it somewhere harmless.",
    backgroundUrl: CASE01_NEWSBOY_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_newsboy",
    choices: [
      {
        id: "CASE01_NEWSBOY_HANDOFF_RETURN",
        text: "Return to the platform.",
        nextNodeId: "scene_case01_beat1_atmosphere",
      },
    ],
  },
  {
    id: "scene_case01_hbf_newsboy_release",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    bodyOverride:
      "You open your hand. The boy jerks back, rubs the red mark on his wrist, and dives into the crowd without looking back.\n\nFritz watches him go. 'Let us hope he remembers the grip, not the mercy.' He adjusts his hat. 'The station is still yours, Herr Thorne.'",
    backgroundUrl: CASE01_NEWSBOY_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_newsboy",
    choices: [
      {
        id: "CASE01_NEWSBOY_RELEASE_RETURN",
        text: "Return to the platform.",
        nextNodeId: "scene_case01_beat1_atmosphere",
      },
    ],
  },
  {
    id: "scene_case01_hbf_luggage",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Luggage Counter",
    bodyOverride:
      "The clerk is counting brass tags. A heavy wooden crate marked for Bankhaus J.A. Krebs sits on a trolley, arriving from Strasbourg under priority seal. It's unusual for a local bank to receive such a delivery on a Sunday morning.\n\nThe clerk notices you lingering and shifts a clipboard to cover the manifest.",
    backgroundUrl: CASE01_LUGGAGE_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_luggage",
    choices: [
      {
        id: "CASE01_LUGGAGE_PRESS",
        text: "Press the clerk about the Strasbourg shipment.",
        nextNodeId: "scene_case01_hbf_luggage_robbery",
        passiveChecks: [
          {
            id: "check_luggage_clerk_fear",
            voiceId: "attr_social",
            difficulty: 10,
            isPassive: true,
          },
        ],
      },
      {
        id: "CASE01_LUGGAGE_RETURN",
        text: "Step back to the platform.",
        nextNodeId: "scene_case01_beat1_atmosphere",
      },
    ],
  },
  {
    id: "scene_case01_hbf_luggage_robbery",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    bodyOverride:
      "The clerk's eyes dart toward the police post. 'I don't know anything about Strasbourg,' he mutters. 'Only that the bank requested priority. If you want to know more, go to the source.'\n\nHe turns his back on you, ending the conversation with a sharp snap of his ledger.",
    backgroundUrl: CASE01_LUGGAGE_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_luggage",
    choices: [
      {
        id: "CASE01_LUGGAGE_ROBBERY_RETURN",
        text: "Return to the platform.",
        nextNodeId: "scene_case01_beat1_atmosphere",
      },
    ],
  },
  {
    id: "scene_case01_hbf_police",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Police Post",
    bodyOverride:
      "Two officers are deep in low-voiced conversation. They mention an 'open vault' and a 'silent alarm' that did not ring. Their posture is rigid, eyes scanning the crowd with more than ordinary vigilance.\n\nWhen the talk turns to newspaper boys, one officer exhales through his nose. 'There are dozens of them. Every train brings cousins, apprentices, cousins of apprentices. We cannot chase every missing watch.'\n\nThe answer is too smooth for annoyance and too quick for surprise. Either the post has been embarrassed by these boys before, or someone has paid to make embarrassment the end of the report.",
    backgroundUrl: CASE01_POLICE_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_police",
    choices: [
      {
        id: "CASE01_POLICE_RETURN",
        text: "Mingle back into the crowd.",
        nextNodeId: "scene_case01_beat1_atmosphere",
      },
    ],
  },
  {
    id: "scene_case01_hbf_departure",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Leaving the Hauptbahnhof",
    bodyOverride:
      "You shoulder through the tide of travelers - timetables, porters, damp newspapers, and polite lies pretending to be small talk.\n\nThe glass doors spill you into Freiburg. Two fronts are open: the bank robbery and the Rathaus notice promising reward money for anyone useful to the investigation. Where you go first will shape how the city learns your name.",
    backgroundUrl: CASE01_HBF_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    onEnter: [
      { type: "travel_to", locationId: "loc_hbf" },
      {
        type: "set_flag",
        key: "case01_onboarding_complete",
        value: true,
      },
      {
        type: "set_flag",
        key: "freiburg_case01_mainline_active",
        value: true,
      },
      { "type": "set_flag", "key": "intro_freiburg_done", "value": true },
      { "type": "set_flag", "key": "case01_priority_locked", "value": true },
      { "type": "unlock_group", groupId: "loc_hbf" },
      { "type": "unlock_group", groupId: "loc_pub_deutsche" },
      { "type": "unlock_group", groupId: "loc_freiburg_bank" },
      { "type": "unlock_group", groupId: "loc_rathaus" },
      { "type": "track_event", eventName: "case01_hbf_departure" },
    ],
    choices: [
      {
        id: "CASE01_HBF_EXIT_BANK",
        text: "The bank first. Follow the money.",
        nextNodeId: "scene_case01_hbf_exit_final",
        visibleIfAll: [
          {
            type: "logic_not",
            condition: { type: "flag_equals", key: "origin_witch", value: true }
          }
        ],
        effects: [
          { type: "set_flag", key: "priority_bank_first", value: true },
          {
            type: "set_flag",
            key: "priority_mayor_first",
            value: false,
          },
        ],
      },
      {
        id: "CASE01_HBF_EXIT_RATHAUS",
        text: "The Rathaus first. Follow the power.",
        nextNodeId: "scene_case01_hbf_exit_final",
        visibleIfAll: [
          {
            type: "logic_not",
            condition: { type: "flag_equals", key: "origin_witch", value: true }
          }
        ],
        effects: [
          {
            type: "set_flag",
            key: "priority_mayor_first",
            value: true,
          },
          { "type": "set_flag", "key": "priority_bank_first", "value": false },
        ],
      },
      {
        id: "CASE01_HBF_EXIT_WITCH_GHOST",
        text: "Направиться к заброшенному особняку Гранд-Эстейт.",
        nextNodeId: "scene_estate_intro",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_witch", value: true }
        ],
        effects: [
          { type: "set_flag", key: "origin_witch_handoff_done", value: true }
        ]
      },
      {
        id: "CASE01_HBF_EXIT_WITCH_BUREAU",
        text: "Принять приглашение и войти в секретный отдел Бюро.",
        nextNodeId: "scene_case01_witch_bureau_entry",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_witch", value: true }
        ]
      }
    ],
  },
  {
    id: "scene_case01_hbf_exit_final",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Freiburg",
    bodyOverride: "The station is behind you. The city is ahead.",
    backgroundUrl: CASE01_HBF_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    terminal: true,
    choices: [],
  },
  {
    id: "scene_case01_witch_bureau_entry",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Секретные Архивы Бюро",
    bodyOverride: "**[Narrator]**:\nВы спускаетесь по узкой винтовой лестнице в самое сердце вокзала — туда, куда не ведут ни одни официальные карты Фрайбурга. Тяжелая дубовая дверь отворяется со стоном старых петель, впуская вас в прохладу архивов.\n\nЗдесь пахнет сушеной лавандой, воском и старой кожей. Тысячи папок с именами, отмеченными особыми руническими печатями, тянутся до самого потолка. Бюро знает всё обо всех.\n\n**[attr_perception]**:\nОбратите внимание на пыль. Она лежит неровно — эти архивы посещают регулярно, но двигаются здесь с хирургической точностью, не задевая лишнего.",
    backgroundUrl: CASE01_BG_ESTATE_BUREAU,
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    choices: [
      {
        id: "AUTO_CONTINUE_WITCH_BUREAU_ENTRY",
        text: "Войти в кабинет Мастера.",
        nextNodeId: "scene_case01_witch_bureau_master_meeting",
      },
    ],
  },
  {
    id: "scene_case01_witch_bureau_master_meeting",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Встреча с Мастером",
    bodyOverride: "**[Master]**:\n— Проходите, дитя. Я ждал вас. Фрайбург меняется, и тени сгущаются над ним быстрее, чем мэр успевает писать свои никчемные объявления.\n\n**[Narrator]**:\nМастер сидит за массивным письменным столом из темного дуба. В его глазах отражается слабое пламя свечи, а на ладони покоится причудливый прибор из латуни и стекла, мерцающий бледно-голубым светом.\n\n**[attr_spirit]**:\nВокруг него колеблется духовная завеса. Не просто магия — древняя, концентрированная воля. Если настроить зрение, можно увидеть, как тени подчиняются его дыханию.",
    backgroundUrl: CASE01_BG_ESTATE_BUREAU,
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    choices: [
      {
        id: "WITCH_BUREAU_MASTER_OCCULT_CHECK",
        text: "[Occultism] Настроиться на духовную завесу вокруг Мастера и распознать его оккультную школу.",
        nextNodeId: "scene_case01_witch_bureau_exit",
        skillCheck: {
          id: "check_witch_bureau_master_occultism",
          voiceId: "attr_spirit",
          difficulty: 12,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_case01_witch_bureau_exit",
            effects: [
              { type: "set_flag", key: "calibrated_thermometer", value: true },
              { type: "grant_xp", amount: 15 },
              { type: "add_var", key: "attr_spirit", value: 1 }
            ],
            inlineText: "**[Spirit — Успех]**:\nВы делаете глубокий вдох и отпускаете зрение. Мир сереет, а завеса вокруг Мастера вспыхивает холодным спектром Ордена Порога. Вы видите его духовный отпечаток и слегка склоняете голову в знак признания.\n\n**[Master]**:\n— Великолепно. Ваши глаза видят истину за пеленой. Возьмите этот термометр. Он откалиброван для работы с потусторонними аномалиями и поможет вам обнаружить температурные колебания призрака особняка."
          },
          onFail: {
            nextNodeId: "scene_case01_witch_bureau_exit",
            effects: [
              { type: "add_var", key: "checks_failed", value: 1 },
              { type: "grant_xp", amount: 5 }
            ],
            inlineText: "**[Spirit — Провал]**:\nВы пытаетесь пробиться сквозь ментальный барьер Мастера, но духовная завеса бьет в ответ холодным импульсом. Раздается легкий звон в ушах, зрение затуманивается. Мастер качает головой с едва заметным вздохом.\n\n**[Master]**:\n— Осторожнее, дитя. Сила без контроля разрушает. Особняк на окраине не прощает спешки. Идите туда и помните: не всё то призрак, что оставляет ледяные следы."
          }
        }
      },
      {
        id: "WITCH_BUREAU_MASTER_TALK_CIVIL",
        text: "Представиться вежливо и выслушать инструкции Мастера.",
        nextNodeId: "scene_case01_witch_bureau_exit",
        inlineText: "**[Narrator]**:\nВы предпочитаете держать свои чувства при себе и просто склоняете голову в вежливом приветствии.\n\n**[Master]**:\n— Разумная сдержанность. Особняк на окраине требует именно этого. Бюро поручает вам расследование призрака в Гранд-Эстейт. Действуйте скрытно и не позволяйте местным властям обнаружить наши следы."
      }
    ]
  },
  {
    id: "scene_case01_witch_bureau_exit",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Напутствие",
    bodyOverride: "**[Narrator]**:\nМастер делает жест рукой, отпуская вас. Архивы позади погружаются во тьму, а перед вами открывается потайной выход, ведущий к дороге на окраину города, где раскинулись туманные сады Гранд-Эстейт.\n\n**[inner_guide]**:\nЗавеса там истончилась. Мы это чувствуем. Пора положить конец тому, что тревожит живых.",
    backgroundUrl: CASE01_BG_ESTATE_BUREAU,
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    onEnter: [
      { type: "set_flag", key: "origin_witch_handoff_done", value: true }
    ],
    choices: [
      {
        id: "AUTO_CONTINUE_WITCH_BUREAU_EXIT",
        text: "Направиться к Гранд-Эстейт.",
        nextNodeId: "scene_estate_intro",
      }
    ]
  }
];
