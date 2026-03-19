import { isAllowedFactionId } from "../../../../data/factionContract";

export const getFactionIdValidationError = (
  factionId: string,
): string | null => {
  if (!isAllowedFactionId(factionId)) {
    return `Unsupported factionId: ${factionId}`;
  }
  return null;
};
