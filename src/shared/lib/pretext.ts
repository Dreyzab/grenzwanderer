/**
 * Optional cache reset for @chenglou/pretext font layout. Safe no-op if pretext is unused.
 */
export function resetPretextCaches(): void {
  try {
    const mod = (
      globalThis as unknown as { __pretextCaches?: { clear?: () => void } }
    ).__pretextCaches;
    mod?.clear?.();
  } catch {
    /* ignore */
  }
}
