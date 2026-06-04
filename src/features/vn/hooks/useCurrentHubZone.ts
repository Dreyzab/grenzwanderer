import { useMemo } from "react";
import type { VnHubSchema } from "../types";

/**
 * Convention shared with reducers/helpers/effects.ts: zones are stored as
 * mutually exclusive boolean flags keyed `hub_zone_current::<schemaId>::<zoneId>`.
 * Exactly one is expected to be `true` after a `set_hub_zone` effect has run.
 */
const HUB_ZONE_FLAG_PREFIX = "hub_zone_current::";

export const hubZoneFlagKey = (hubSchemaId: string, zoneId: string): string =>
  `${HUB_ZONE_FLAG_PREFIX}${hubSchemaId}::${zoneId}`;

/**
 * Resolves the player's current zone inside a hub overlay.
 *
 * Resolution order:
 *   1. The unique zone whose flag is `true`.
 *   2. `hubSchema.defaultCurrentZoneId` when no flag is set yet.
 *   3. `null` when neither is available.
 *
 * If multiple flags read `true` simultaneously (out-of-band content change
 * or a stale write), the first declared zone wins so the UI remains
 * deterministic across renders.
 */
export const useCurrentHubZone = (
  hubSchema: VnHubSchema | null | undefined,
  myFlags: Record<string, boolean>,
): string | null =>
  useMemo(() => {
    if (!hubSchema) {
      return null;
    }

    for (const zone of hubSchema.zones) {
      if (myFlags[hubZoneFlagKey(hubSchema.id, zone.id)] === true) {
        return zone.id;
      }
    }

    if (hubSchema.defaultCurrentZoneId) {
      const matched = hubSchema.zones.find(
        (zone) => zone.id === hubSchema.defaultCurrentZoneId,
      );
      if (matched) {
        return matched.id;
      }
    }

    return null;
  }, [hubSchema, myFlags]);
