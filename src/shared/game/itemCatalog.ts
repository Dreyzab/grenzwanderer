export type EquipmentSlot = "head" | "body" | "hands" | "weapon" | "accessory";

export interface ItemDefinition {
  id: string;
  name: string;
  nameRu: string;
  type: string;
  slot?: EquipmentSlot;
  setId?: string;
  value?: number;
  iconUrl?: string;
}

export interface EquipmentSetDefinition {
  id: string;
  displayName: string;
  displayNameRu: string;
  slotItems: Record<EquipmentSlot, string>;
  portraitUrl: string;
  originId?: string;
}

export const ITEM_DEFINITIONS: Record<string, ItemDefinition> = {
  // Clues & Consumables from Obsidian Catalog
  key: {
    id: "key",
    name: "Rusty Key",
    nameRu: "Ржавый ключ",
    type: "key_item",
    value: 0,
  },
  coin: {
    id: "coin",
    name: "Strange Coin",
    nameRu: "Странная монета",
    type: "clue",
    value: 50,
  },
  cig: {
    id: "cig",
    name: "Half-smoked Cigarette",
    nameRu: "Полукуренная сигарета",
    type: "clue",
    value: 0,
  },
  bread: {
    id: "bread",
    name: "Stale Bread",
    nameRu: "Черствый хлеб",
    type: "consumable",
    value: 2,
  },
  lockpick: {
    id: "lockpick",
    name: "Lockpick Set",
    nameRu: "Набор отмычек",
    type: "resource",
    value: 80,
  },
  map_fragment: {
    id: "map_fragment",
    name: "Torn Map Fragment",
    nameRu: "Обрывок карты",
    type: "clue",
    value: 200,
  },
  whiskey: {
    id: "whiskey",
    name: "Cheap Whiskey",
    nameRu: "Дешевый виски",
    type: "consumable",
    value: 30,
  },
  bandage: {
    id: "bandage",
    name: "Sterile Bandage",
    nameRu: "Стерильный бинт",
    type: "consumable",
    value: 18,
  },
  tonic: {
    id: "tonic",
    name: "Restorative Tonic",
    nameRu: "Восстанавливающий тоник",
    type: "consumable",
    value: 42,
  },
  focus_draught: {
    id: "focus_draught",
    name: "Focus Draught",
    nameRu: "Эликсир концентрации",
    type: "consumable",
    value: 55,
  },
  starched_collar: {
    id: "starched_collar",
    name: "Starched Collar",
    nameRu: "Накрахмаленный воротник",
    type: "consumable",
    value: 65,
  },
  tailored_gloves: {
    id: "tailored_gloves",
    name: "Tailored Gloves",
    nameRu: "Шитые перчатки",
    type: "resource",
    value: 90,
  },
  hot_stew: {
    id: "hot_stew",
    name: "Hot Stew",
    nameRu: "Горячая похлебка",
    type: "consumable",
    value: 12,
  },
  rumor_note: {
    id: "rumor_note",
    name: "Rumor Note",
    nameRu: "Записка со слухами",
    type: "clue",
    value: 90,
  },
  district_pass: {
    id: "district_pass",
    name: "District Pass",
    nameRu: "Пропуск в район",
    type: "key_item",
    value: 150,
  },
  forged_pass: {
    id: "forged_pass",
    name: "Forged Transit Pass",
    nameRu: "Поддельный транзитный пропуск",
    type: "resource",
    value: 170,
  },

  // Witch Veil Set (5/5 Equipment)
  witch_veil_head: {
    id: "witch_veil_head",
    name: "Witch Veil",
    nameRu: "Ведьминская вуаль",
    type: "equipment",
    slot: "head",
    setId: "witch_veil_set",
    value: 120,
    iconUrl: "/images/items/witch_veil_head.png",
  },
  witch_veil_body: {
    id: "witch_veil_body",
    name: "Witch Robe",
    nameRu: "Ведьминская роба",
    type: "equipment",
    slot: "body",
    setId: "witch_veil_set",
    value: 250,
    iconUrl: "/images/items/witch_veil_body.png",
  },
  witch_veil_hands: {
    id: "witch_veil_hands",
    name: "Witch Gloves",
    nameRu: "Ведьминские перчатки",
    type: "equipment",
    slot: "hands",
    setId: "witch_veil_set",
    value: 90,
    iconUrl: "/images/items/witch_veil_hands.png",
  },
  witch_veil_weapon: {
    id: "witch_veil_weapon",
    name: "Witch Staff",
    nameRu: "Ведьминский посох",
    type: "equipment",
    slot: "weapon",
    setId: "witch_veil_set",
    value: 300,
    iconUrl: "/images/items/witch_veil_weapon.png",
  },
  witch_veil_accessory: {
    id: "witch_veil_accessory",
    name: "Witch Amulet",
    nameRu: "Ведьминский амулет",
    type: "equipment",
    slot: "accessory",
    setId: "witch_veil_set",
    value: 150,
    iconUrl: "/images/items/witch_veil_accessory.png",
  },
};

export const EQUIPMENT_SETS: Record<string, EquipmentSetDefinition> = {
  witch_veil_set: {
    id: "witch_veil_set",
    displayName: "Witch Veil Set",
    displayNameRu: "Набор Ведьминого Покрова",
    slotItems: {
      head: "witch_veil_head",
      body: "witch_veil_body",
      hands: "witch_veil_hands",
      weapon: "witch_veil_weapon",
      accessory: "witch_veil_accessory",
    },
    portraitUrl:
      "/Characters/Eleonora/eleonora_mother_refined_1776592048672.png",
    originId: "witch",
  },
};

export function getItemDefinition(id: string): ItemDefinition | undefined {
  return ITEM_DEFINITIONS[id];
}

export function getEquipmentItemsForSlot(
  slot: EquipmentSlot,
): ItemDefinition[] {
  return Object.values(ITEM_DEFINITIONS).filter((item) => item.slot === slot);
}
