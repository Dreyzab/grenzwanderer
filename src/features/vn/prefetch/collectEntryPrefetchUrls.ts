import {
  originProfiles,
  type OriginProfileDefinition,
} from "../../character/originProfiles";
import { getNodeById, getScenarioById } from "../vnContent";
import type { VnSnapshot } from "../types";

export interface CollectScenarioVisualUrlsOptions {
  /** Max nodes to traverse (excluding already visited). Default 15. */
  maxNodes?: number;
  /** Max distinct choice targets to enqueue per node; default unlimited. */
  breadthPerNode?: number;
}

const pushVisualUrls = (
  node: NonNullable<ReturnType<typeof getNodeById>>,
  seenUrls: Set<string>,
  orderedUrls: string[],
): void => {
  for (const url of [
    node.backgroundUrl,
    node.backgroundVideoPosterUrl,
    ...(node.visualSequence?.frames.map((frame) => frame.imageUrl) ?? []),
  ] as string[]) {
    const trimmed = url?.trim();
    if (!trimmed || seenUrls.has(trimmed)) {
      continue;
    }
    seenUrls.add(trimmed);
    orderedUrls.push(trimmed);
  }
};

/** BFS scenario-local nodes; collects background + video poster URLs in visit order. */
export function collectScenarioVisualUrls(
  snapshot: VnSnapshot,
  scenarioId: string,
  options?: CollectScenarioVisualUrlsOptions,
): string[] {
  const scenario = getScenarioById(snapshot, scenarioId);
  if (!scenario) {
    return [];
  }

  const maxNodes = options?.maxNodes ?? 15;
  const breadthCap = options?.breadthPerNode;

  const orderedUrls: string[] = [];
  const seenUrls = new Set<string>();
  const visitedNodes = new Set<string>();
  const queue: string[] = [scenario.startNodeId];

  while (queue.length > 0 && visitedNodes.size < maxNodes) {
    const id = queue.shift();
    if (!id || visitedNodes.has(id)) {
      continue;
    }

    const node = getNodeById(snapshot, id);
    if (!node || node.scenarioId !== scenarioId) {
      continue;
    }

    visitedNodes.add(id);
    pushVisualUrls(node, seenUrls, orderedUrls);

    const choices = [...node.choices].sort((a, b) => a.id.localeCompare(b.id));
    const nextIds: string[] = [];
    const seenNext = new Set<string>();
    for (const choice of choices) {
      const next = choice.nextNodeId?.trim();
      if (!next || seenNext.has(next)) {
        continue;
      }
      seenNext.add(next);
      nextIds.push(next);
      if (breadthCap != null && nextIds.length >= breadthCap) {
        break;
      }
    }
    queue.push(...nextIds);
  }

  return orderedUrls;
}

export interface CollectOriginDossierUrlsOptions {
  /** If set, only this origin profile contributes URLs (e.g. `detective` / Elias). */
  onlyProfileId?: OriginProfileDefinition["id"];
}

export function collectOriginDossierUrls(
  options?: CollectOriginDossierUrlsOptions,
): string[] {
  const profiles =
    options?.onlyProfileId != null
      ? originProfiles.filter((p) => p.id === options.onlyProfileId)
      : originProfiles;

  const seen = new Set<string>();
  const out: string[] = [];

  for (const profile of profiles) {
    const url = profile.dossier.avatarUrl?.trim();
    if (url && !seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }

  return out;
}
