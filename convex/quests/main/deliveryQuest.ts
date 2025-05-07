import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";
import { QUEST_STATE, ACTION, SCENE_KEY } from "../../quest";

export const initializeDeliveryQuest = mutation({
  args: {},
  handler: async (ctx: any) => {
    // Create QR codes for NPCs
    const traderQrCode = await ctx.db.insert("qrCodes", {
      code: "grenz_npc_trader_01",
      type: "npc",
      data: { 
        npcId: "trader",
        questLine: "delivery",
        sceneId: "trader_meeting" 
      },
      isOneTime: false,
      usedBy: []
    });
    
    const craftsmanQrCode = await ctx.db.insert("qrCodes", {
      code: "grenz_npc_craftsman_01",
      type: "npc",
      data: { 
        npcId: "craftsman",
        questLine: "delivery",
        sceneId: "craftsman_meeting"
      },
      isOneTime: false,
      usedBy: []
    });
    
    const anomalyQrCode = await ctx.db.insert("qrCodes", {
      code: "Grenz_loc_anomaly_01",
      type: "location",
      data: { 
        locationId: "anomaly_zone",
        questLine: "delivery",
        triggerSceneKey: "artifact_hunt_start"
      },
      isOneTime: false,
      usedBy: []
    });
    
    const artifactQrCode = await ctx.db.insert("qrCodes", {
      code: "ARTIFACT_ITEM_2023",
      type: "item",
      data: { 
        itemId: "energy_crystal",
        questLine: "delivery" 
      },
      isOneTime: true,
      usedBy: []
    });
    
    // Create NPC records
    const trader = await ctx.db.insert("npcs", {
      name: "Странствующий торговец",
      type: "trader",
      faction: "neutrals",
      description: "Торговец в потрёпанной, но дорогой одежде, с широкополой шляпой и большим рюкзаком, полным разнообразных товаров.",
      coordinates: {
        lat: 55.751244, // Example coordinates (should be updated)
        lng: 37.618423
      },
      isShop: true,
      shopItems: ["ammo", "medkit", "food"]
    });
    
    const craftsman = await ctx.db.insert("npcs", {
      name: "Мастеровой Дитер",
      type: "craftsman",
      faction: "officers",
      description: "Дитер — пожилой, но крепкий мастеровой с седыми усами и очками на носу, всегда занят работой.",
      coordinates: {
        lat: 55.753215, // Example coordinates (should be updated)
        lng: 37.622504
      },
      isShop: true,
      shopItems: ["weapon_repair", "armor_upgrade", "crafting"]
    });
    
    // Create quest stages
    const questStartScene = await ctx.db.insert("scenes", {
      title: "Новое задание",
      sceneKey: "new_delivery_quest",
      background: "/backgrounds/phone_message.jpg",
      text: "«Новичок, есть работа. Торговец недавно привёз партию ценных запчастей. Забери их и доставь мастеровому по имени Дитер в центральную мастерскую города. Координаты я приложил. Действуй аккуратно, товар ценный!»",
      choices: [
        {
          text: "Принять задание",
          action: ACTION.START_DELIVERY_QUEST
        }
      ]
    });
    
    const traderMeetingScene = await ctx.db.insert("scenes", {
      title: "Встреча с торговцем",
      sceneKey: "trader_meeting",
      background: "/backgrounds/trader_camp.png",
      text: "Вы находите временный лагерь на окраине города, где торговец в широкополой шляпе сортирует свои товары. Завидев вас, он поднимает взгляд.\n\n«А, ты за запчастями от Дитера? Вот, забирай, всё здесь. Только береги, их трудно добыть. И передай Дитеру, что в следующий раз пусть платит больше, или товар пойдёт в другие руки.»",
      choices: [
        {
          text: "Взять запчасти и отправиться к Дитеру",
          action: ACTION.TAKE_PARTS
        }
      ]
    });
    
    const craftsmanMeetingScene = await ctx.db.insert("scenes", {
      title: "Встреча с мастеровым",
      sceneKey: "craftsman_meeting",
      background: "/backgrounds/workshop.jpg",
      text: "В центральной мастерской города вы находите Дитера — пожилого мастерового с седыми усами, склонившегося над верстаком. Увидев вас с запчастями, он оживляется.\n\n«О, наконец-то! Я уже думал, эти детали никогда не придут. Молодец, сталкер, быстро справился.»",
      choices: [
        {
          text: "Передать запчасти"
        }
      ]
    });
    
    const additionalTaskScene = await ctx.db.insert("scenes", {
      title: "Дополнительное задание",
      sceneKey: "additional_task",
      background: "/backgrounds/workshop.jpg",
      text: "Дитер принимает запчасти и внимательно их осматривает. Затем поднимает взгляд на вас.\n\n«Есть ещё одно дело, если хочешь подзаработать.»",
      choices: [
        {
          text: "Что нужно сделать?"
        }
      ]
    });
    
    const artifactTaskScene = await ctx.db.insert("scenes", {
      title: "Поиск артефакта",
      sceneKey: "artifact_task",
      background: "/backgrounds/workshop.jpg",
      text: "«Недалеко отсюда активировался разлом. Мои инструменты засекли в зоне активности редкий артефакт — кристалл чистой энергии. Если принесёшь, заплачу щедро. Но будь осторожен, в таких местах водится всякое.»",
      choices: [
        {
          text: "Взяться за задание",
          action: ACTION.ACCEPT_ARTIFACT_QUEST
        },
        {
          text: "Отказаться",
          action: "decline_artifact_quest"
        }
      ]
    });
    
    const artifactAreaScene = await ctx.db.insert("scenes", {
      title: "Аномальная зона",
      sceneKey: "artifact_area",
      background: "/backgrounds/anomaly.jpg",
      text: "Вы прибыли в указанное место. Воздух здесь странно искажается, а окружающий пейзаж словно подёрнут дымкой. Вы ощущаете характерное покалывание — признак близости аномальной активности. Где-то здесь должен быть кристалл...",
      choices: [
        {
          text: "Осмотреться в поисках артефакта",
          action: "search_artifact"
        }
      ]
    });
    
    const orkEncounterScene = await ctx.db.insert("scenes", {
      title: "Неожиданная встреча",
      sceneKey: "ork_encounter",
      background: "/backgrounds/forest_encounter.jpg",
      text: "Внезапно вы замечаете в лесной чаще странную сцену: орк-воин, раненый и измотанный, с трудом отбивается от крупного зомбированного волка, покрытого язвами и выделяющего ядовитые испарения. Ситуация критическая, и вам нужно решить, как поступить.",
      choices: [
        {
          text: "Помочь орку убить волка",
          action: ACTION.HELP_ORK
        },
        {
          text: "Убить и орка, и волка",
          action: ACTION.KILL_BOTH
        },
        {
          text: "Не вмешиваться и продолжить поиск",
          action: ACTION.IGNORE_ENCOUNTER
        }
      ]
    });
    
    const helpOrkScene = await ctx.db.insert("scenes", {
      title: "Помощь орку",
      sceneKey: "help_ork",
      background: "/backgrounds/forest_encounter.jpg",
      text: "Вы вступаете в бой, помогая орку одолеть зомбированного волка. Когда с чудовищем покончено, орк благодарно кивает вам.\n\n«Даг'ар благодарен. Ты не похож на других людей. Возьми это — поможет найти то, что ищешь.»\n\nОрк передает вам странный прибор, похожий на компас, но стрелка которого реагирует на энергетические всплески.",
      choices: [
        {
          text: "Поблагодарить и продолжить поиск",
          action: "continue_after_ork_help",
          equipmentChanges: {
            secondary: "Детектор аномалий"
          }
        }
      ]
    });
    
    const killBothScene = await ctx.db.insert("scenes", {
      title: "Двойное убийство",
      sceneKey: "kill_both",
      background: "/backgrounds/forest_encounter.jpg",
      text: "Вы решаете избавиться от обоих существ. Сначала расправляетесь с ослабленным волком, а затем атакуете уже раненого орка, который не ожидал удара от вас. После боя вы обыскиваете тела и находите несколько ценных вещей, включая карту, на которой отмечено местонахождение артефактов в этой области.",
      choices: [
        {
          text: "Продолжить поиск с новой информацией",
          action: "continue_after_kill_both",
          equipmentChanges: {
            consumables: ["Карта разломов", "Клык мутанта", "Трофейный нож"]
          }
        }
      ]
    });
    
    const ignoreEncounterScene = await ctx.db.insert("scenes", {
      title: "Продолжение поиска",
      sceneKey: "ignore_encounter",
      background: "/backgrounds/anomaly.jpg",
      text: "Вы решаете не вмешиваться в бой и обходите сцену стороной, продолжая поиск артефакта. Вскоре чутье приводит вас к небольшой расщелине, из которой исходит странное свечение.",
      choices: [
        {
          text: "Исследовать расщелину",
          action: "continue_search"
        }
      ]
    });
    
    const findArtifactScene = await ctx.db.insert("scenes", {
      title: "Артефакт найден",
      sceneKey: "artifact_found",
      background: "/backgrounds/artifact_found.jpg",
      text: "После тщательных поисков вы обнаруживаете то, что искали — кристалл чистой энергии, пульсирующий голубоватым светом. Осторожно взяв его специальными щипцами, вы помещаете артефакт в контейнер. Пора возвращаться к Дитеру.",
      choices: [
        {
          text: "Вернуться к Дитеру",
          action: ACTION.RETURN_TO_CRAFTSMAN
        }
      ]
    });
    
    const questCompleteScene = await ctx.db.insert("scenes", {
      title: "Задание выполнено",
      sceneKey: "quest_complete",
      background: "/backgrounds/workshop.jpg",
      text: "Дитер внимательно изучает принесенный вами кристалл, и его глаза загораются от восторга.\n\n«Впечатляет! Ты оправдал моё доверие. Держи оплату и запомни: всегда думай дважды, прежде чем вмешиваться в дела разломов. Это может стоить дороже, чем кажется.»\n\nВы получаете обещанную награду и чувствуете, что приобрели ценного союзника в лице мастерового.",
      choices: [
        {
          text: "Завершить задание",
          action: ACTION.COMPLETE_DELIVERY_QUEST
        }
      ]
    });
    
    // Update scene references
    await ctx.db.patch(questStartScene, {
      choices: [
        {
          text: "Принять задание",
          nextSceneId: traderMeetingScene,
          action: ACTION.START_DELIVERY_QUEST
        }
      ]
    });
    
    await ctx.db.patch(traderMeetingScene, {
      choices: [
        {
          text: "Взять запчасти и отправиться к Дитеру",
          nextSceneId: craftsmanMeetingScene,
          action: ACTION.TAKE_PARTS
        }
      ]
    });
    
    await ctx.db.patch(craftsmanMeetingScene, {
      choices: [
        {
          text: "Передать запчасти",
          nextSceneId: additionalTaskScene
        }
      ]
    });
    
    await ctx.db.patch(additionalTaskScene, {
      choices: [
        {
          text: "Что нужно сделать?",
          nextSceneId: artifactTaskScene
        }
      ]
    });
    
    await ctx.db.patch(artifactTaskScene, {
      choices: [
        {
          text: "Взяться за задание",
          nextSceneId: artifactAreaScene,
          action: ACTION.ACCEPT_ARTIFACT_QUEST
        },
        {
          text: "Отказаться",
          nextSceneId: questCompleteScene,
          action: "decline_artifact_quest"
        }
      ]
    });
    
    await ctx.db.patch(artifactAreaScene, {
      choices: [
        {
          text: "Осмотреться в поисках артефакта",
          nextSceneId: orkEncounterScene,
          action: "search_artifact"
        }
      ]
    });
    
    await ctx.db.patch(orkEncounterScene, {
      choices: [
        {
          text: "Помочь орку убить волка",
          nextSceneId: helpOrkScene,
          action: ACTION.HELP_ORK
        },
        {
          text: "Убить и орка, и волка",
          nextSceneId: killBothScene,
          action: ACTION.KILL_BOTH
        },
        {
          text: "Не вмешиваться и продолжить поиск",
          nextSceneId: ignoreEncounterScene,
          action: ACTION.IGNORE_ENCOUNTER
        }
      ]
    });
    
    await ctx.db.patch(helpOrkScene, {
      choices: [
        {
          text: "Поблагодарить и продолжить поиск",
          nextSceneId: findArtifactScene,
          action: "continue_after_ork_help",
          equipmentChanges: {
            secondary: "Детектор аномалий"
          }
        }
      ]
    });
    
    await ctx.db.patch(killBothScene, {
      choices: [
        {
          text: "Продолжить поиск с новой информацией",
          nextSceneId: findArtifactScene,
          action: "continue_after_kill_both",
          equipmentChanges: {
            consumables: ["Карта разломов", "Клык мутанта", "Трофейный нож"]
          }
        }
      ]
    });
    
    await ctx.db.patch(ignoreEncounterScene, {
      choices: [
        {
          text: "Исследовать расщелину",
          nextSceneId: findArtifactScene,
          action: "continue_search"
        }
      ]
    });
    
    await ctx.db.patch(findArtifactScene, {
      choices: [
        {
          text: "Вернуться к Дитеру",
          nextSceneId: questCompleteScene,
          action: ACTION.RETURN_TO_CRAFTSMAN
        }
      ]
    });
    
    // Create map points
    const traderPoint = await ctx.db.insert("mapPoints", {
      title: "Лагерь торговца",
      description: "Временный лагерь странствующего торговца на окраине города.",
      coordinates: {
        lat: 55.751244, // Example coordinates (should be updated)
        lng: 37.618423
      },
      radius: 20, // 20 meters radius
      requiredQuestState: QUEST_STATE.DELIVERY_STARTED,
      linkedSceneId: traderMeetingScene,
      isActive: true
    });
    
    const craftsmanPoint = await ctx.db.insert("mapPoints", {
      title: "Центральная мастерская",
      description: "Мастерская Дитера, известного мастерового города.",
      coordinates: {
        lat: 55.753215, // Example coordinates (should be updated)
        lng: 37.622504
      },
      radius: 25, // 25 meters radius
      requiredQuestState: QUEST_STATE.PARTS_COLLECTED,
      linkedSceneId: craftsmanMeetingScene,
      isActive: true
    });
    
    const anomalyPoint = await ctx.db.insert("mapPoints", {
      title: "Аномальная зона",
      description: "Место активности разлома. Здесь по данным Дитера находится ценный артефакт.",
      coordinates: {
        lat: 55.755814, // Example coordinates (should be updated)
        lng: 37.617635
      },
      radius: 50, // 50 meters radius - larger search area
      requiredQuestState: QUEST_STATE.ARTIFACT_HUNT,
      linkedSceneId: artifactAreaScene,
      isActive: true
    });
    
    // Инициализация сцен не нужна здесь, так как мы создаем их с указанными ключами
    // Достаточно вызвать что-то вроде:
    // await ctx.db.query("initSceneKeys").first() или
    // await ctx.runMutation("initSceneKeys")
    
    return {
      message: "Квест 'Доставка и дилемма' успешно инициализирован",
      qrCodes: [traderQrCode, craftsmanQrCode, anomalyQrCode, artifactQrCode],
      npcs: [trader, craftsman],
      scenes: [
        questStartScene, traderMeetingScene, craftsmanMeetingScene, 
        additionalTaskScene, artifactTaskScene, artifactAreaScene, 
        orkEncounterScene, helpOrkScene, killBothScene, 
        ignoreEncounterScene, findArtifactScene, questCompleteScene
      ],
      mapPoints: [traderPoint, craftsmanPoint, anomalyPoint]
    };
  },
});

// Определение интерфейсов для статистики
interface QuestChoice {
  choiceId: string;
  choiceText: string;
  totalPicks: number;
  lastPickedAt: number;
}

interface QuestScene {
  sceneKey: string;
  sceneId?: any;
  title?: string;
  found: boolean;
  choices?: QuestChoice[];
}

interface DeliveryQuestStats {
  questId: string;
  scenes: QuestScene[];
  totalChoices: number;
  globalStats?: {
    totalPlayers: number;
    completedQuest: number;
    helpedOrk?: number;
    killedBoth?: number;
    ignored?: number;
    completionRate?: number;
  };
}

// Функция для получения статистики по квесту доставки
export const getDeliveryQuestStats = query({
  args: {
    includeGlobalStats: v.optional(v.boolean())
  },
  handler: async (ctx: any, { includeGlobalStats = false }: any) => {
    // Получаем статистику для квеста доставки
    const questId = "delivery";
    
    // Получаем все сцены квеста доставки
    const sceneKeys = [
      "new_delivery_quest",
      "trader_meeting",
      "craftsman_meeting",
      "additional_task",
      "artifact_task",
      "artifact_area",
      "ork_encounter",
      "help_ork",
      "kill_both",
      "ignore_encounter",
      "artifact_found",
      "quest_complete"
    ];
    
    // Собираем статистику по сценам
    const sceneStats = await Promise.all(
      sceneKeys.map(async (sceneKey) => {
        const scene = await ctx.db
          .query("scenes")
          .withIndex("by_sceneKey", (q: any) => q.eq("sceneKey", sceneKey))
          .first();
          
        if (!scene) return { sceneKey, found: false };
        
        const choices = await ctx.db
          .query("quest_choices_stats")
          .withIndex("by_quest_scene", (q: any) => q.eq("questId", questId).eq("sceneId", scene._id.toString()))
          .collect();
          
        return {
          sceneKey,
          sceneId: scene._id,
          title: scene.title,
          found: true,
          choices: choices.map((choice: any) => ({
            choiceId: choice.choiceId,
            choiceText: choice.choiceText,
            totalPicks: choice.totalPicks,
            lastPickedAt: choice.lastPickedAt
          }))
        };
      })
    );
    
    const result: DeliveryQuestStats = {
      questId,
      scenes: sceneStats.filter(scene => scene.found),
      totalChoices: 0
    };
    
    // Подсчитываем общее количество выборов
    result.totalChoices = result.scenes.reduce((total, scene) => {
      return total + (scene.choices && scene.choices.length > 0 ? scene.choices.reduce((sum, choice) => sum + choice.totalPicks, 0) : 0);
    }, 0);
    
    // Добавляем глобальную статистику
    if (includeGlobalStats) {
      // Получаем количество игроков
      const players = await ctx.db.query("players").collect();
      const totalPlayers = players.length;
      
      // Получаем игроков, завершивших квест
      const completedQuestChoices = await ctx.db
        .query("player_quest_choices")
        .withIndex("by_quest_choice", (q: any) => 
          q.eq("questId", questId)
           .eq("isCompleted", true))
        .collect();
      
      const completedQuest = completedQuestChoices.length;
      
      result.globalStats = {
        totalPlayers,
        completedQuest,
        completionRate: totalPlayers > 0 ? (completedQuest / totalPlayers) * 100 : 0
      };
    }
    
    return result;
  }
});