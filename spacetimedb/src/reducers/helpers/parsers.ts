import { SenderError } from "spacetimedb/server";

import { parseVnSnapshotPayload } from "../../../../src/shared/vn-contract";
import type { VnSnapshot } from "./all";

export const parseSnapshotPayload = (payloadJson: string): VnSnapshot => {
  const result = parseVnSnapshotPayload(payloadJson);
  if (!result.ok) {
    throw new SenderError(
      result.issues
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join("; "),
    );
  }

  return result.snapshot as VnSnapshot;
};

export {
  parseBoolean,
  parseNumber,
  parseRequiredFactIdsJson,
  parseRequiredVarsJson,
  parseRewardEffectsJson,
  parseStoredMapEventPayload,
  parseTagsJsonObject,
} from "./all";
