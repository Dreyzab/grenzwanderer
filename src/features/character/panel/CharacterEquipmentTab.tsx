import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowUp, RefreshCw, AlertCircle } from "lucide-react";
import type { getCharacterStrings } from "../../i18n/uiStrings";
import type { OriginProfileDefinition } from "../originProfiles";
import { C, TAB_TRANSITION } from "./characterPanel.theme";
import { SectionCard } from "./characterPanelPrimitives";
import {
  type EquipmentSlot,
  type ItemDefinition,
  getItemDefinition,
  EQUIPMENT_SETS,
} from "../../../shared/game/itemCatalog";
import type { PlayerInventory } from "../../../shared/spacetime/bindings";

interface CharacterEquipmentTabProps {
  activeOrigin: OriginProfileDefinition | null;
  equippedBySlot: Record<EquipmentSlot, string>;
  portraitUrl: string;
  equipItem: (slotId: string, itemId: string) => Promise<void>;
  unequipItem: (slotId: string) => Promise<void>;
  inventoryRows: readonly PlayerInventory[];
  t: ReturnType<typeof getCharacterStrings>;
}

export const CharacterEquipmentTab = ({
  activeOrigin,
  equippedBySlot,
  portraitUrl,
  equipItem,
  unequipItem,
  inventoryRows,
  t,
}: CharacterEquipmentTabProps) => {
  const dossierAccent = activeOrigin?.dossier.accentColor ?? C.brass;
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);
  const [isEquipping, setIsEquipping] = useState<string | null>(null);

  const slotLabels: Record<EquipmentSlot, { label: string; icon: string }> = {
    head: { label: t.slots?.head ?? "Head", icon: "🦱" },
    body: { label: t.slots?.body ?? "Body", icon: "🧥" },
    hands: { label: t.slots?.hands ?? "Hands", icon: "🧤" },
    weapon: { label: t.slots?.weapon ?? "Weapon", icon: "🗡️" },
    accessory: { label: t.slots?.accessory ?? "Accessory", icon: "📿" },
  };

  // Resolve inventory items suitable for slots
  const ownedEquipmentBySlot = useMemo(() => {
    const result: Record<EquipmentSlot, ItemDefinition[]> = {
      head: [],
      body: [],
      hands: [],
      weapon: [],
      accessory: [],
    };

    for (const inv of inventoryRows) {
      if (inv.quantity < 1) continue;
      const def = getItemDefinition(inv.itemId);
      if (def && def.slot) {
        result[def.slot].push(def);
      }
    }

    return result;
  }, [inventoryRows]);

  // Set progression calculation
  const setProgression = useMemo(() => {
    return Object.values(EQUIPMENT_SETS).map((set) => {
      let equippedCount = 0;
      const requiredItems = Object.values(set.slotItems);

      for (const itemId of Object.values(equippedBySlot)) {
        if (itemId && requiredItems.includes(itemId)) {
          equippedCount++;
        }
      }

      return {
        ...set,
        count: equippedCount,
        total: requiredItems.length,
        isComplete: equippedCount === requiredItems.length,
      };
    });
  }, [equippedBySlot]);

  const handleEquip = async (slot: EquipmentSlot, itemId: string) => {
    setIsEquipping(itemId);
    try {
      await equipItem(slot, itemId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEquipping(null);
    }
  };

  const handleUnequip = async (slot: EquipmentSlot) => {
    setIsEquipping(`unequip-${slot}`);
    try {
      await unequipItem(slot);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEquipping(null);
    }
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
      exit={{ opacity: 0, y: -10 }}
      initial={{ opacity: 0, y: 10 }}
      key="equipment"
      transition={TAB_TRANSITION}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,1.2fr)]">
        {/* Left Side: Avatar + Set Progress */}
        <div className="space-y-4">
          <SectionCard
            accent={dossierAccent}
            eyebrow={t.avatarPreview ?? "Dossier Portrait"}
            title={activeOrigin?.dossier.characterName ?? "Field Agent"}
          >
            <div className="flex flex-col items-center space-y-4 md:flex-row md:space-x-6 md:space-y-0">
              {/* Premium Geometric Portrait Frame */}
              <div
                className="relative overflow-hidden border bg-stone-900/60 p-1"
                style={{
                  borderColor: dossierAccent,
                  borderRadius: "2px",
                  boxShadow: `0 0 15px -3px ${dossierAccent}40`,
                }}
              >
                <img
                  alt="Character Portrait"
                  className="h-48 w-48 object-cover brightness-95 contrast-105"
                  src={portraitUrl}
                />

                {/* Visual Glitch Lines / Sci-Fi Deco */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-stone-400/30 to-transparent"
                  style={{ backgroundColor: dossierAccent }}
                />
              </div>

              {/* Set Bonuses Information */}
              <div className="flex-1 space-y-4 text-sm text-stone-300">
                <div>
                  <h4 className="font-semibold text-stone-100 uppercase tracking-wider text-xs">
                    {t.activeSetBonuses ?? "Active Set Bonuses"}
                  </h4>
                  <p className="mt-1 text-xs text-stone-400 leading-relaxed">
                    {t.setDesc ??
                      "Equip all 5 set items to unlock your refined high-fidelity identity override."}
                  </p>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-3">
                  {setProgression.map((set) => {
                    const isWitchOrigin = activeOrigin?.id === "witch";
                    const displaySet =
                      set.originId === "witch"
                        ? isWitchOrigin
                          ? true
                          : false
                        : true;
                    if (!displaySet) return null;

                    return (
                      <div
                        key={set.id}
                        className="rounded border border-white/5 bg-black/10 p-3"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-stone-200">
                            {t.isRussian ? set.displayNameRu : set.displayName}
                          </span>
                          <span
                            className="font-mono px-2 py-0.5 rounded text-[10px]"
                            style={{
                              color: set.isComplete ? C.amber : dossierAccent,
                              backgroundColor: `${set.isComplete ? C.amber : dossierAccent}15`,
                            }}
                          >
                            {set.count} / {set.total}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-2 h-1.5 w-full bg-stone-900/80 overflow-hidden rounded-[1px] border border-white/5">
                          <motion.div
                            className="h-full"
                            style={{
                              backgroundColor: set.isComplete
                                ? C.amber
                                : dossierAccent,
                            }}
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(set.count / set.total) * 100}%`,
                            }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                        {set.isComplete && (
                          <div className="mt-2 flex items-center space-x-1.5 text-[10px] text-amber-400 font-medium">
                            <ArrowUp className="h-3 w-3 animate-bounce" />
                            <span>
                              {t.identityOverridden ??
                                "Identity Override Active!"}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right Side: Slots Grid + Detailed Equipper */}
        <div className="space-y-4">
          <SectionCard
            accent={dossierAccent}
            eyebrow={t.characterEquipment ?? "Equipment System"}
            title={t.slotsTitle ?? "Tactical Slots"}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {(Object.keys(slotLabels) as EquipmentSlot[]).map((slot) => {
                const itemId = equippedBySlot[slot];
                const itemDef = itemId ? getItemDefinition(itemId) : null;
                const slotInfo = slotLabels[slot];
                const isSelected = selectedSlot === slot;
                const hasOptions = ownedEquipmentBySlot[slot].length > 0;

                return (
                  <div
                    key={slot}
                    className={`group relative border transition-all p-3 flex flex-col justify-between ${
                      isSelected
                        ? "bg-stone-900/80 border-stone-500/60"
                        : "bg-black/20 border-white/8 hover:border-white/20"
                    }`}
                    style={{ borderRadius: "2px" }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {itemDef?.iconUrl ? (
                          <div
                            className="relative h-10 w-10 flex-shrink-0 overflow-hidden border bg-stone-950 p-0.5"
                            style={{
                              borderColor: isSelected
                                ? dossierAccent
                                : `${dossierAccent}60`,
                              borderRadius: "1px",
                              boxShadow: `0 0 8px -2px ${dossierAccent}30`,
                            }}
                          >
                            <img
                              src={itemDef.iconUrl}
                              alt={itemDef.name}
                              className="h-full w-full object-cover brightness-90 contrast-105"
                            />
                          </div>
                        ) : (
                          <span className="text-lg filter drop-shadow h-10 w-10 flex items-center justify-center bg-black/30 border border-white/5 rounded-[1px]">
                            {slotInfo.icon}
                          </span>
                        )}
                        <div>
                          <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">
                            {slotInfo.label}
                          </span>
                          <span
                            className={`text-sm font-medium ${itemDef ? "text-stone-100" : "text-stone-400/60"}`}
                          >
                            {itemDef
                              ? t.isRussian
                                ? itemDef.nameRu
                                : itemDef.name
                              : (t.emptySlot ?? "Empty Slot")}
                          </span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center space-x-2">
                        {itemDef && (
                          <button
                            onClick={() => handleUnequip(slot)}
                            disabled={isEquipping !== null}
                            className="px-2.5 py-1 border border-red-900/30 bg-red-950/20 hover:bg-red-900/30 text-red-400 text-xs font-mono disabled:opacity-40"
                            style={{ borderRadius: "1px" }}
                          >
                            {isEquipping === `unequip-${slot}` ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              (t.unequip ?? "Unequip")
                            )}
                          </button>
                        )}

                        <button
                          onClick={() =>
                            setSelectedSlot(isSelected ? null : slot)
                          }
                          disabled={!hasOptions && !itemDef}
                          className={`px-2.5 py-1 border text-xs font-mono disabled:opacity-30 ${
                            isSelected
                              ? "bg-stone-100 text-stone-950 border-stone-100 hover:bg-stone-200"
                              : "bg-transparent text-stone-300 border-white/10 hover:border-white/30"
                          }`}
                          style={{ borderRadius: "1px" }}
                        >
                          {isSelected
                            ? (t.close ?? "Close")
                            : (t.change ?? "Equip")}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Inventory Options */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden mt-3 pt-3 border-t border-white/5 space-y-2"
                        >
                          <h5 className="text-[10px] uppercase font-mono tracking-wider text-stone-500">
                            {t.availableInInventory ?? "Available in Inventory"}
                          </h5>
                          {ownedEquipmentBySlot[slot].length === 0 ? (
                            <div className="flex items-center space-x-2 p-2 border border-white/5 bg-black/30 rounded-[1px] text-xs text-stone-500">
                              <AlertCircle className="h-3.5 w-3.5" />
                              <span>
                                {t.noSuitableItems ??
                                  "No matching items in your inventory."}
                              </span>
                            </div>
                          ) : (
                            <div className="grid gap-2">
                              {ownedEquipmentBySlot[slot].map((item) => {
                                const isEquipped = item.id === itemId;
                                return (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between p-2 border border-white/5 bg-black/40 hover:bg-black/60 rounded-[1px] text-xs gap-3"
                                  >
                                    <div className="flex items-center space-x-3 min-w-0">
                                      {item.iconUrl && (
                                        <div
                                          className="relative h-8 w-8 flex-shrink-0 overflow-hidden border border-white/10 bg-stone-950 p-0.5"
                                          style={{ borderRadius: "1px" }}
                                        >
                                          <img
                                            src={item.iconUrl}
                                            alt={item.name}
                                            className="h-full w-full object-cover brightness-90"
                                          />
                                        </div>
                                      )}
                                      <div className="space-y-0.5 min-w-0 truncate">
                                        <span className="font-medium text-stone-200 block truncate">
                                          {t.isRussian
                                            ? item.nameRu
                                            : item.name}
                                        </span>
                                        {item.setId && (
                                          <span className="block text-[9px] text-amber-500 font-mono">
                                            ★{" "}
                                            {t.isRussian
                                              ? "Часть ведьминского сета"
                                              : "Set item"}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      disabled={
                                        isEquipped || isEquipping !== null
                                      }
                                      onClick={() => handleEquip(slot, item.id)}
                                      className={`px-3 py-1 border font-mono text-[10px] disabled:opacity-40 ${
                                        isEquipped
                                          ? "border-amber-500/30 text-amber-400 bg-amber-950/10 cursor-default"
                                          : "border-white/10 hover:border-white/30 text-stone-300 hover:bg-white/5"
                                      }`}
                                      style={{ borderRadius: "1px" }}
                                    >
                                      {isEquipping === item.id ? (
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                      ) : isEquipped ? (
                                        (t.activeEquipped ?? "Equipped")
                                      ) : (
                                        (t.equipItemBtn ?? "Equip")
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      </div>
    </motion.div>
  );
};
