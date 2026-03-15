import {
  FREIBURG_LOCATION_CAST_BY_ID,
  FREIBURG_NPC_REGISTRY_BY_ID,
} from "../../../scripts/data/freiburg_location_cast";

export interface LocationCastContactPresentation {
  id: string;
  displayName: string;
  publicRole: string;
  sceneNote: string;
}

export interface LocationCastPresentation {
  locationId: string;
  tone: string;
  dramaticFunction: string;
  primaryNpc: LocationCastContactPresentation;
  supportNpcs: LocationCastContactPresentation[];
}

const toContactPresentation = (
  npcId: string,
): LocationCastContactPresentation | null => {
  const profile = FREIBURG_NPC_REGISTRY_BY_ID.get(npcId);
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    displayName: profile.displayName,
    publicRole: profile.publicRole,
    sceneNote: profile.sceneNote,
  };
};

export const getLocationCastPresentation = (
  locationId: string,
): LocationCastPresentation | null => {
  const locationCast = FREIBURG_LOCATION_CAST_BY_ID.get(locationId);
  if (!locationCast) {
    return null;
  }

  const primaryNpc = toContactPresentation(locationCast.primaryNpcId);
  if (!primaryNpc) {
    return null;
  }

  return {
    locationId: locationCast.locationId,
    tone: locationCast.tone,
    dramaticFunction: locationCast.dramaticFunction,
    primaryNpc,
    supportNpcs: locationCast.supportNpcIds
      .map((npcId) => toContactPresentation(npcId))
      .filter(
        (entry): entry is LocationCastContactPresentation => entry !== null,
      ),
  };
};
