import { mutation, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Константы для состояний квеста и действий (можно импортировать из quest.ts)
const QUEST_STATE = {
  REGISTERED: 'registered',
  CHARACTER_CREATION: 'character_creation',
  TRAINING_MISSION: 'training_mission',
  DELIVERY_STARTED: 'delivery_started',
  PARTS_COLLECTED: 'parts_collected',
  ARTIFACT_HUNT: 'artifact_hunt',
  ARTIFACT_FOUND: 'artifact_found',
  QUEST_COMPLETION: 'quest_completion',
  FREE_ROAM: 'free_roam',
  NEW_MESSAGE: 'new_message'
};

const ACTION = {
  END_CHARACTER_CREATION: 'end_character_creation',
  START_DELIVERY_QUEST: 'start_delivery_quest',
  TAKE_PARTS: 'take_parts',
  ACCEPT_ARTIFACT_QUEST: 'accept_artifact_quest',
  HELP_ORK: 'help_ork',
  KILL_BOTH: 'kill_both',
  IGNORE_ENCOUNTER: 'ignore_encounter',
  RETURN_TO_CRAFTSMAN: 'return_to_craftsman',
  COMPLETE_DELIVERY_QUEST: 'complete_delivery_quest'
};

// Функция для создания сцен и связей между ними
export const initializeScenes = mutation({
  args: {},
  handler: async (ctx) => {
    const results = {
      sceneIds: {} as Record<string, Id<"scenes">>,
      qrCodes: {} as Record<string, Id<"qrCodes">>,
      npcs: {} as Record<string, Id<"npcs">>,
      mapPoints: {} as Record<string, Id<"mapPoints">>
    };

    // Шаг 1: Создаем НПС
    results.npcs.trader = await createTraderNPC(ctx);
    results.npcs.craftsman = await createCraftsmanNPC(ctx);

    // Шаг 2: Создаем QR-коды
    results.qrCodes.trader = await createQRCode(ctx, "grenz_npc_trader_01", "npc", { npcId: "trader" }, false);
    results.qrCodes.craftsman = await createQRCode(ctx, "grenz_npc_craftsman_01", "npc", { npcId: "craftsman" }, false);
    results.qrCodes.artifact = await createQRCode(ctx, "ARTIFACT_ITEM_2023", "item", { itemId: "energy_crystal" }, true);

    // Шаг 3: Создаем сцены
    results.sceneIds.traderMeeting = await createTraderMeetingScene(ctx);
    results.sceneIds.craftsmanMeeting = await createCraftsmanMeetingScene(ctx);
    results.sceneIds.additionalTask = await createAdditionalTaskScene(ctx);
    results.sceneIds.artifactTask = await createArtifactTaskScene(ctx);
    results.sceneIds.artifactArea = await createArtifactAreaScene(ctx);
    results.sceneIds.artifactFound = await createArtifactFoundScene(ctx);
    results.sceneIds.questComplete = await createQuestCompleteScene(ctx);

    // Шаг 4: Обновляем сцены и связываем их между собой
    await updateSceneRelationships(ctx, results.sceneIds);

    // Шаг 5: Создаем точки на карте
    results.mapPoints.trader = await createMapPoint(
      ctx, 
      "Лагерь торговца", 
      "Временный лагерь странствующего торговца на окраине города.",
      { lat: 47.99444, lng: 7.84638 },
      20,
      QUEST_STATE.DELIVERY_STARTED,
      results.sceneIds.traderMeeting
    );

    results.mapPoints.craftsman = await createMapPoint(
      ctx, 
      "Центральная мастерская", 
      "Мастерская Дитера, известного мастерового города.",
      { lat: 47.99379, lng: 7.84887 },
      25,
      QUEST_STATE.PARTS_COLLECTED,
      results.sceneIds.craftsmanMeeting
    );

    results.mapPoints.anomaly = await createMapPoint(
      ctx, 
      "Аномальная зона", 
      "Место активности разлома. Здесь по данным Дитера находится ценный артефакт.",
      { lat: 47.99243, lng: 7.84838 },
      50,
      QUEST_STATE.ARTIFACT_HUNT,
      results.sceneIds.artifactArea
    );

    // Шаг 6: Обновляем QR-коды с прямыми ссылками на сцены
    await ctx.db.patch(results.qrCodes.trader, {
      data: { 
        npcId: "trader",
        sceneId: results.sceneIds.traderMeeting,
        type: "npc" 
      }
    });

    await ctx.db.patch(results.qrCodes.craftsman, {
      data: { 
        npcId: "craftsman",
        sceneId: results.sceneIds.craftsmanMeeting,
        type: "npc" 
      }
    });

    return results;
  }
});

// Вспомогательные функции для создания объектов

async function createTraderNPC(ctx: MutationCtx) {
  return await ctx.db.insert("npcs", {
    name: "Странствующий торговец",
    type: "trader",
    faction: "neutrals",
    description: "Торговец в потрёпанной, но дорогой одежде, с широкополой шляпой и большим рюкзаком, полным разнообразных товаров.",
    coordinates: {
      lat: 47.99444,
      lng: 7.84638
    },
    isShop: true,
    shopItems: ["ammo", "medkit", "food"]
  });
}

async function createCraftsmanNPC(ctx: MutationCtx) {
  return await ctx.db.insert("npcs", {
    name: "Мастеровой Дитер",
    type: "craftsman",
    faction: "officers",
    description: "Дитер — пожилой, но крепкий мастеровой с седыми усами и очками на носу, всегда занят работой.",
    coordinates: {
      lat: 47.99379,
      lng: 7.84887
    },
    isShop: true,
    shopItems: ["weapon_repair", "armor_upgrade", "crafting"]
  });
}

async function createQRCode(ctx: MutationCtx, code: string, type: "npc" | "location" | "item" | "quest" | "start_quest", data: any, isOneTime: boolean) {
  return await ctx.db.insert("qrCodes", {
    code,
    type,
    data,
    isOneTime,
    usedBy: []
  });
}

async function createMapPoint(
  ctx: MutationCtx, 
  title: string, 
  description: string, 
  coordinates: { lat: number, lng: number }, 
  radius: number, 
  requiredQuestState: string,
  linkedSceneId: Id<"scenes">
) {
  return await ctx.db.insert("mapPoints", {
    title,
    description,
    coordinates,
    radius,
    requiredQuestState,
    linkedSceneId,
    isActive: true
  });
}

// Сцены
async function createTraderMeetingScene(ctx: MutationCtx) {
  return await ctx.db.insert("scenes", {
    title: "Встреча с торговцем",
    sceneKey: "trader_meeting",
    background: "/backgrounds/trader_camp.jpg",
    text: "Вы находите временный лагерь на окраине города, где торговец в широкополой шляпе сортирует свои товары. Завидев вас, он поднимает взгляд.\n\n«А, ты за запчастями от Дитера? Вот, забирай, всё здесь. Только береги, их трудно добыть. И передай Дитеру, что в следующий раз пусть платит больше, или товар пойдёт в другие руки.»",
    choices: [
      {
        text: "Взять запчасти и отправиться к Дитеру",
        action: ACTION.TAKE_PARTS
      }
    ]
  });
}

async function createCraftsmanMeetingScene(ctx: MutationCtx) {
  return await ctx.db.insert("scenes", {
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
}

async function createAdditionalTaskScene(ctx: MutationCtx) {
  return await ctx.db.insert("scenes", {
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
}

async function createArtifactTaskScene(ctx: MutationCtx) {
  return await ctx.db.insert("scenes", {
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
}

async function createArtifactAreaScene(ctx: MutationCtx) {
  return await ctx.db.insert("scenes", {
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
}

async function createArtifactFoundScene(ctx: MutationCtx) {
  return await ctx.db.insert("scenes", {
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
}

async function createQuestCompleteScene(ctx: MutationCtx) {
  return await ctx.db.insert("scenes", {
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
}

// Обновление связей между сценами
async function updateSceneRelationships(ctx: MutationCtx, sceneIds: Record<string, Id<"scenes">>) {
  // Обновляем сцену встречи с торговцем, чтобы она вела к сцене с мастеровым
  await ctx.db.patch(sceneIds.traderMeeting, {
    choices: [
      {
        text: "Взять запчасти и отправиться к Дитеру",
        nextSceneId: sceneIds.craftsmanMeeting,
        action: ACTION.TAKE_PARTS
      }
    ]
  });

  // Обновляем сцену встречи с мастеровым, чтобы она вела к дополнительному заданию
  await ctx.db.patch(sceneIds.craftsmanMeeting, {
    choices: [
      {
        text: "Передать запчасти",
        nextSceneId: sceneIds.additionalTask
      }
    ]
  });

  // Обновляем сцену дополнительного задания, чтобы она вела к заданию с артефактом
  await ctx.db.patch(sceneIds.additionalTask, {
    choices: [
      {
        text: "Что нужно сделать?",
        nextSceneId: sceneIds.artifactTask
      }
    ]
  });

  // Обновляем сцену задания с артефактом
  await ctx.db.patch(sceneIds.artifactTask, {
    choices: [
      {
        text: "Взяться за задание",
        nextSceneId: sceneIds.artifactArea,
        action: ACTION.ACCEPT_ARTIFACT_QUEST
      },
      {
        text: "Отказаться",
        nextSceneId: sceneIds.questComplete,
        action: "decline_artifact_quest"
      }
    ]
  });

  // Обновляем сцену аномальной зоны
  await ctx.db.patch(sceneIds.artifactArea, {
    choices: [
      {
        text: "Осмотреться в поисках артефакта",
        nextSceneId: sceneIds.artifactFound,
        action: "search_artifact"
      }
    ]
  });

  // Обновляем сцену обнаружения артефакта
  await ctx.db.patch(sceneIds.artifactFound, {
    choices: [
      {
        text: "Вернуться к Дитеру",
        nextSceneId: sceneIds.questComplete,
        action: ACTION.RETURN_TO_CRAFTSMAN
      }
    ]
  });
} 