/**
 * Extracts player-facing dossier excerpts from Obsidian `char_*.md` notes and
 * merges them into the runtime social catalog's NPC bios.
 *
 * Spoiler policy: only a dedicated `## Player Dossier` section is shipped.
 * Design-side sections (Secrets, Evolution, Psyche Profile) stay in Obsidian
 * and are never sent to the client. Authors opt an entry into the journal with
 * an inline `(reveal: <flag>)` marker; unmarked entries show as soon as the NPC
 * is met (same gate as the bio summary).
 *
 * Syntax inside `## Player Dossier`:
 *   - (reveal: flag_x) **Heading**: text
 *   - **Heading**: text            (always shown once met)
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export interface DossierStage {
  revealFlag?: string;
  heading: string;
  text: string;
}

export interface DossierExcerpt {
  npcIdentity: string;
  stages: DossierStage[];
}

interface NpcIdentityLike {
  id: string;
  bio?: {
    summary: string;
    stages?: DossierStage[];
  };
}

const FRONTMATTER_RE = /^\uFEFF?---\n([\s\S]*?)\n---/;
const PLAYER_DOSSIER_RE = /^##\s+Player Dossier\s*$/m;
const BULLET_RE =
  /^-\s*(?:\(reveal:\s*([a-z0-9_]+)\)\s*)?\*\*(.+?)\*\*\s*[:—-]\s*(.+?)\s*$/i;

const scalarFrontmatterField = (
  frontmatter: string,
  key: string,
): string | undefined => {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : undefined;
};

/**
 * Parses the `## Player Dossier` section of a char note. Returns null when the
 * note has no `npc_identity` (cannot be bridged) or no Player Dossier section.
 */
export const parsePlayerDossier = (markdown: string): DossierExcerpt | null => {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const frontmatter = normalized.match(FRONTMATTER_RE);
  if (!frontmatter) {
    return null;
  }
  const npcIdentity = scalarFrontmatterField(frontmatter[1], "npc_identity");
  if (!npcIdentity) {
    return null;
  }

  const sectionStart = normalized.search(PLAYER_DOSSIER_RE);
  if (sectionStart === -1) {
    return null;
  }

  // Slice from the heading to the next `## ` heading (or end of file).
  const afterHeading = normalized
    .slice(sectionStart)
    .replace(PLAYER_DOSSIER_RE, "");
  const nextHeading = afterHeading.search(/^##\s+/m);
  const section =
    nextHeading === -1 ? afterHeading : afterHeading.slice(0, nextHeading);

  const stages: DossierStage[] = [];
  for (const line of section.split("\n")) {
    const match = line.match(BULLET_RE);
    if (!match) {
      continue;
    }
    const [, revealFlag, heading, text] = match;
    stages.push({
      ...(revealFlag ? { revealFlag } : {}),
      heading: heading.trim(),
      text: text.trim(),
    });
  }

  return stages.length > 0 ? { npcIdentity, stages } : null;
};

/**
 * Appends dossier stages onto the matching NPC bios. Only enriches NPCs that
 * already carry a bio summary (the catalog owns the always-visible tagline);
 * dedupes by heading so a re-run is idempotent. Returns a new array.
 */
export const applyDossierExcerpts = <T extends NpcIdentityLike>(
  npcIdentities: T[],
  excerpts: DossierExcerpt[],
): T[] => {
  const excerptById = new Map(
    excerpts.map((excerpt) => [excerpt.npcIdentity, excerpt]),
  );

  return npcIdentities.map((identity) => {
    const excerpt = excerptById.get(identity.id);
    if (!excerpt || !identity.bio) {
      return identity;
    }

    const existingStages = identity.bio.stages ?? [];
    const seenHeadings = new Set(
      existingStages.map((stage) => stage.heading.toLowerCase()),
    );
    const merged = [...existingStages];
    for (const stage of excerpt.stages) {
      if (seenHeadings.has(stage.heading.toLowerCase())) {
        continue;
      }
      seenHeadings.add(stage.heading.toLowerCase());
      merged.push(stage);
    }

    return { ...identity, bio: { ...identity.bio, stages: merged } };
  });
};

const walkCharNoteFiles = (directory: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) {
      continue;
    }
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkCharNoteFiles(absolutePath));
      continue;
    }
    if (
      entry.isFile() &&
      entry.name.startsWith("char_") &&
      entry.name.endsWith(".md") &&
      !/\.[a-z]{2}\.md$/.test(entry.name)
    ) {
      files.push(absolutePath);
    }
  }
  return files;
};

/** Walks the given vault roots and collects every Player Dossier excerpt. */
export const collectDossierExcerpts = (roots: string[]): DossierExcerpt[] => {
  const byNpcId = new Map<string, DossierExcerpt>();
  for (const root of roots) {
    for (const filePath of walkCharNoteFiles(root)) {
      const excerpt = parsePlayerDossier(readFileSync(filePath, "utf8"));
      if (!excerpt) {
        continue;
      }
      const existing = byNpcId.get(excerpt.npcIdentity);
      if (existing) {
        existing.stages.push(...excerpt.stages);
      } else {
        byNpcId.set(excerpt.npcIdentity, { ...excerpt });
      }
    }
  }
  return [...byNpcId.values()];
};
