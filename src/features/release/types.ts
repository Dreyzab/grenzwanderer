export type ReleaseProfile =
  | "default"
  | "karlsruhe_event"
  | "freiburg_detective";

export type EntryGateState =
  | "scan_required"
  | "validating"
  | "granted"
  | "denied";

export interface SceneGenerationResult {
  imageUrl: string;
  cacheKey: string;
  promptVersion: string;
}
