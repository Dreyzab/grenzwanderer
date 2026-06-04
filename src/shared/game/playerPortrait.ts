import { getOriginProfileByFlags } from "../../features/character/originProfiles";
import { EQUIPMENT_SETS } from "./itemCatalog";

/**
 * Resolves player portrait by matching equipped items to defined sets.
 * If all 5 slots match a set's requirements, and the origin matches (if required),
 * returns the set override portrait. Otherwise, falls back to the origin's default portrait.
 */
export function resolvePlayerPortrait(
  flags: Readonly<Record<string, boolean>>,
  equippedBySlot: Readonly<Record<string, string>>,
): string {
  const profile = getOriginProfileByFlags(flags as Record<string, boolean>);
  const originId = profile?.id ?? null;

  // Check if any equipment set is fully equipped
  for (const set of Object.values(EQUIPMENT_SETS)) {
    // If the set specifies a matching origin and it doesn't match active origin, skip
    if (set.originId && set.originId !== originId) {
      continue;
    }

    // Check all slots: head, body, hands, weapon, accessory
    let fullSetEquipped = true;
    for (const [slot, requiredItemId] of Object.entries(set.slotItems)) {
      if (equippedBySlot[slot] !== requiredItemId) {
        fullSetEquipped = false;
        break;
      }
    }

    if (fullSetEquipped) {
      return set.portraitUrl;
    }
  }

  // Fallback to origin base avatar or fallback.png
  return profile?.dossier.avatarUrl ?? "/Characters/fallback.png";
}
