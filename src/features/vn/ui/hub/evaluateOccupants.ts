import type { VnHubZone, VnHubZoneOccupant } from "../../types";
import { areConditionsVisible } from "../../vnContent";
import type { VnChoiceEvaluationContext } from "../../vnContent";

export interface EvaluatedOccupant extends VnHubZoneOccupant {
  /** True when this occupant currently satisfies its visibility gates. */
  visible: boolean;
}

export const evaluateOccupants = (
  occupants: ReadonlyArray<VnHubZoneOccupant> | undefined,
  flags: Record<string, boolean>,
  vars: Record<string, number>,
  context?: VnChoiceEvaluationContext,
): EvaluatedOccupant[] => {
  if (!occupants || occupants.length === 0) {
    return [];
  }

  return occupants.map((occupant) => ({
    ...occupant,
    visible: areConditionsVisible(
      occupant.visibleIfAll,
      occupant.visibleIfAny,
      flags,
      vars,
      context,
    ),
  }));
};

export const collectVisibleOccupantNpcIds = (
  zone: Pick<VnHubZone, "occupants">,
  flags: Record<string, boolean>,
  vars: Record<string, number>,
  context?: VnChoiceEvaluationContext,
): string[] =>
  evaluateOccupants(zone.occupants, flags, vars, context)
    .filter((occupant) => occupant.visible)
    .map((occupant) => occupant.npcId);
