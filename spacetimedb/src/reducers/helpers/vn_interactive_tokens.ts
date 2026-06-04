import type { VnNode } from "./types";

const TOKEN_PATTERN = /\[(clue|fact|lead|item|actor):[^\]]+\]/gi;

const collectNodeText = (node: VnNode): string[] => {
  const chunks: string[] = [];
  if (node.body) {
    chunks.push(node.body);
  }
  if (node.title) {
    chunks.push(node.title);
  }
  for (const choice of node.choices ?? []) {
    if (choice.text) {
      chunks.push(choice.text);
    }
  }
  return chunks;
};

const parseBracketToken = (
  raw: string,
): { kind: string; payload: string } | null => {
  const match = /^\[(clue|fact|lead|item|actor):([^\]]+)\]$/i.exec(raw.trim());
  if (!match) {
    return null;
  }

  const kind = match[1].toLowerCase();
  const inner = match[2];
  const parts = inner.split(":");
  if (parts.length < 2) {
    return null;
  }

  const payload = parts.slice(1).join(":");
  return { kind, payload };
};

const parseFactPayload = (
  payload: string,
): { caseId: string; factId: string } | null => {
  const slashIndex = payload.indexOf("/");
  if (slashIndex <= 0 || slashIndex >= payload.length - 1) {
    return null;
  }

  return {
    caseId: payload.slice(0, slashIndex),
    factId: payload.slice(slashIndex + 1),
  };
};

const parseItemPayload = (
  payload: string,
): { itemId: string; quantity: number } | null => {
  const parts = payload.split(":");
  if (parts.length < 1 || parts[0].trim().length === 0) {
    return null;
  }

  const itemId = parts[0].trim();
  const quantity =
    parts.length >= 2 ? Number.parseInt(parts[parts.length - 1], 10) : 1;
  if (!Number.isFinite(quantity) || quantity < 1) {
    return { itemId, quantity: 1 };
  }

  return { itemId, quantity };
};

export const nodeContainsClueToken = (
  node: VnNode,
  evidenceId: string,
): boolean => {
  for (const chunk of collectNodeText(node)) {
    for (const match of chunk.matchAll(TOKEN_PATTERN)) {
      const parsed = parseBracketToken(match[0]);
      if (!parsed || parsed.kind !== "clue") {
        continue;
      }
      const payload = parsed.payload.trim();
      if (payload === evidenceId) {
        return true;
      }
      const tail = payload.split(":").pop()?.trim();
      if (tail === evidenceId) {
        return true;
      }
    }
  }
  return false;
};

export const nodeContainsFactToken = (
  node: VnNode,
  caseId: string,
  factId: string,
): boolean => {
  for (const chunk of collectNodeText(node)) {
    for (const match of chunk.matchAll(TOKEN_PATTERN)) {
      const parsed = parseBracketToken(match[0]);
      if (!parsed || (parsed.kind !== "fact" && parsed.kind !== "lead")) {
        continue;
      }
      const fact = parseFactPayload(parsed.payload);
      if (fact?.caseId === caseId && fact.factId === factId) {
        return true;
      }
    }
  }
  return false;
};

export const nodeContainsItemToken = (
  node: VnNode,
  itemId: string,
): boolean => {
  const haystack = collectNodeText(node).join("\n");
  return (
    haystack.includes(`:${itemId}:`) ||
    haystack.includes(`:${itemId}]`) ||
    haystack.includes(`[item:${itemId}`)
  );
};

export const nodeAuthorizesDiscoverFact = (
  node: VnNode,
  caseId: string,
  factId: string,
): boolean => {
  if (nodeContainsFactToken(node, caseId, factId)) {
    return true;
  }

  const inspectEffects = (
    effects:
      | Array<{ type?: string; caseId?: string; factId?: string }>
      | undefined,
  ) => {
    if (!effects) {
      return false;
    }
    return effects.some(
      (effect) =>
        effect.type === "discover_fact" &&
        effect.caseId === caseId &&
        effect.factId === factId,
    );
  };

  if (
    inspectEffects(
      node.onEnter as Array<{
        type?: string;
        caseId?: string;
        factId?: string;
      }>,
    )
  ) {
    return true;
  }

  for (const choice of node.choices ?? []) {
    if (
      inspectEffects(
        choice.effects as Array<{
          type?: string;
          caseId?: string;
          factId?: string;
        }>,
      )
    ) {
      return true;
    }
  }

  return false;
};
