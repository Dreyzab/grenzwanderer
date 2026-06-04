export interface OpenVikingContextEnrichResponse {
  insights?: string;
  fieldNotes?: string;
}

const OPENVIKING_BASE_URL = "http://127.0.0.1:1933";
// Retrieval-only adapter: /api/v1/search/find computes a Gemini embedding, so
// the budget is higher than the old enrich stub. Still fully fail-soft.
const OPENVIKING_RETRIEVAL_TIMEOUT_MS = 2500;
const OPENVIKING_MATCH_LIMIT = 3;
const OPENVIKING_PREVIEW_MAX = 240;

export const isOpenVikingDevEnabled = (): boolean => {
  try {
    return (
      typeof window !== "undefined" &&
      window.localStorage.getItem("ENABLE_OPENVIKING_DEV") === "true"
    );
  } catch {
    return false;
  }
};

interface OpenVikingFindMatch {
  uri?: string;
  score?: number;
  category?: string;
  abstract?: string;
  overview?: string;
  content?: string;
  text?: string;
  summary?: string;
  snippet?: string;
}

const pickPreview = (item: OpenVikingFindMatch): string => {
  const candidates = [
    item.abstract,
    item.overview,
    item.content,
    item.text,
    item.summary,
    item.snippet,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      const normalized = candidate.replace(/\s+/g, " ").trim();
      return normalized.length > OPENVIKING_PREVIEW_MAX
        ? `${normalized.slice(0, OPENVIKING_PREVIEW_MAX - 3)}...`
        : normalized;
    }
  }
  return "";
};

// Synthesize a Field Note from the strongest retrieval matches. Mirrors the
// preview heuristics used by the MCP bridge so dev flavour stays consistent.
const synthesizeReflection = (
  matches: OpenVikingFindMatch[],
): OpenVikingContextEnrichResponse | null => {
  const ranked = matches
    .filter(
      (match): match is OpenVikingFindMatch =>
        !!match && typeof match === "object",
    )
    .slice(0, OPENVIKING_MATCH_LIMIT);
  if (ranked.length === 0) {
    return null;
  }

  const preview = pickPreview(ranked[0]);
  if (!preview) {
    return null;
  }

  const sources = ranked
    .map((match) =>
      typeof match.uri === "string"
        ? match.uri.replace(/^viking:\/\/resources\//, "")
        : null,
    )
    .filter((uri): uri is string => !!uri);

  return {
    insights: `Field Note: ${preview}`,
    ...(sources.length
      ? { fieldNotes: `Indexed sources: ${sources.join(", ")}` }
      : {}),
  };
};

export const fetchOpenVikingFlavor = async (
  locationId: string | undefined,
  archetypeId: string,
): Promise<OpenVikingContextEnrichResponse | null> => {
  if (!isOpenVikingDevEnabled()) {
    return null;
  }

  const query = [archetypeId, locationId].filter(Boolean).join(" ").trim();
  if (!query) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    OPENVIKING_RETRIEVAL_TIMEOUT_MS,
  );

  try {
    const response = await fetch(`${OPENVIKING_BASE_URL}/api/v1/search/find`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit: OPENVIKING_MATCH_LIMIT,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      result?: { resources?: OpenVikingFindMatch[] };
    };
    const resources = payload?.result?.resources;
    if (!Array.isArray(resources)) {
      return null;
    }

    return synthesizeReflection(resources);
  } catch {
    // Silent fail-soft for timeout, CORS limits, offline server, or bad JSON.
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const getProceduralDossierFallbackReflection = (
  eventName: string,
  archetypeId: string,
  stateNamespace: string,
  nodeId?: string,
): string => {
  const nodePart = nodeId ? ` at location point [${nodeId}]` : "";
  return `Field Note: Procedural case dossier successfully compiled${nodePart}. Trigger source event: "${eventName}". Running isolation namespace: "${stateNamespace}". Investigation active. Note that this case is running on procedural state overlay and does not mutate permanent canonical records.`;
};
