export const findPrimaryInternalizedThought = (
  snapshot: any,
  flags: Record<string, boolean>,
  _vars: Record<string, number>,
): { title: string; internalized: boolean } | null => {
  if (!snapshot?.mindPalace?.hypotheses) {
    return null;
  }

  // Common pattern for internalized thoughts in this codebase:
  // mind_internalized::thought_id
  for (const hypothesis of snapshot.mindPalace.hypotheses) {
    const flagKey = `mind_internalized::${hypothesis.id}`;
    if (flags[flagKey]) {
      return { title: hypothesis.text, internalized: true };
    }
  }

  return null;
};

export const createMindThoughtUnlockedFlagKey = (thoughtId: string): string =>
  `mind_unlocked::${thoughtId}`;

export const createMindThoughtResearchingFlagKey = (
  thoughtId: string,
): string => `mind_researching::${thoughtId}`;

export const createMindThoughtInternalizedFlagKey = (
  thoughtId: string,
): string => `mind_internalized::${thoughtId}`;

export const createMindThought = (id: string) => {
  return { id, internalized: false };
};
