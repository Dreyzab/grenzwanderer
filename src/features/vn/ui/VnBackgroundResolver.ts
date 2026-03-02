export const resolveBackgroundUrl = (
  nodeBackgroundUrl?: string,
  scenarioBackgroundUrl?: string,
): string | null => {
  const nodeUrl = nodeBackgroundUrl?.trim();
  if (nodeUrl) {
    return nodeUrl;
  }

  const scenarioUrl = scenarioBackgroundUrl?.trim();
  if (scenarioUrl) {
    return scenarioUrl;
  }

  return null;
};
