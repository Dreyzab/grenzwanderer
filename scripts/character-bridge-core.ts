/**
 * Pure logic for the character bridge validator. Reconciles Obsidian
 * `char_*.md` design notes against the runtime character id namespaces
 * (socialCatalog, location cast, character assets) and surfaces drift.
 *
 * Kept free of filesystem/imports so the resolution + dedup logic can be
 * unit-tested. See `scripts/content-character-bridge.ts` for the runner.
 */

export type CharVault = "Detectiv" | "StoryDetective";

export interface CharNote {
  /** Frontmatter id (falls back to filename without extension). */
  fileId: string;
  vault: CharVault;
  /** Repo-relative path, for report links. */
  relativePath: string;
  runtimeCharacterId?: string;
  npcIdentity?: string;
  aliases: string[];
  tier?: string;
  /** H1 heading used as the human display name in the note. */
  displayName?: string;
  /**
   * Author opt-out: a background/archetype note intentionally without a runtime
   * contact. Suppresses the `unresolved-runtime-id` warning (reported as info).
   */
  designOnly?: boolean;
}

export interface RuntimeSocialNpc {
  id: string;
  displayName: string;
  rosterTier: string;
}

export interface RuntimeRegistries {
  socialNpcs: RuntimeSocialNpc[];
  locationCastIds: string[];
  /** True when a candidate id resolves to a portrait in characterAssets. */
  resolvesInAssets: (candidate: string) => boolean;
}

export type BridgeSeverity = "error" | "warn" | "info";

export type BridgeCategory =
  | "unresolved-runtime-id"
  | "name-drift"
  | "duplicate-runtime-id-same-vault"
  | "duplicate-runtime-id-cross-vault"
  | "duplicate-dossier-file"
  | "no-runtime-binding"
  | "design-only-archetype"
  | "missing-dossier";

export interface BridgeFinding {
  severity: BridgeSeverity;
  category: BridgeCategory;
  /** Char note path or runtime npc id the finding is about. */
  subject: string;
  detail: string;
}

export const normalizeCharacterId = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

/**
 * Mirrors the runtime speaker resolution: an id plus its `npc_`-stripped and
 * `npc_`-prefixed variants. This is why `bank_manager` and `npc_kessler_banker`
 * style ids can both land on the same runtime entity.
 */
export const candidateIds = (id: string): string[] => {
  const normalized = normalizeCharacterId(id);
  return Array.from(
    new Set([normalized, normalized.replace(/^npc_/, ""), `npc_${normalized}`]),
  );
};

export interface ResolutionResult {
  registry: "socialCatalog" | "locationCast" | "characterAssets" | null;
  socialNpc?: RuntimeSocialNpc;
}

export const resolveRuntimeCharacterId = (
  runtimeCharacterId: string,
  registries: RuntimeRegistries,
): ResolutionResult => {
  const cands = candidateIds(runtimeCharacterId);

  const socialByCandidate = new Map<string, RuntimeSocialNpc>();
  for (const npc of registries.socialNpcs) {
    for (const candidate of candidateIds(npc.id)) {
      socialByCandidate.set(candidate, npc);
    }
  }
  for (const candidate of cands) {
    const npc = socialByCandidate.get(candidate);
    if (npc) {
      return { registry: "socialCatalog", socialNpc: npc };
    }
  }

  const castCandidates = new Set(
    registries.locationCastIds.flatMap(candidateIds),
  );
  for (const candidate of cands) {
    if (castCandidates.has(candidate)) {
      return { registry: "locationCast" };
    }
  }

  for (const candidate of cands) {
    if (registries.resolvesInAssets(candidate)) {
      return { registry: "characterAssets" };
    }
  }

  return { registry: null };
};

export type CharNoteIdField = "npc_identity" | "runtime_character_id";

export interface NoteResolution {
  result: ResolutionResult;
  /** Which frontmatter field produced the match, if any. */
  field: CharNoteIdField | null;
}

/**
 * Resolves a note to a runtime entity. `npc_identity` (the explicit
 * socialCatalog contact link) takes precedence over `runtime_character_id`
 * (the VN speaker/role key), since the two are different axes and a note may
 * carry a non-resolving speaker key alongside a valid contact id.
 */
export const resolveNote = (
  note: CharNote,
  registries: RuntimeRegistries,
): NoteResolution => {
  if (note.npcIdentity) {
    const result = resolveRuntimeCharacterId(note.npcIdentity, registries);
    if (result.registry) {
      return { result, field: "npc_identity" };
    }
  }
  if (note.runtimeCharacterId) {
    const result = resolveRuntimeCharacterId(
      note.runtimeCharacterId,
      registries,
    );
    if (result.registry) {
      return { result, field: "runtime_character_id" };
    }
  }
  return { result: { registry: null }, field: null };
};

const namesMatch = (note: CharNote, displayName: string): boolean => {
  const needle = displayName.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  const haystack = [note.displayName, ...note.aliases]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toLowerCase());
  return haystack.some(
    (value) =>
      value === needle || value.includes(needle) || needle.includes(value),
  );
};

export const buildBridgeFindings = (
  notes: CharNote[],
  registries: RuntimeRegistries,
): BridgeFinding[] => {
  const findings: BridgeFinding[] = [];
  const resolvedSocialNpcIds = new Set<string>();

  // Per-note resolution, name drift, and missing-binding checks.
  for (const note of notes) {
    if (!note.runtimeCharacterId && !note.npcIdentity) {
      findings.push({
        severity: "info",
        category: "no-runtime-binding",
        subject: note.relativePath,
        detail: `Design/archetype note '${note.fileId}' has neither runtime_character_id nor npc_identity; cannot be bridged to runtime.`,
      });
      continue;
    }

    const idLabel = [
      note.npcIdentity ? `npc_identity '${note.npcIdentity}'` : null,
      note.runtimeCharacterId
        ? `runtime_character_id '${note.runtimeCharacterId}'`
        : null,
    ]
      .filter(Boolean)
      .join(" / ");

    const { result } = resolveNote(note, registries);

    if (!result.registry) {
      findings.push(
        note.designOnly
          ? {
              severity: "info",
              category: "design-only-archetype",
              subject: note.relativePath,
              detail: `${idLabel} is unresolved but the note is marked design_only (intentional background/archetype, no runtime contact).`,
            }
          : {
              severity: "warn",
              category: "unresolved-runtime-id",
              subject: note.relativePath,
              detail: `${idLabel} does not resolve to any runtime registry (socialCatalog / location cast / character assets).`,
            },
      );
      continue;
    }

    if (result.registry === "socialCatalog" && result.socialNpc) {
      resolvedSocialNpcIds.add(result.socialNpc.id);
      if (!namesMatch(note, result.socialNpc.displayName)) {
        findings.push({
          severity: "warn",
          category: "name-drift",
          subject: note.relativePath,
          detail: `${idLabel} -> ${result.socialNpc.id} (runtime name '${result.socialNpc.displayName}'), but the note names '${note.displayName ?? "?"}' / aliases [${note.aliases.join(", ")}].`,
        });
      }
    }
  }

  // Duplicate runtime_character_id groups.
  const notesByRuntimeId = new Map<string, CharNote[]>();
  for (const note of notes) {
    if (!note.runtimeCharacterId) {
      continue;
    }
    const key = normalizeCharacterId(note.runtimeCharacterId);
    const group = notesByRuntimeId.get(key) ?? [];
    group.push(note);
    notesByRuntimeId.set(key, group);
  }
  for (const [runtimeId, group] of notesByRuntimeId) {
    if (group.length < 2) {
      continue;
    }
    // Generic archetype ids intentionally shared by design-only notes are not drift.
    if (group.every((note) => note.designOnly)) {
      continue;
    }
    const vaults = new Set(group.map((note) => note.vault));
    const paths = group.map((note) => note.relativePath).join(", ");
    const sameVaultCollision = vaults.size < group.length;
    if (!sameVaultCollision) {
      // Detectiv (design) + StoryDetective (runtime) is the documented split,
      // not drift — informational only.
      findings.push({
        severity: "info",
        category: "duplicate-runtime-id-cross-vault",
        subject: runtimeId,
        detail: `runtime_character_id '${runtimeId}' has a design + runtime dossier across vaults (intended split): ${paths}.`,
      });
      continue;
    }

    // Same-vault collision: an error only when the id binds to a concrete
    // runtime contact (then portrait/trust would genuinely collide). Reusing a
    // generic/unresolved archetype id (e.g. "professor", "enforcer") is a warn.
    const resolution = resolveRuntimeCharacterId(
      group[0].runtimeCharacterId as string,
      registries,
    );
    const collidesWithContact = resolution.registry === "socialCatalog";
    findings.push({
      severity: collidesWithContact ? "error" : "warn",
      category: "duplicate-runtime-id-same-vault",
      subject: runtimeId,
      detail: collidesWithContact
        ? `runtime_character_id '${runtimeId}' resolves to runtime contact ${resolution.socialNpc?.id} but is claimed by ${group.length} distinct notes in one vault: ${paths}.`
        : `runtime_character_id '${runtimeId}' (${resolution.registry ?? "unresolved"} archetype) is reused by ${group.length} notes in one vault: ${paths}.`,
    });
  }

  // Duplicate dossier filenames across vaults.
  const notesByFileId = new Map<string, CharNote[]>();
  for (const note of notes) {
    const group = notesByFileId.get(note.fileId) ?? [];
    group.push(note);
    notesByFileId.set(note.fileId, group);
  }
  for (const [fileId, group] of notesByFileId) {
    const vaults = new Set(group.map((note) => note.vault));
    if (group.length > 1 && vaults.size > 1) {
      // Design + runtime copies across vaults are the intended split, not drift.
      findings.push({
        severity: "info",
        category: "duplicate-dossier-file",
        subject: fileId,
        detail: `Dossier '${fileId}' has copies across vaults (intended design/runtime split): ${group.map((note) => note.relativePath).join(", ")}.`,
      });
    }
  }

  // Coverage: major runtime NPCs with no dossier pointing at them.
  for (const npc of registries.socialNpcs) {
    if (npc.rosterTier !== "major") {
      continue;
    }
    if (!resolvedSocialNpcIds.has(npc.id)) {
      findings.push({
        severity: "info",
        category: "missing-dossier",
        subject: npc.id,
        detail: `Major runtime NPC ${npc.id} ('${npc.displayName}') has no char_*.md dossier bound via runtime_character_id.`,
      });
    }
  }

  return findings;
};

export const summarizeFindings = (
  findings: BridgeFinding[],
): Record<BridgeSeverity, number> => {
  const summary: Record<BridgeSeverity, number> = {
    error: 0,
    warn: 0,
    info: 0,
  };
  for (const finding of findings) {
    summary[finding.severity] += 1;
  }
  return summary;
};
