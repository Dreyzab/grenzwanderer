export interface OpenVikingContextEnrichResponse {
  insights?: string;
  fieldNotes?: string;
}

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

export const fetchOpenVikingFlavor = async (
  locationId: string | undefined,
  archetypeId: string,
): Promise<OpenVikingContextEnrichResponse | null> => {
  if (!isOpenVikingDevEnabled()) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 500);

  try {
    const response = await fetch(`http://127.0.0.1:1933/api/context/enrich`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locationId,
        archetypeId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as OpenVikingContextEnrichResponse;
  } catch (err) {
    clearTimeout(timeoutId);
    // Silent fail-soft for production, CORS limitations, or offline OpenViking server.
    return null;
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
