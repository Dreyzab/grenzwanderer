import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Определяем типы NPC (можно расширить при необходимости)
const NPCType = v.union(
  v.literal("trader"),
  v.literal("craftsman"),
  v.literal("scientist"),
  v.literal("guard"),
  v.literal("smuggler") // Добавлен тип контрабандиста
);

// Определяем фракции
const Faction = v.union(
  v.literal("neutrals"),
  v.literal("officers"),
  v.literal("villains"),
  v.literal("survivors"),
  v.literal("scientists") // Добавлена фракция ученых
);

export const initializeAdditionalNpcs = mutation({
  args: {},
  handler: async (ctx) => {
    const npcsToAdd = [
      {
        name: "Herr Krämer",
        type: "trader",
        faction: "neutrals",
        description: "Торговец, всегда готовый к сделке.",
        coordinates: { lat: 47.99377357367348, lng: 7.853762448735239 },
        isShop: true,
        shopItems: ["ammo", "medkit", "food"]
      },
      {
        name: "Konrad Fuchs",
        type: "smuggler", // Используем новый тип
        faction: "villains", // Контрабандисты часто связаны с теневой стороной
        description: "Хитрый контрабандист с сомнительными связями.",
        coordinates: { lat: 47.99368223398133, lng: 7.852041864441958 },
        isShop: true, // Контрабандисты тоже торгуют
        shopItems: ["rare_items", "illegal_mods"]
      },
      {
        name: "Willy Wunderkram",
        type: "trader",
        faction: "neutrals",
        description: "Эксцентричный торговец редкими и странными вещами.",
        coordinates: { lat: 47.99706739900347, lng: 7.8547988706480965 },
        isShop: true,
        shopItems: ["curiosities", "artifacts_parts"]
      },
      {
        name: "Meister Kolben",
        type: "craftsman",
        faction: "officers", // Мастера часто работают на структуры
        description: "Опытный мастеровой, способный починить что угодно.",
        coordinates: { lat: 47.99546342379935, lng: 7.8502929496824265 },
        isShop: true,
        shopItems: ["weapon_repair", "armor_upgrade"]
      },
      {
        name: "Onkel Moishe",
        type: "trader",
        faction: "neutrals",
        description: "Старый торговец, знающий все слухи.",
        coordinates: { lat: 47.99629669536293, lng: 7.853714935578836 },
        isShop: true,
        shopItems: ["information", "consumables"]
      },
      {
        name: "Konrad Stillwerk",
        type: "craftsman", // Техник - подвид мастерового
        faction: "officers",
        description: "Техник-оружейник, специализирующийся на модификациях.",
        coordinates: { lat: 47.99285160404989, lng: 7.852633998742704 },
        isShop: true,
        shopItems: ["weapon_mods", "ammo_crafting"]
      },
      {
        name: "Der Schweißer",
        type: "craftsman",
        faction: "officers",
        description: "Мастер тяжелой брони и сварки.",
        coordinates: { lat: 47.99742380742563, lng: 7.852745281731302 },
        isShop: true,
        shopItems: ["armor_repair", "heavy_armor_mods"]
      },
      {
        name: "Dr. B. Kupferbart",
        type: "scientist", // Используем новый тип
        faction: "scientists", // Используем новую фракцию
        description: "Ученый-гном, исследователь эфира и аномалий.",
        coordinates: { lat: 47.997576622711165, lng: 7.846188682377118 },
        isShop: false // Ученые обычно не торгуют стандартно
      },
      {
        name: "Martin Heidegger", // Имя явно отсылает к философу, сделаем его ученым
        type: "scientist",
        faction: "scientists",
        description: "Задумчивый ученый, изучающий природу разломов.",
        coordinates: { lat: 47.993619826562394, lng: 7.846197718874748 },
        isShop: false
      },
      {
        name: "Eisenhund",
        type: "guard", // Используем новый тип
        faction: "officers",
        description: "Суровый охранник правопорядка.",
        coordinates: { lat: 47.9976096169826, lng: 7.84228796306877 },
        isShop: false
      },
      {
        name: "RED",
        type: "guard",
        faction: "officers",
        description: "Молчаливый и эффективный охранник.",
        coordinates: { lat: 47.99281370342848, lng: 7.854078907179314 },
        isShop: false
      },
      {
        name: "Khrin",
        type: "guard",
        faction: "officers",
        description: "Охранник, патрулирующий окрестности.",
        coordinates: { lat: 47.99473599272267, lng: 7.849878265589837 },
        isShop: false
      },
      {
        name: "Kremin",
        type: "guard",
        faction: "officers",
        description: "Начальник смены охраны.",
        coordinates: { lat: 47.99796153752612, lng: 7.853012693842373 },
        isShop: false
      },
    ];

    const results = [];
    for (const npcData of npcsToAdd) {
      // Проверка на существование NPC с таким именем
      const existing = await ctx.db
        .query("npcs")
        .withIndex("by_name", (q) => q.eq("name", npcData.name))
        .unique();

      if (!existing) {
        const npcId = await ctx.db.insert("npcs", npcData as any); // Используем any временно, пока схема не обновлена
        results.push({ name: npcData.name, id: npcId, status: "created" });
      } else {
        results.push({ name: npcData.name, id: existing._id, status: "exists" });
      }
    }

    return {
      message: "Дополнительные NPC инициализированы.",
      results: results
    };
  },
}); 