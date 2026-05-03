import { usePlayerBindings } from "./usePlayerBindings";

export const usePlayerFlags = (): Record<string, boolean> =>
  usePlayerBindings().flags;
