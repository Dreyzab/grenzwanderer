import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const OwnerType = v.union(
  v.literal("player"),
  v.literal("npc"),
  v.literal("chest"),
  v.literal("session")
);

export const ItemLocation = v.union(
  v.literal("equipment"),
  v.literal("backpack"),
  v.literal("stash")
);

export const getInventory = query({
  args: { ownerId: v.string(), ownerType: OwnerType, location: v.optional(ItemLocation) },
  handler: async (ctx, { ownerId, ownerType, location }) => {
    let query = ctx.db
      .query("inventories")
      .withIndex("by_owner", (q) => q.eq("ownerType", ownerType).eq("ownerId", ownerId));
    if (location) {
      query = query.filter(q => q.eq(q.field("location"), location));
    }
    const items = await query.collect();
    return items;
  },
});

export const addItemToInventory = mutation({
  args: {
    ownerId: v.string(),
    ownerType: OwnerType,
    itemId: v.string(),
    quantity: v.number(),
    location: ItemLocation,
    equipped: v.optional(v.boolean())
  },
  handler: async (ctx, { ownerId, ownerType, itemId, quantity, location, equipped }) => {
    const itemExists = await ctx.db.get(itemId as Id<"items">);
    if (!itemExists) throw new Error("Предмет не найден");
    if (ownerType === "player") {
      const player = await ctx.db.get(ownerId as Id<"players">);
      if (!player) throw new Error("Игрок не найден");
    } else if (ownerType === "npc") {
      const npc = await ctx.db.get(ownerId as Id<"npcs">);
      if (!npc) throw new Error("NPC не найден");
    }
    const existingItem = await ctx.db
      .query("inventories")
      .withIndex("by_owner_item", (q) =>
        q.eq("ownerType", ownerType)
         .eq("ownerId", ownerId)
         .eq("itemId", itemId)
         .eq("location", location)
      )
      .first();
    if (existingItem && !equipped) {
      await ctx.db.patch(existingItem._id, {
        quantity: existingItem.quantity + quantity
      });
      return existingItem._id;
    } else {
      const newId = await ctx.db.insert("inventories", {
        ownerId,
        ownerType,
        itemId,
        quantity,
        location,
        equipped: equipped || false
      });
      return newId;
    }
  },
});

export const moveItem = mutation({
  args: {
    inventoryItemId: v.id("inventories"),
    targetOwnerId: v.string(),
    targetOwnerType: OwnerType,
    targetLocation: ItemLocation,
    quantity: v.optional(v.number())
  },
  handler: async (ctx, { inventoryItemId, targetOwnerId, targetOwnerType, targetLocation, quantity }) => {
    const item = await ctx.db.get(inventoryItemId);
    if (!item) throw new Error("Предмет инвентаря не найден");
    const moveQuantity = quantity || item.quantity;
    if (moveQuantity > item.quantity) throw new Error("Недостаточное количество предметов");
    const targetItem = await ctx.db
      .query("inventories")
      .withIndex("by_owner_item", (q) =>
        q.eq("ownerType", targetOwnerType)
         .eq("ownerId", targetOwnerId)
         .eq("itemId", item.itemId)
         .eq("location", targetLocation)
      )
      .filter(q => q.eq(q.field("equipped"), false))
      .first();
    if (targetItem) {
      await ctx.db.patch(targetItem._id, {
        quantity: targetItem.quantity + moveQuantity
      });
    } else {
      await ctx.db.insert("inventories", {
        ownerId: targetOwnerId,
        ownerType: targetOwnerType,
        itemId: item.itemId,
        quantity: moveQuantity,
        location: targetLocation,
        equipped: false
      });
    }
    if (moveQuantity === item.quantity) {
      await ctx.db.delete(inventoryItemId);
    } else {
      await ctx.db.patch(inventoryItemId, {
        quantity: item.quantity - moveQuantity
      });
    }
    return true;
  },
});

export const equipItem = mutation({
  args: {
    inventoryItemId: v.id("inventories"),
    playerId: v.id("players"),
    slotType: v.optional(v.string())
  },
  handler: async (ctx, { inventoryItemId, playerId, slotType }) => {
    const item = await ctx.db.get(inventoryItemId);
    if (!item) throw new Error("Предмет инвентаря не найден");
    if (item.ownerType !== "player" || item.ownerId !== playerId) throw new Error("Предмет не принадлежит игроку");
    const itemInfo = await ctx.db.get(item.itemId as Id<"items">);
    if (!itemInfo) throw new Error("Информация о предмете не найдена");
    const itemType = itemInfo.type;
    const targetSlot = slotType || getDefaultSlotForItemType(itemType);
    if (!targetSlot) throw new Error("Этот предмет нельзя экипировать");
    const equippedItem = await ctx.db
      .query("inventories")
      .withIndex("by_owner", (q) =>
        q.eq("ownerType", "player").eq("ownerId", playerId)
      )
      .filter(q =>
        q.eq(q.field("equipped"), true) &&
        q.eq(q.field("slotType"), targetSlot)
      )
      .first();
    if (equippedItem) {
      await ctx.db.patch(equippedItem._id, {
        equipped: false,
        slotType: undefined,
        location: "backpack"
      });
    }
    await ctx.db.patch(inventoryItemId, {
      equipped: true,
      slotType: targetSlot,
      location: "equipment"
    });
    return true;
  },
});

export const unequipItem = mutation({
  args: {
    inventoryItemId: v.id("inventories"),
    playerId: v.id("players")
  },
  handler: async (ctx, { inventoryItemId, playerId }) => {
    const item = await ctx.db.get(inventoryItemId);
    if (!item) throw new Error("Предмет инвентаря не найден");
    if (item.ownerType !== "player" || item.ownerId !== playerId || !item.equipped) throw new Error("Предмет не экипирован или не принадлежит игроку");
    await ctx.db.patch(inventoryItemId, {
      equipped: false,
      slotType: undefined,
      location: "backpack"
    });
    return true;
  },
});

export const useItem = mutation({
  args: {
    inventoryItemId: v.id("inventories"),
    playerId: v.id("players"),
    quantity: v.optional(v.number())
  },
  handler: async (ctx, { inventoryItemId, playerId, quantity }) => {
    const item = await ctx.db.get(inventoryItemId);
    if (!item) throw new Error("Предмет инвентаря не найден");
    if (item.ownerType !== "player" || item.ownerId !== playerId) throw new Error("Предмет не принадлежит игроку");
    const itemInfo = await ctx.db.get(item.itemId as Id<"items">);
    if (!itemInfo) throw new Error("Информация о предмете не найдена");
    if (itemInfo.type !== "consumable") throw new Error("Этот предмет нельзя использовать");
    const useQuantity = quantity || 1;
    if (useQuantity > item.quantity) throw new Error("Недостаточное количество предметов");
    // Здесь можно реализовать эффекты предмета
    if (item.quantity <= useQuantity) {
      await ctx.db.delete(inventoryItemId);
    } else {
      await ctx.db.patch(inventoryItemId, {
        quantity: item.quantity - useQuantity
      });
    }
    return {
      success: true,
      effects: itemInfo.effects
    };
  },
});

function getDefaultSlotForItemType(itemType: string): string | null {
  switch (itemType) {
    case "weapon": return "primary";
    case "secondary_weapon": return "secondary";
    case "armor": return "body";
    case "helmet": return "head";
    case "accessory": return "accessory";
    default: return null;
  }
}

// ... Остальные функции (moveItem, equipItem, unequipItem, useItem) можно добавить по аналогии ... 