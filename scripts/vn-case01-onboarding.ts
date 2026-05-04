import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import type {
  VnChoice,
  VnCondition,
  VnEffect,
  VnSkillCheck,
} from "../src/features/vn/types";
import {
  CONDITION_OPERATORS,
  EFFECT_OPERATORS,
  FLAG_KEYS,
  SKILL_VOICE_IDS,
  VAR_KEYS,
  suggestClosest,
} from "./content-vocabulary";
import {
  case01OnboardingRelativeRoot,
  validateCase01OnboardingRoot,
} from "./content-authoring-contract";

const ONBOARDING_RELATIVE_ROOT = case01OnboardingRelativeRoot;
const CASE01_SCENARIO_ID = "sandbox_case01_pilot";
const CASE01_START_NODE_ID = "scene_start_game";
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
  preconditions?: VnCondition[];
  passiveChecks?: VnSkillCheck[];
  titleOverride?: string;
  bodyOverride?: string;
};

export type Case01ParserDiagnostic = {
  code: string;
  message: string;
  relativePath: string;
  line: number;
  column: number;
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
  visibleIfAll: VnCondition[];
  visibleIfAny: VnCondition[];
  requireAll: VnCondition[];
  requireAny: VnCondition[];
  skillCheck?: VnSkillCheck;
  line: number;
  column: number;
};

type ParsedPassiveCheckDraft = {
  id: string;
  voiceId: string;
  difficulty: number;
  onSuccess?: { effects?: VnEffect[]; nextNodeId?: string };
  onFail?: { effects?: VnEffect[]; nextNodeId?: string };
};

class Case01ParserError extends Error {
  readonly diagnostic: Case01ParserDiagnostic;

  constructor(diagnostic: Case01ParserDiagnostic) {
    super(
      `${diagnostic.relativePath}:${diagnostic.line}:${diagnostic.column} [${diagnostic.code}] ${diagnostic.message}`,
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
      column: 1,
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

const makeParserError = (
  doc: ParsedDoc,
  line: number,
  column: number,
  code: string,
  message: string,
): Case01ParserError =>
  new Case01ParserError({
    code,
    message,
    relativePath: doc.relativePath,
    line,
    column,
    severity: "error",
  });

const parseDirective = (
  trimmed: string,
): { name: string; value: string } | null => {
  const match = trimmed.match(/^-+\s*([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(.+)$/);
  if (!match) {
    return null;
  }
  return {
    name: match[1].trim().toLowerCase(),
    value: match[2].trim(),
  };
};

const splitArgs = (value: string): string[] =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const parseBooleanToken = (
  value: string,
  doc: ParsedDoc,
  line: number,
  column: number,
  context: string,
): boolean => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }
  throw makeParserError(
    doc,
    line,
    column,
    "INVALID_BOOLEAN",
    `${context} expects boolean true|false, received '${value}'`,
  );
};

const parseNumberToken = (
  value: string,
  doc: ParsedDoc,
  line: number,
  column: number,
  context: string,
): number => {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed)) {
    throw makeParserError(
      doc,
      line,
      column,
      "INVALID_NUMBER",
      `${context} expects a numeric value, received '${value}'`,
    );
  }
  return parsed;
};

const parseFunctionCall = (
  raw: string,
  doc: ParsedDoc,
  line: number,
  column: number,
  kind: "condition" | "effect",
): { operator: string; args: string[] } => {
  const match = raw
    .trim()
    .match(/^([a-zA-Z][a-zA-Z0-9_]*)\s*\(\s*(.*)\s*\)\s*$/);
  if (!match) {
    throw makeParserError(
      doc,
      line,
      column,
      kind === "condition"
        ? "INVALID_CONDITION_SYNTAX"
        : "INVALID_EFFECT_SYNTAX",
      `Invalid ${kind} syntax: '${raw}'`,
    );
  }

  const operator = match[1].trim().toLowerCase();
  const args = splitArgs(match[2] ?? "");

  const registry =
    kind === "condition" ? CONDITION_OPERATORS : EFFECT_OPERATORS;
  if (!registry.has(operator)) {
    const suggestion = suggestClosest(operator, registry);
    throw makeParserError(
      doc,
      line,
      column,
      kind === "condition" ? "UNKNOWN_CONDITION" : "UNKNOWN_EFFECT",
      suggestion
        ? `Unknown ${kind} '${operator}', did you mean '${suggestion}'?`
        : `Unknown ${kind} '${operator}'`,
    );
  }

  return { operator, args };
};

const parseConditionExpression = (
  raw: string,
  doc: ParsedDoc,
  line: number,
  column: number,
): VnCondition => {
  const { operator, args } = parseFunctionCall(
    raw,
    doc,
    line,
    column,
    "condition",
  );

  if (operator === "flag_equals") {
    if (args.length !== 2) {
      throw makeParserError(
        doc,
        line,
        column,
        "INVALID_CONDITION_ARITY",
        "flag_equals expects 2 args: flag_equals(key,true|false)",
      );
    }
    const key = args[0];
    if (!FLAG_KEYS.has(key)) {
      const suggestion = suggestClosest(key, FLAG_KEYS);
      throw makeParserError(
        doc,
        line,
        column,
        "UNKNOWN_FLAG_KEY",
        suggestion
          ? `Unknown flag key '${key}', did you mean '${suggestion}'?`
          : `Unknown flag key '${key}'`,
      );
    }
    return {
      type: "flag_equals",
      key,
      value: parseBooleanToken(args[1], doc, line, column, "flag_equals"),
    };
  }

  if (operator === "var_gte" || operator === "var_lte") {
    if (args.length !== 2) {
      throw makeParserError(
        doc,
        line,
        column,
        "INVALID_CONDITION_ARITY",
        `${operator} expects 2 args: ${operator}(key,value)`,
      );
    }
    const key = args[0];
    if (!VAR_KEYS.has(key)) {
      const suggestion = suggestClosest(key, VAR_KEYS);
      throw makeParserError(
        doc,
        line,
        column,
        "UNKNOWN_VAR_KEY",
        suggestion
          ? `Unknown var key '${key}', did you mean '${suggestion}'?`
          : `Unknown var key '${key}'`,
      );
    }
    return {
      type: operator,
      key,
      value: parseNumberToken(args[1], doc, line, column, operator),
    };
  }

  if (operator === "has_evidence") {
    if (args.length !== 1) {
      throw makeParserError(
        doc,
        line,
        column,
        "INVALID_CONDITION_ARITY",
        "has_evidence expects 1 arg: has_evidence(evidenceId)",
      );
    }
    return { type: "has_evidence", evidenceId: args[0] };
  }

  if (operator === "quest_stage_gte") {
    if (args.length !== 2) {
      throw makeParserError(
        doc,
        line,
        column,
        "INVALID_CONDITION_ARITY",
        "quest_stage_gte expects 2 args: quest_stage_gte(questId,stage)",
      );
    }
    return {
      type: "quest_stage_gte",
      questId: args[0],
      stage: parseNumberToken(args[1], doc, line, column, operator),
    };
  }

  if (operator === "relationship_gte") {
    if (args.length !== 2) {
      throw makeParserError(
        doc,
        line,
        column,
        "INVALID_CONDITION_ARITY",
        "relationship_gte expects 2 args: relationship_gte(characterId,value)",
      );
    }
    return {
      type: "relationship_gte",
      characterId: args[0],
      value: parseNumberToken(args[1], doc, line, column, operator),
    };
  }

  if (operator === "has_item") {
    if (args.length !== 1) {
      throw makeParserError(
        doc,
        line,
        column,
        "INVALID_CONDITION_ARITY",
        "has_item expects 1 arg: has_item(itemId)",
      );
    }
    return { type: "has_item", itemId: args[0] };
  }

  throw makeParserError(
    doc,
    line,
    column,
    "UNKNOWN_CONDITION",
    `Unsupported condition '${operator}'`,
  );
};

const parseEffectExpression = (
  raw: string,
  doc: ParsedDoc,
  line: number,
  column: number,
): VnEffect => {
  const { operator, args } = parseFunctionCall(
    raw,
    doc,
    line,
    column,
    "effect",
  );

  if (operator === "set_flag") {
    if (args.length !== 2) {
      throw makeParserError(
        doc,
        line,
        column,
        "INVALID_EFFECT_ARITY",
        "set_flag expects 2 args: set_flag(key,true|false)",
      );
    }
    const key = args[0];
    if (!FLAG_KEYS.has(key)) {
      const suggestion = suggestClosest(key, FLAG_KEYS);
      throw makeParserError(
        doc,
        line,
        column,
        "UNKNOWN_FLAG_KEY",
        suggestion
          ? `Unknown flag key '${key}', did you mean '${suggestion}'?`
          : `Unknown flag key '${key}'`,
      );
    }
    return {
      type: "set_flag",
      key,
      value: parseBooleanToken(args[1], doc, line, column, "set_flag"),
    };
  }

  if (operator === "set_var" || operator === "add_var") {
    if (args.length !== 2) {
      throw makeParserError(
        doc,
        line,
        column,
        "INVALID_EFFECT_ARITY",
        `${operator} expects 2 args: ${operator}(key,value)`,
      );
    }
    const key = args[0];
    if (!VAR_KEYS.has(key)) {
      const suggestion = suggestClosest(key, VAR_KEYS);
      throw makeParserError(
        doc,
        line,
        column,
        "UNKNOWN_VAR_KEY",
        suggestion
          ? `Unknown var key '${key}', did you mean '${suggestion}'?`
          : `Unknown var key '${key}'`,
      );
    }
    return {
      type: operator,
      key,
      value: parseNumberToken(args[1], doc, line, column, operator),
    };
  }

  if (operator === "travel_to") {
    if (args.length !== 1) {
      throw makeParserError(
        doc,
        line,
        column,
        "INVALID_EFFECT_ARITY",
        "travel_to expects 1 arg: travel_to(locationId)",
      );
    }
    return { type: "travel_to", locationId: args[0] };
  }

  if (operator === "track_event") {
    if (args.length !== 1) {
      throw makeParserError(
        doc,
        line,
        column,
        "INVALID_EFFECT_ARITY",
        "track_event expects 1 arg: track_event(eventName)",
      );
    }
    return { type: "track_event", eventName: args[0] };
  }

  if (operator === "discover_fact") {
    if (args.length !== 2) {
      throw makeParserError(
        doc,
        line,
        column,
        "INVALID_EFFECT_ARITY",
        "discover_fact expects 2 args: discover_fact(caseId,factId)",
      );
    }
    return { type: "discover_fact", caseId: args[0], factId: args[1] };
  }

  if (operator === "grant_xp") {
    if (args.length !== 1) {
      throw makeParserError(
        doc,
        line,
        column,
        "INVALID_EFFECT_ARITY",
        "grant_xp expects 1 arg: grant_xp(amount)",
      );
    }
    return {
      type: "grant_xp",
      amount: parseNumberToken(args[0], doc, line, column, operator),
    };
  }

  if (operator === "unlock_group") {
    if (args.length !== 1) {
      throw makeParserError(
        doc,
        line,
        column,
        "INVALID_EFFECT_ARITY",
        "unlock_group expects 1 arg: unlock_group(groupId)",
      );
    }
    return { type: "unlock_group", groupId: args[0] };
  }

  if (operator === "set_quest_stage") {
    if (args.length !== 2) {
      throw makeParserError(
        doc,
        line,
        column,
        "INVALID_EFFECT_ARITY",
        "set_quest_stage expects 2 args: set_quest_stage(questId,stage)",
      );
    }
    return {
      type: "set_quest_stage",
      questId: args[0],
      stage: parseNumberToken(args[1], doc, line, column, operator),
    };
  }

  if (operator === "change_relationship") {
    if (args.length !== 2) {
      throw makeParserError(
        doc,
        line,
        column,
        "INVALID_EFFECT_ARITY",
        "change_relationship expects 2 args: change_relationship(characterId,delta)",
      );
    }
    return {
      type: "change_relationship",
      characterId: args[0],
      delta: parseNumberToken(args[1], doc, line, column, operator),
    };
  }

  if (operator === "grant_evidence") {
    if (args.length !== 1) {
      throw makeParserError(
        doc,
        line,
        column,
        "INVALID_EFFECT_ARITY",
        "grant_evidence expects 1 arg: grant_evidence(evidenceId)",
      );
    }
    return { type: "grant_evidence", evidenceId: args[0] };
  }

  if (
    operator === "add_heat" ||
    operator === "add_tension" ||
    operator === "grant_influence"
  ) {
    if (args.length !== 1) {
      throw makeParserError(
        doc,
        line,
        column,
        "INVALID_EFFECT_ARITY",
        `${operator} expects 1 arg: ${operator}(amount)`,
      );
    }
    return {
      type: operator,
      amount: parseNumberToken(args[0], doc, line, column, operator),
    };
  }

  throw makeParserError(
    doc,
    line,
    column,
    "UNKNOWN_EFFECT",
    `Unsupported effect '${operator}'`,
  );
};

const parseCheckHeader = (
  raw: string,
  doc: ParsedDoc,
  line: number,
  column: number,
): VnSkillCheck => {
  const entries = raw
    .split(/\s+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  const params = new Map<string, string>();
  for (const entry of entries) {
    const [keyRaw, valueRaw] = entry.split("=");
    if (!keyRaw || !valueRaw) {
      throw makeParserError(
        doc,
        line,
        column,
        "INVALID_CHECK_FORMAT",
        `Check item '${entry}' must be in key=value format`,
      );
    }
    params.set(keyRaw.trim().toLowerCase(), valueRaw.trim());
  }

  const checkId = params.get("id");
  const voiceId = params.get("voice");
  const dcRaw = params.get("dc") ?? params.get("difficulty");
  if (!checkId || !voiceId || !dcRaw) {
    throw makeParserError(
      doc,
      line,
      column,
      "INVALID_CHECK_FORMAT",
      "Check requires id=..., voice=..., dc=...",
    );
  }
  if (!SKILL_VOICE_IDS.has(voiceId)) {
    const suggestion = suggestClosest(voiceId, SKILL_VOICE_IDS);
    throw makeParserError(
      doc,
      line,
      column,
      "UNKNOWN_VOICE",
      suggestion
        ? `Unknown voice '${voiceId}', did you mean '${suggestion}'?`
        : `Unknown voice '${voiceId}'`,
    );
  }

  const showChanceRaw = params.get("showchance");

  return {
    id: checkId,
    voiceId,
    difficulty: parseNumberToken(dcRaw, doc, line, column, "dc"),
    showChancePercent:
      showChanceRaw === undefined
        ? undefined
        : parseBooleanToken(showChanceRaw, doc, line, column, "showchance"),
  };
};

const parseBranchNext = (
  raw: string,
  doc: ParsedDoc,
  line: number,
  column: number,
): string => {
  const match = raw.match(/^next\s*=\s*\[\[([^\]]+)\]\]\s*$/i);
  if (!match) {
    throw makeParserError(
      doc,
      line,
      column,
      "INVALID_BRANCH_SYNTAX",
      "Branch directive must be in format next=[[node_id]]",
    );
  }
  return normalizeWikiTarget(match[1]);
};

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
    const hasCheckBranches = Boolean(
      currentChoice.skillCheck?.onSuccess?.nextNodeId &&
      currentChoice.skillCheck?.onFail?.nextNodeId,
    );
    if (!currentChoice.nextRaw && !hasCheckBranches) {
      throw makeParserError(
        doc,
        currentChoice.line,
        currentChoice.column,
        "CHOICE_MISSING_NEXT",
        "Choice requires '- Next: [[node_id]]' or both Check branches (OnSuccess/OnFail with next=[[...]]).",
      );
    }
    choices.push(currentChoice);
    currentChoice = null;
  };

  for (let index = 0; index < sectionLines.length; index += 1) {
    const rawLine = sectionLines[index];
    const trimmed = rawLine.trim();
    const absoluteLine = doc.contentStartLine + section.line + index + 1;
    const absoluteColumn = Math.max(1, rawLine.indexOf(trimmed) + 1);

    const choiceHeader = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (choiceHeader) {
      pushCurrentChoice();
      currentChoice = {
        text: stripMarkdownInlineStyling(choiceHeader[2]),
        nextRaw: "",
        effects: [],
        visibleIfAll: [],
        visibleIfAny: [],
        requireAll: [],
        requireAny: [],
        line: absoluteLine,
        column: absoluteColumn,
      };
      continue;
    }

    if (trimmed.length === 0) {
      continue;
    }

    if (!currentChoice) {
      throw makeParserError(
        doc,
        absoluteLine,
        absoluteColumn,
        "INVALID_CHOICE_FORMAT",
        "Choices section must start each choice with '1. Choice text'",
      );
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
      if (!FLAG_KEYS.has(setFlagMatch[1])) {
        const suggestion = suggestClosest(setFlagMatch[1], FLAG_KEYS);
        throw makeParserError(
          doc,
          absoluteLine,
          absoluteColumn,
          "UNKNOWN_FLAG_KEY",
          suggestion
            ? `Unknown flag key '${setFlagMatch[1]}', did you mean '${suggestion}'?`
            : `Unknown flag key '${setFlagMatch[1]}'`,
        );
      }
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

    const directive = parseDirective(trimmed);
    if (directive) {
      if (directive.name === "if") {
        currentChoice.visibleIfAll.push(
          parseConditionExpression(
            directive.value,
            doc,
            absoluteLine,
            absoluteColumn,
          ),
        );
        continue;
      }
      if (directive.name === "ifany") {
        currentChoice.visibleIfAny.push(
          parseConditionExpression(
            directive.value,
            doc,
            absoluteLine,
            absoluteColumn,
          ),
        );
        continue;
      }
      if (directive.name === "require") {
        currentChoice.requireAll.push(
          parseConditionExpression(
            directive.value,
            doc,
            absoluteLine,
            absoluteColumn,
          ),
        );
        continue;
      }
      if (directive.name === "requireany") {
        currentChoice.requireAny.push(
          parseConditionExpression(
            directive.value,
            doc,
            absoluteLine,
            absoluteColumn,
          ),
        );
        continue;
      }
      if (directive.name === "effect") {
        currentChoice.effects.push(
          parseEffectExpression(
            directive.value,
            doc,
            absoluteLine,
            absoluteColumn,
          ),
        );
        continue;
      }
      if (directive.name === "check") {
        currentChoice.skillCheck = parseCheckHeader(
          directive.value,
          doc,
          absoluteLine,
          absoluteColumn,
        );
        continue;
      }
      if (directive.name === "onsuccess") {
        if (!currentChoice.skillCheck) {
          throw makeParserError(
            doc,
            absoluteLine,
            absoluteColumn,
            "CHECK_REQUIRED",
            "OnSuccess requires a preceding Check directive",
          );
        }
        currentChoice.skillCheck.onSuccess = {
          ...(currentChoice.skillCheck.onSuccess ?? {}),
          nextNodeId: parseBranchNext(
            directive.value,
            doc,
            absoluteLine,
            absoluteColumn,
          ),
        };
        continue;
      }
      if (directive.name === "onfail") {
        if (!currentChoice.skillCheck) {
          throw makeParserError(
            doc,
            absoluteLine,
            absoluteColumn,
            "CHECK_REQUIRED",
            "OnFail requires a preceding Check directive",
          );
        }
        currentChoice.skillCheck.onFail = {
          ...(currentChoice.skillCheck.onFail ?? {}),
          nextNodeId: parseBranchNext(
            directive.value,
            doc,
            absoluteLine,
            absoluteColumn,
          ),
        };
        continue;
      }
      if (directive.name === "onsuccesseffect") {
        if (!currentChoice.skillCheck) {
          throw makeParserError(
            doc,
            absoluteLine,
            absoluteColumn,
            "CHECK_REQUIRED",
            "OnSuccessEffect requires a preceding Check directive",
          );
        }
        currentChoice.skillCheck.onSuccess = {
          ...(currentChoice.skillCheck.onSuccess ?? {}),
          effects: [
            ...(currentChoice.skillCheck.onSuccess?.effects ?? []),
            parseEffectExpression(
              directive.value,
              doc,
              absoluteLine,
              absoluteColumn,
            ),
          ],
        };
        continue;
      }
      if (directive.name === "onfaileffect") {
        if (!currentChoice.skillCheck) {
          throw makeParserError(
            doc,
            absoluteLine,
            absoluteColumn,
            "CHECK_REQUIRED",
            "OnFailEffect requires a preceding Check directive",
          );
        }
        currentChoice.skillCheck.onFail = {
          ...(currentChoice.skillCheck.onFail ?? {}),
          effects: [
            ...(currentChoice.skillCheck.onFail?.effects ?? []),
            parseEffectExpression(
              directive.value,
              doc,
              absoluteLine,
              absoluteColumn,
            ),
          ],
        };
        continue;
      }

      const suggestion = suggestClosest(directive.name, [
        "if",
        "ifany",
        "require",
        "requireany",
        "effect",
        "check",
        "onsuccess",
        "onfail",
        "onsuccesseffect",
        "onfaileffect",
      ]);
      throw makeParserError(
        doc,
        absoluteLine,
        absoluteColumn,
        "UNKNOWN_DIRECTIVE",
        suggestion
          ? `Unknown choice directive '${directive.name}', did you mean '${suggestion}'?`
          : `Unknown choice directive '${directive.name}'`,
      );
    }

    if (/^-+\s*Sets\b/i.test(trimmed) || /^-+\s*Unlocks\b/i.test(trimmed)) {
      throw makeParserError(
        doc,
        absoluteLine,
        absoluteColumn,
        "INVALID_EFFECT_SYNTAX",
        "Supported legacy effect syntax is '- Sets `flag_name` = true' or '- Unlocks [[loc_id]]'",
      );
    }

    throw makeParserError(
      doc,
      absoluteLine,
      absoluteColumn,
      "UNSUPPORTED_CHOICE_LINE",
      `Unsupported line in Choices section: ${trimmed}`,
    );
  }

  pushCurrentChoice();

  return choices;
};

const parseNextSection = (
  doc: ParsedDoc,
): { target: string; line: number } | null => {
  const section =
    findSection(doc.markdownBody, "→ Next") ||
    findSection(doc.markdownBody, "Next");
  if (!section) {
    return null;
  }

  const match = section.content.match(/\[\[([^\]]+)\]\]/);
  if (!match) {
    return null;
  }

  return {
    target: normalizeWikiTarget(match[1]),
    line: doc.contentStartLine + section.line + 1,
  };
};

const parsePassiveChecksSection = (
  doc: ParsedDoc,
): ParsedPassiveCheckDraft[] => {
  if (doc.type !== "vn_checks") {
    return [];
  }

  const section = findSection(doc.markdownBody, "On Scene Enter");
  if (!section) {
    return [];
  }

  const lines = section.content.split("\n");
  const checks: ParsedPassiveCheckDraft[] = [];
  let current: ParsedPassiveCheckDraft | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const trimmed = rawLine.trim();
    if (trimmed.length === 0) {
      continue;
    }
    const absoluteLine = doc.contentStartLine + section.line + index + 1;
    const absoluteColumn = Math.max(1, rawLine.indexOf(trimmed) + 1);
    const directive = parseDirective(trimmed);
    if (!directive) {
      continue;
    }

    if (directive.name === "check") {
      const check = parseCheckHeader(
        directive.value,
        doc,
        absoluteLine,
        absoluteColumn,
      );
      current = {
        id: check.id,
        voiceId: check.voiceId,
        difficulty: check.difficulty,
      };
      checks.push(current);
      continue;
    }

    if (directive.name === "onsuccesseffect") {
      if (!current) {
        throw makeParserError(
          doc,
          absoluteLine,
          absoluteColumn,
          "CHECK_REQUIRED",
          "OnSuccessEffect requires a preceding Check directive",
        );
      }
      current.onSuccess = {
        ...(current.onSuccess ?? {}),
        effects: [
          ...(current.onSuccess?.effects ?? []),
          parseEffectExpression(
            directive.value,
            doc,
            absoluteLine,
            absoluteColumn,
          ),
        ],
      };
      continue;
    }

    if (directive.name === "onsuccess") {
      if (!current) {
        throw makeParserError(
          doc,
          absoluteLine,
          absoluteColumn,
          "CHECK_REQUIRED",
          "OnSuccess requires a preceding Check directive",
        );
      }
      current.onSuccess = {
        ...(current.onSuccess ?? {}),
        nextNodeId: parseBranchNext(
          directive.value,
          doc,
          absoluteLine,
          absoluteColumn,
        ),
      };
      continue;
    }

    if (directive.name === "onfaileffect") {
      if (!current) {
        throw makeParserError(
          doc,
          absoluteLine,
          absoluteColumn,
          "CHECK_REQUIRED",
          "OnFailEffect requires a preceding Check directive",
        );
      }
      current.onFail = {
        ...(current.onFail ?? {}),
        effects: [
          ...(current.onFail?.effects ?? []),
          parseEffectExpression(
            directive.value,
            doc,
            absoluteLine,
            absoluteColumn,
          ),
        ],
      };
      continue;
    }

    if (directive.name === "onfail") {
      if (!current) {
        throw makeParserError(
          doc,
          absoluteLine,
          absoluteColumn,
          "CHECK_REQUIRED",
          "OnFail requires a preceding Check directive",
        );
      }
      current.onFail = {
        ...(current.onFail ?? {}),
        nextNodeId: parseBranchNext(
          directive.value,
          doc,
          absoluteLine,
          absoluteColumn,
        ),
      };
      continue;
    }
  }

  return checks;
};

const parseConditionsSection = (
  doc: ParsedDoc,
  sectionName: string,
): VnCondition[] => {
  const section = findSection(doc.markdownBody, sectionName);
  if (!section) {
    return [];
  }

  const conditions: VnCondition[] = [];
  const lines = section.content.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const trimmed = rawLine.trim();
    if (trimmed.length === 0) {
      continue;
    }

    const absoluteLine = doc.contentStartLine + section.line + index + 1;
    const absoluteColumn = Math.max(1, rawLine.indexOf(trimmed) + 1);
    const directive = parseDirective(trimmed);
    if (!directive) {
      continue;
    }

    if (directive.name !== "if") {
      const suggestion = suggestClosest(directive.name, ["if"]);
      throw makeParserError(
        doc,
        absoluteLine,
        absoluteColumn,
        "UNKNOWN_DIRECTIVE",
        suggestion
          ? `Unknown ${sectionName} directive '${directive.name}', did you mean '${suggestion}'?`
          : `Unknown ${sectionName} directive '${directive.name}'`,
      );
    }

    conditions.push(
      parseConditionExpression(
        directive.value,
        doc,
        absoluteLine,
        absoluteColumn,
      ),
    );
  }

  return conditions;
};

const parseEffectsSection = (
  doc: ParsedDoc,
  sectionName: string,
): VnEffect[] => {
  const section = findSection(doc.markdownBody, sectionName);
  if (!section) {
    return [];
  }

  const effects: VnEffect[] = [];
  const lines = section.content.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const trimmed = rawLine.trim();
    if (trimmed.length === 0) {
      continue;
    }

    const absoluteLine = doc.contentStartLine + section.line + index + 1;
    const absoluteColumn = Math.max(1, rawLine.indexOf(trimmed) + 1);
    const directive = parseDirective(trimmed);
    if (!directive) {
      continue;
    }

    if (directive.name !== "effect") {
      const suggestion = suggestClosest(directive.name, ["effect"]);
      throw makeParserError(
        doc,
        absoluteLine,
        absoluteColumn,
        "UNKNOWN_DIRECTIVE",
        suggestion
          ? `Unknown ${sectionName} directive '${directive.name}', did you mean '${suggestion}'?`
          : `Unknown ${sectionName} directive '${directive.name}'`,
      );
    }

    effects.push(
      parseEffectExpression(directive.value, doc, absoluteLine, absoluteColumn),
    );
  }

  return effects;
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
        column: 1,
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
  let onboardingDir: string;
  try {
    onboardingDir = validateCase01OnboardingRoot(storyRoot);
  } catch (error) {
    throw new Case01ParserError({
      code: "MISSING_ONBOARDING_ROOT",
      message: error instanceof Error ? error.message : String(error),
      relativePath: `${ONBOARDING_RELATIVE_ROOT}/`,
      line: 1,
      column: 1,
      severity: "error",
    });
  }
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
        column: 1,
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
        column: 1,
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
        column: 1,
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
          column: 1,
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
    const passiveChecksByParent = new Map<string, ParsedPassiveCheckDraft[]>();
    for (const checkDoc of docs.filter((doc) => doc.type === "vn_checks")) {
      if (!checkDoc.parentId) {
        throw new Case01ParserError({
          code: "MISSING_PARENT",
          message: "vn_checks document must define frontmatter parent",
          relativePath: checkDoc.relativePath,
          line: 1,
          column: 1,
          severity: "error",
        });
      }
      if (!runtimeIds.has(checkDoc.parentId)) {
        throw new Case01ParserError({
          code: "ORPHAN_VN_CHECKS",
          message: `vn_checks parent '${checkDoc.parentId}' is not a runtime node in onboarding scope`,
          relativePath: checkDoc.relativePath,
          line: 1,
          column: 1,
          severity: "error",
        });
      }

      const parsed = parsePassiveChecksSection(checkDoc);
      if (parsed.length === 0) {
        continue;
      }

      const bucket = passiveChecksByParent.get(checkDoc.parentId) ?? [];
      bucket.push(...parsed);
      passiveChecksByParent.set(checkDoc.parentId, bucket);
    }

    const nodeBlueprintsRaw: Case01NodeBlueprint[] = [];
    const choiceIds = new Set<string>();

    for (const runtimeDoc of runtimeDocs) {
      let choicesDraft = parseChoicesSection(runtimeDoc);

      // Support '## → Next' for vn_scene if '## Choices' is missing
      if (choicesDraft.length === 0 && runtimeDoc.type === "vn_scene") {
        const nextLink = parseNextSection(runtimeDoc);
        if (nextLink) {
          choicesDraft = [
            {
              text: "Continue",
              nextRaw: nextLink.target,
              effects: [],
              visibleIfAll: [],
              visibleIfAny: [],
              requireAll: [],
              requireAny: [],
              line: nextLink.line,
              column: 1,
            },
          ];
        }
      }

      const preconditions = parseConditionsSection(runtimeDoc, "Preconditions");
      const onEnter = parseEffectsSection(runtimeDoc, "OnEnter");
      const passiveChecksDraft = passiveChecksByParent.get(runtimeDoc.id) ?? [];
      const passiveCheckIds = new Set<string>();
      const passiveChecks: VnSkillCheck[] = [];
      for (const draft of passiveChecksDraft) {
        if (passiveCheckIds.has(draft.id)) {
          throw new Case01ParserError({
            code: "DUPLICATE_PASSIVE_CHECK_ID",
            message: `Duplicate passive check id '${draft.id}' for node '${runtimeDoc.id}'`,
            relativePath: runtimeDoc.relativePath,
            line: runtimeDoc.contentStartLine + 1,
            column: 1,
            severity: "error",
          });
        }
        passiveCheckIds.add(draft.id);
        passiveChecks.push({
          id: draft.id,
          voiceId: draft.voiceId,
          difficulty: draft.difficulty,
          isPassive: true,
          onSuccess: draft.onSuccess,
          onFail: draft.onFail,
        });
      }

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
          column: 1,
          severity: "error",
        });
      }

      const compiledChoices: VnChoice[] = choicesDraft.map((draft, index) => {
        const resolveNextNodeId = (
          rawTarget: string,
          reasonCode: "OUT_OF_SCOPE_NEXT" | "OUT_OF_SCOPE_CHECK_BRANCH",
          reasonMessage: string,
        ): string => {
          if (rawTarget.length === 0 || rawTarget === CASE01_HANDOFF_NODE_ID) {
            return CASE01_HANDOFF_NODE_ID;
          }
          if (runtimeIds.has(rawTarget)) {
            return rawTarget;
          }
          diagnostics.push({
            code: reasonCode,
            message: `${reasonMessage} '${rawTarget}' is out of onboarding scope and was redirected to ${CASE01_HANDOFF_NODE_ID}`,
            relativePath: runtimeDoc.relativePath,
            line: draft.line,
            column: draft.column,
            severity: "warning",
          });
          return CASE01_HANDOFF_NODE_ID;
        };

        const choiceId = toDeterministicChoiceId(runtimeDoc.id, index);
        if (choiceIds.has(choiceId)) {
          throw new Case01ParserError({
            code: "DUPLICATE_CHOICE_ID",
            message: `Duplicate generated choice id: ${choiceId}`,
            relativePath: runtimeDoc.relativePath,
            line: draft.line,
            column: draft.column,
            severity: "error",
          });
        }
        choiceIds.add(choiceId);

        const baseNextRaw =
          draft.nextRaw ||
          draft.skillCheck?.onSuccess?.nextNodeId ||
          draft.skillCheck?.onFail?.nextNodeId ||
          "";
        const inScopeNextNodeId = resolveNextNodeId(
          baseNextRaw,
          "OUT_OF_SCOPE_NEXT",
          "Choice target",
        );

        const skillCheck = draft.skillCheck
          ? {
              ...draft.skillCheck,
              onSuccess: draft.skillCheck.onSuccess
                ? {
                    ...draft.skillCheck.onSuccess,
                    nextNodeId: draft.skillCheck.onSuccess.nextNodeId
                      ? resolveNextNodeId(
                          draft.skillCheck.onSuccess.nextNodeId,
                          "OUT_OF_SCOPE_CHECK_BRANCH",
                          `Skill check success branch for choice '${choiceId}'`,
                        )
                      : undefined,
                  }
                : undefined,
              onFail: draft.skillCheck.onFail
                ? {
                    ...draft.skillCheck.onFail,
                    nextNodeId: draft.skillCheck.onFail.nextNodeId
                      ? resolveNextNodeId(
                          draft.skillCheck.onFail.nextNodeId,
                          "OUT_OF_SCOPE_CHECK_BRANCH",
                          `Skill check fail branch for choice '${choiceId}'`,
                        )
                      : undefined,
                  }
                : undefined,
            }
          : undefined;

        const choiceType = toScenarioChoiceType(runtimeDoc.type);
        return {
          id: choiceId,
          text: draft.text,
          nextNodeId: inScopeNextNodeId,
          effects: draft.effects.length > 0 ? draft.effects : undefined,
          visibleIfAll:
            draft.visibleIfAll.length > 0 ? draft.visibleIfAll : undefined,
          visibleIfAny:
            draft.visibleIfAny.length > 0 ? draft.visibleIfAny : undefined,
          requireAll:
            draft.requireAll.length > 0 ? draft.requireAll : undefined,
          requireAny:
            draft.requireAny.length > 0 ? draft.requireAny : undefined,
          skillCheck,
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
          column: 1,
          severity: "error",
        });
      }

      nodeBlueprintsRaw.push({
        id: runtimeDoc.id,
        scenarioId: CASE01_SCENARIO_ID,
        sourcePath: runtimeDoc.relativePath,
        choices: compiledChoices,
        preconditions: preconditions.length > 0 ? preconditions : undefined,
        onEnter: onEnter.length > 0 ? onEnter : undefined,
        passiveChecks: passiveChecks.length > 0 ? passiveChecks : undefined,
        titleOverride: title,
        bodyOverride: body,
      });
    }

    nodeBlueprintsRaw.push({
      id: CASE01_HANDOFF_NODE_ID,
      scenarioId: CASE01_SCENARIO_ID,
      sourcePath: `${ONBOARDING_RELATIVE_ROOT}/scene_start_game.md`,
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
        relativePath: `${ONBOARDING_RELATIVE_ROOT}/scene_start_game.md`,
        line: 1,
        column: 1,
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
          column: 1,
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
