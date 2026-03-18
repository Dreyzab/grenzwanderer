export const findPrimaryInternalizedThought = (
  snapshot: any,
  flags: Record<string, boolean>,
  vars: Record<string, number>,
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

export const createMindThought = (id: string) => {
  return { id, internalized: false };
};
