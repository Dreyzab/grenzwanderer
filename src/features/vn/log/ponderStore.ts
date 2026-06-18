// Local persistence for "Обдумать" (Ponder): saves the player's question (prompt)
// and the produced answer (result) per scenario, keyed alongside the existing DM
// ledger convention (grenzwanderer_dm_session_ledger_*). No backend yet — the AI
// pipeline fills `result` later; for now this is just the save/load primitive.

export interface PonderEntry {
  id: string;
  nodeId: string;
  prompt: string;
  result: string;
  createdAt: number;
}

const keyFor = (scenarioId: string): string =>
  `grenzwanderer_ponder_${scenarioId}`;

export function loadPonders(scenarioId: string): PonderEntry[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(keyFor(scenarioId));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PonderEntry[]) : [];
  } catch {
    return [];
  }
}

export function savePonder(
  scenarioId: string,
  entry: Omit<PonderEntry, "id" | "createdAt">,
): PonderEntry {
  const saved: PonderEntry = {
    ...entry,
    id: `${entry.nodeId}:${Date.now()}`,
    createdAt: Date.now(),
  };
  if (typeof window === "undefined") {
    return saved;
  }
  const next = [...loadPonders(scenarioId), saved];
  window.localStorage.setItem(keyFor(scenarioId), JSON.stringify(next));
  return saved;
}
