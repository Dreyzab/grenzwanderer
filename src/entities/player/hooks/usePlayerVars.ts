import { usePlayerBindings } from "./usePlayerBindings";

export const usePlayerVars = (): Record<string, number> =>
  usePlayerBindings().vars;
