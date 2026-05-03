import { SenderError } from "spacetimedb/server";

import {
  parseVnSnapshotPayload,
  type VnSnapshot,
} from "../../../../src/shared/vn-contract";

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

export { parseStoredMapEventPayload } from "./map_runtime";

export {
  parseBoolean,
  parseNumber,
  parseRequiredFactIdsJson,
  parseRequiredVarsJson,
  parseRewardEffectsJson,
  parseTagsJsonObject,
} from "./payload_json";
