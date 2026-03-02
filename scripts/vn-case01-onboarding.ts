import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import type { VnChoice, VnEffect } from "../src/features/vn/types";

const ONBOARDING_RELATIVE_ROOT = "40_GameViewer/Case01/Plot/01_Onboarding";
const CASE01_SCENARIO_ID = "sandbox_case01_pilot";
const CASE01_START_NODE_ID = "scene_intro_journey";
const CASE01_HANDOFF_NODE_ID = "scene_case01_onboarding_handoff";

const RUNTIME_NODE_TYPES = new Set([
  "vn_scene",
  "vn_choice",
  "vn_action",
  "map_hub",
]);
const SUPPORTED_NON_RUNTIME_TYPES = new Set([
  "vn_beat",
  "vn_background",
  "vn_checks",
  "vn_structure",
  "scene",
]);

type RuntimeNodeType = "vn_scene" | "vn_choice" | "vn_action" | "map_hub";

export type Case01ScenarioBlueprint = {
  id: string;
  title: string;
  startNodeId: string;
  nodeIds: string[];
  mode?: "overlay" | "fullscreen";
  packId?: string;
};

export type Case01NodeBlueprint = {
  id: string;
  scenarioId: string;
  sourcePath: string;
  choices: VnChoice[];
  terminal?: boolean;
  onEnter?: VnEffect[];
  titleOverride?: string;
  bodyOverride?: string;
};

export type Case01ParserDiagnostic = {
  code: string;
  message: string;
  relativePath: string;
  line: number;
  severity: "error" | "warning";
};

export type ParseCase01OnboardingResult = {
  scenarioBlueprint: Case01ScenarioBlueprint;
  nodeBlueprints: Case01NodeBlueprint[];
  diagnostics: Case01ParserDiagnostic[];
};

type ParsedDoc = {
  id: string;
  type: string;
  parentId?: string;
  order?: number;
  relativePath: string;
  markdownBody: string;
  contentStartLine: number;
};

type ParsedChoiceDraft = {
  text: string;
  nextRaw: string;
  effects: VnEffect[];
  line: number;
};

class Case01ParserError extends Error {
  readonly diagnostic: Case01ParserDiagnostic;

  constructor(diagnostic: Case01ParserDiagnostic) {
    super(
      `${diagnostic.relativePath}:${diagnostic.line} [${diagnostic.code}] ${diagnostic.message}`,
    );
    this.diagnostic = diagnostic;
  }
}

const stripBomAndNormalize = (value: string): string =>
  value.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

const parseFrontmatter = (
  rawMarkdown: string,
  relativePath: string,
): { data: Record<string, string>; body: string; contentStartLine: number } => {
  const match = rawMarkdown.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    throw new Case01ParserError({
      code: "MISSING_FRONTMATTER",
      message: "Missing YAML frontmatter block",
      relativePath,
      line: 1,
      severity: "error",
    });
  }

  const data: Record<string, string> = {};
  const frontmatterLines = match[1].split("\n");
  for (const line of frontmatterLines) {
    const keyValue = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!keyValue) {
      continue;
    }
    data[keyValue[1]] = keyValue[2].trim();
  }

  const body = rawMarkdown.slice(match[0].length);
  const contentStartLine = match[0].split("\n").length - 1;

  return { data, body, contentStartLine };
};

const normalizeWikiTarget = (rawTarget: string): string => {
  const cleaned = rawTarget.trim();
  const beforeAlias = cleaned.split("|")[0]?.trim() ?? cleaned;
  const tail = beforeAlias.split("/").at(-1)?.trim() ?? beforeAlias;
  return tail;
};

const findSection = (
  markdownBody: string,
  sectionName: string,
): { content: string; line: number } | null => {
  const lines = markdownBody.split("\n");
  const headerPattern = new RegExp(`^##\\s+${sectionName}\\s*$`, "i");
  const sectionStart = lines.findIndex((line) =>
    headerPattern.test(line.trim()),
  );
  if (sectionStart < 0) {
    return null;
  }

  let sectionEnd = lines.length;
  for (let index = sectionStart + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index].trim())) {
      sectionEnd = index;
      break;
    }
  }

  return {
    content: lines
      .slice(sectionStart + 1, sectionEnd)
      .join("\n")
      .trim(),
    line: sectionStart + 1,
  };
};

const extractFirstHeading = (
  markdownBody: string,
  fallbackId: string,
): string => {
  const titleMatch = markdownBody.match(/^#\s+(.+)$/m);
  if (!titleMatch) {
    return fallbackId;
  }

  const title = titleMatch[1].trim();
  return title.length > 0 ? title : fallbackId;
};

const stripMarkdownInlineStyling = (value: string): string =>
  value
    .replace(/^\*\*(.+)\*\*$/, "$1")
    .replace(/^"(.*)"$/, "$1")
    .trim();

const convertWikiLinksToNarrativeText = (value: string): string =>
  value.replace(/\[\[([^\]]+)\]\]/g, (_match, linkBody: string) => {
    const [targetRaw, aliasRaw] = linkBody.split("|");
    const target = normalizeWikiTarget(targetRaw);
    const alias = aliasRaw?.trim();
    const displayText = alias && alias.length > 0 ? alias : target;

    if (target.startsWith("ev_")) {
      const normalizedText = displayText.replace(/[[\]:]/g, "").trim();
      return `[clue:${normalizedText || target}:${target}]`;
    }

    return displayText;
  });

const parseChoicesSection = (doc: ParsedDoc): ParsedChoiceDraft[] => {
  const section = findSection(doc.markdownBody, "Choices");
  if (!section) {
    return [];
  }

  const sectionLines = section.content.split("\n");
  const choices: ParsedChoiceDraft[] = [];
  let currentChoice: ParsedChoiceDraft | null = null;

  const pushCurrentChoice = () => {
    if (!currentChoice) {
      return;
    }
    if (!currentChoice.nextRaw) {
      throw new Case01ParserError({
        code: "CHOICE_MISSING_NEXT",
        message: "Choice is missing required '- Next: [[node_id]]' line",
        relativePath: doc.relativePath,
        line: currentChoice.line,
        severity: "error",
      });
    }
    choices.push(currentChoice);
    currentChoice = null;
  };

  for (let index = 0; index < sectionLines.length; index += 1) {
    const rawLine = sectionLines[index];
    const trimmed = rawLine.trim();
    const absoluteLine = doc.contentStartLine + section.line + index + 1;

    const choiceHeader = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (choiceHeader) {
      pushCurrentChoice();
      currentChoice = {
        text: stripMarkdownInlineStyling(choiceHeader[2]),
        nextRaw: "",
        effects: [],
        line: absoluteLine,
      };
      continue;
    }

    if (trimmed.length === 0) {
      continue;
    }

    if (!currentChoice) {
      throw new Case01ParserError({
        code: "INVALID_CHOICE_FORMAT",
        message: "Choices section must start each choice with '1. Choice text'",
        relativePath: doc.relativePath,
        line: absoluteLine,
        severity: "error",
      });
    }

    const nextMatch = trimmed.match(/^-+\s*Next:\s*\[\[([^\]]+)\]\]\s*$/i);
    if (nextMatch) {
      currentChoice.nextRaw = normalizeWikiTarget(nextMatch[1]);
      continue;
    }

    const setFlagMatch = trimmed.match(
      /^-+\s*Sets\s+`([a-z0-9_]+)`\s*=\s*true\s*$/i,
    );
    if (setFlagMatch) {
      currentChoice.effects.push({
        type: "set_flag",
        key: setFlagMatch[1],
        value: true,
      });
      continue;
    }

    const unlockMatch = trimmed.match(/^-+\s*Unlocks\s+\[\[([^\]]+)\]\]\s*$/i);
    if (unlockMatch) {
      currentChoice.effects.push({
        type: "unlock_group",
        groupId: normalizeWikiTarget(unlockMatch[1]),
      });
      continue;
    }

    if (/^-+\s*Sets\b/i.test(trimmed) || /^-+\s*Unlocks\b/i.test(trimmed)) {
      throw new Case01ParserError({
        code: "INVALID_EFFECT_SYNTAX",
        message:
          "Supported effect syntax is '- Sets `flag_name` = true' or '- Unlocks [[loc_id]]'",
        relativePath: doc.relativePath,
        line: absoluteLine,
        severity: "error",
      });
    }

    throw new Case01ParserError({
      code: "UNSUPPORTED_CHOICE_LINE",
      message: `Unsupported line in Choices section: ${trimmed}`,
      relativePath: doc.relativePath,
      line: absoluteLine,
      severity: "error",
    });
  }

  pushCurrentChoice();

  return choices;
};

const extractFallbackNarrativeBody = (doc: ParsedDoc): string => {
  const preferredSections = ["Narrative", "Context", "Prompt"];
  for (const sectionName of preferredSections) {
    const section = findSection(doc.markdownBody, sectionName);
    if (section?.content) {
      const normalized = convertWikiLinksToNarrativeText(
        section.content,
      ).trim();
      if (normalized.length > 0) {
        return normalized;
      }
    }
  }

  const lines = doc.markdownBody
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  const fallback = convertWikiLinksToNarrativeText(lines.join(" ").trim());
  return fallback;
};

const extractSceneBodyFromBeats = (
  sceneDoc: ParsedDoc,
  beatDocsById: Map<string, ParsedDoc>,
): string | null => {
  const linkedBeatIds = Array.from(
    sceneDoc.markdownBody.matchAll(/\[\[([^\]]+)\]\]/g),
  )
    .map((match) => normalizeWikiTarget(match[1]))
    .filter((candidateId) => {
      const beatDoc = beatDocsById.get(candidateId);
      return beatDoc?.parentId === sceneDoc.id;
    });

  const childBeatDocs = Array.from(beatDocsById.values()).filter(
    (beatDoc) => beatDoc.parentId === sceneDoc.id,
  );

  const mergedBeatDocs = new Map<string, ParsedDoc>();
  for (const beatDoc of childBeatDocs) {
    mergedBeatDocs.set(beatDoc.id, beatDoc);
  }
  for (const linkedBeatId of linkedBeatIds) {
    const beatDoc = beatDocsById.get(linkedBeatId);
    if (beatDoc) {
      mergedBeatDocs.set(beatDoc.id, beatDoc);
    }
  }

  if (mergedBeatDocs.size === 0) {
    return null;
  }

  const orderedBeatDocs = Array.from(mergedBeatDocs.values()).sort(
    (left, right) => {
      const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER;
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }
      return left.relativePath.localeCompare(right.relativePath);
    },
  );

  const segments: string[] = [];
  for (const beatDoc of orderedBeatDocs) {
    const scriptSection = findSection(beatDoc.markdownBody, "VN Script");
    if (!scriptSection || scriptSection.content.length === 0) {
      throw new Case01ParserError({
        code: "MISSING_BEAT_SCRIPT",
        message:
          "Beat linked to a runtime scene must contain non-empty '## VN Script' section",
        relativePath: beatDoc.relativePath,
        line: scriptSection?.line
          ? beatDoc.contentStartLine + scriptSection.line
          : beatDoc.contentStartLine + 1,
        severity: "error",
      });
    }

    const normalizedScript = convertWikiLinksToNarrativeText(
      scriptSection.content
        .split("\n")
        .filter((line) => line.trim() !== "---")
        .join("\n")
        .trim(),
    );
    if (normalizedScript.length > 0) {
      segments.push(normalizedScript);
    }
  }

  if (segments.length === 0) {
    return null;
  }

  return segments.join("\n\n");
};

const toDeterministicChoiceId = (nodeId: string, index: number): string => {
  const normalizedNodeId = nodeId.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  const suffix = String(index + 1).padStart(2, "0");
  return `CASE01_${normalizedNodeId}_${suffix}`;
};

const toScenarioChoiceType = (
  nodeType: RuntimeNodeType,
): VnChoice["choiceType"] => {
  if (nodeType === "vn_action") {
    return "inquiry";
  }
  if (nodeType === "vn_choice") {
    return "action";
  }
  if (nodeType === "map_hub") {
    return "action";
  }
  return "action";
};

const parseOnboardingDocs = (storyRoot: string): ParsedDoc[] => {
  const onboardingDir = path.join(storyRoot, ONBOARDING_RELATIVE_ROOT);
  const markdownFiles = readdirSync(onboardingDir)
    .filter((entry) => entry.endsWith(".md"))
    .sort((left, right) => left.localeCompare(right));

  const docs: ParsedDoc[] = [];
  for (const fileName of markdownFiles) {
    const relativePath = `${ONBOARDING_RELATIVE_ROOT}/${fileName}`;
    const absolutePath = path.join(onboardingDir, fileName);
    const raw = stripBomAndNormalize(readFileSync(absolutePath, "utf8"));
    const { data, body, contentStartLine } = parseFrontmatter(
      raw,
      relativePath,
    );

    const id = data.id?.trim();
    if (!id) {
      throw new Case01ParserError({
        code: "MISSING_ID",
        message: "Frontmatter must include non-empty 'id'",
        relativePath,
        line: 1,
        severity: "error",
      });
    }

    const type = data.type?.trim();
    if (!type) {
      throw new Case01ParserError({
        code: "MISSING_TYPE",
        message: "Frontmatter must include non-empty 'type'",
        relativePath,
        line: 1,
        severity: "error",
      });
    }

    const isRuntime = RUNTIME_NODE_TYPES.has(type);
    const isSupportedNonRuntime = SUPPORTED_NON_RUNTIME_TYPES.has(type);
    if (!isRuntime && !isSupportedNonRuntime && type.startsWith("vn_")) {
      throw new Case01ParserError({
        code: "UNKNOWN_RUNTIME_TYPE",
        message: `Unsupported runtime-adjacent type: ${type}`,
        relativePath,
        line: 1,
        severity: "error",
      });
    }

    const order = data.order ? Number(data.order) : undefined;
    docs.push({
      id,
      type,
      parentId: data.parent?.trim() || undefined,
      order: Number.isFinite(order) ? order : undefined,
      relativePath,
      markdownBody: body,
      contentStartLine,
    });
  }

  return docs;
};

export const parseCase01Onboarding = (
  storyRoot: string,
): ParseCase01OnboardingResult => {
  const diagnostics: Case01ParserDiagnostic[] = [];

  try {
    const docs = parseOnboardingDocs(storyRoot);
    const docById = new Map<string, ParsedDoc>();
    for (const doc of docs) {
      if (docById.has(doc.id)) {
        throw new Case01ParserError({
          code: "DUPLICATE_NODE_ID",
          message: `Duplicate node id detected: ${doc.id}`,
          relativePath: doc.relativePath,
          line: 1,
          severity: "error",
        });
      }
      docById.set(doc.id, doc);
    }

    const runtimeDocs = docs.filter(
      (doc): doc is ParsedDoc & { type: RuntimeNodeType } =>
        RUNTIME_NODE_TYPES.has(doc.type),
    );
    const beatDocsById = new Map<string, ParsedDoc>(
      docs.filter((doc) => doc.type === "vn_beat").map((doc) => [doc.id, doc]),
    );

    const runtimeIds = new Set(runtimeDocs.map((doc) => doc.id));
    const nodeBlueprintsRaw: Case01NodeBlueprint[] = [];
    const choiceIds = new Set<string>();

    for (const runtimeDoc of runtimeDocs) {
      const choicesDraft = parseChoicesSection(runtimeDoc);
      if (
        (runtimeDoc.type === "vn_choice" ||
          runtimeDoc.type === "vn_action" ||
          runtimeDoc.type === "map_hub") &&
        choicesDraft.length === 0
      ) {
        throw new Case01ParserError({
          code: "CHOICES_REQUIRED",
          message: `Node type '${runtimeDoc.type}' must contain non-empty '## Choices' section`,
          relativePath: runtimeDoc.relativePath,
          line: runtimeDoc.contentStartLine + 1,
          severity: "error",
        });
      }

      const compiledChoices: VnChoice[] = choicesDraft.map((draft, index) => {
        const choiceId = toDeterministicChoiceId(runtimeDoc.id, index);
        if (choiceIds.has(choiceId)) {
          throw new Case01ParserError({
            code: "DUPLICATE_CHOICE_ID",
            message: `Duplicate generated choice id: ${choiceId}`,
            relativePath: runtimeDoc.relativePath,
            line: draft.line,
            severity: "error",
          });
        }
        choiceIds.add(choiceId);

        const inScopeNextNodeId = runtimeIds.has(draft.nextRaw)
          ? draft.nextRaw
          : CASE01_HANDOFF_NODE_ID;
        if (inScopeNextNodeId === CASE01_HANDOFF_NODE_ID) {
          diagnostics.push({
            code: "OUT_OF_SCOPE_NEXT",
            message: `Choice target '${draft.nextRaw}' is out of onboarding scope and was redirected to ${CASE01_HANDOFF_NODE_ID}`,
            relativePath: runtimeDoc.relativePath,
            line: draft.line,
            severity: "warning",
          });
        }

        const choiceType = toScenarioChoiceType(runtimeDoc.type);
        return {
          id: choiceId,
          text: draft.text,
          nextNodeId: inScopeNextNodeId,
          effects: draft.effects.length > 0 ? draft.effects : undefined,
          choiceType,
        };
      });

      const title = extractFirstHeading(runtimeDoc.markdownBody, runtimeDoc.id);
      const sceneBody =
        runtimeDoc.type === "vn_scene"
          ? extractSceneBodyFromBeats(runtimeDoc, beatDocsById)
          : null;
      const body = (
        sceneBody ?? extractFallbackNarrativeBody(runtimeDoc)
      ).trim();

      if (body.length === 0) {
        throw new Case01ParserError({
          code: "EMPTY_NODE_BODY",
          message: "Node body resolved to empty text",
          relativePath: runtimeDoc.relativePath,
          line: runtimeDoc.contentStartLine + 1,
          severity: "error",
        });
      }

      nodeBlueprintsRaw.push({
        id: runtimeDoc.id,
        scenarioId: CASE01_SCENARIO_ID,
        sourcePath: runtimeDoc.relativePath,
        choices: compiledChoices,
        titleOverride: title,
        bodyOverride: body,
      });
    }

    nodeBlueprintsRaw.push({
      id: CASE01_HANDOFF_NODE_ID,
      scenarioId: CASE01_SCENARIO_ID,
      sourcePath: `${ONBOARDING_RELATIVE_ROOT}/scene_intro_journey.md`,
      terminal: true,
      choices: [],
      onEnter: [
        { type: "set_flag", key: "case01_onboarding_complete", value: true },
      ],
      titleOverride: "Case01 Onboarding Handoff",
      bodyOverride:
        "Onboarding pilot is complete. Continue into the next Case01 phase.",
    });

    const nodeById = new Map(nodeBlueprintsRaw.map((node) => [node.id, node]));
    const startNode = nodeById.get(CASE01_START_NODE_ID);
    if (!startNode) {
      throw new Case01ParserError({
        code: "MISSING_START_NODE",
        message: `Configured start node '${CASE01_START_NODE_ID}' was not found`,
        relativePath: `${ONBOARDING_RELATIVE_ROOT}/scene_intro_journey.md`,
        line: 1,
        severity: "error",
      });
    }

    const queue: string[] = [startNode.id];
    const reachable = new Set<string>();
    const reachableOrder: string[] = [];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (reachable.has(currentId)) {
        continue;
      }
      reachable.add(currentId);
      reachableOrder.push(currentId);
      const currentNode = nodeById.get(currentId);
      if (!currentNode) {
        continue;
      }
      for (const choice of currentNode.choices) {
        if (!reachable.has(choice.nextNodeId)) {
          queue.push(choice.nextNodeId);
        }
      }
    }

    if (!reachable.has(CASE01_HANDOFF_NODE_ID)) {
      reachable.add(CASE01_HANDOFF_NODE_ID);
      reachableOrder.push(CASE01_HANDOFF_NODE_ID);
    }

    for (const node of nodeBlueprintsRaw) {
      if (!reachable.has(node.id)) {
        diagnostics.push({
          code: "UNREACHABLE_NODE",
          message: `Node '${node.id}' is outside reachable onboarding graph and was omitted`,
          relativePath: node.sourcePath,
          line: 1,
          severity: "warning",
        });
      }
    }

    const nodeBlueprints = reachableOrder
      .map((nodeId) => nodeById.get(nodeId))
      .filter((node): node is Case01NodeBlueprint => Boolean(node));

    const scenarioBlueprint: Case01ScenarioBlueprint = {
      id: CASE01_SCENARIO_ID,
      title: "Case 01: Onboarding Pilot",
      startNodeId: CASE01_START_NODE_ID,
      nodeIds: nodeBlueprints.map((node) => node.id),
      mode: "fullscreen",
      packId: "case01_onboarding",
    };

    return {
      scenarioBlueprint,
      nodeBlueprints,
      diagnostics,
    };
  } catch (error) {
    if (error instanceof Case01ParserError) {
      throw error;
    }
    throw new Error(`Case01 parser failed: ${String(error)}`);
  }
};
