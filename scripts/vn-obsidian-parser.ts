import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { parseDocument } from "yaml";

import type {
  VnChoice,
  VnCondition,
  VnEffect,
  VnScenarioCompletionRoute,
  VnSkillCheck,
} from "../src/features/vn/types";
import {
  parseConditionExpression,
  parseEffectExpression,
} from "./vn-logic-expression";
import type {
  BlueprintDiagnostic,
  NodeBlueprint,
  ScenarioBlueprint,
  ScenarioBlueprintBundle,
  ScenarioBlueprintProviderResult,
  ScenarioMigrationMode,
} from "./vn-blueprint-types";

const PROVIDER_NAME = "obsidian-runtime";
const SCENE_FILE_RE = /^scene_[A-Za-z0-9_]+(?:\.[a-z]{2})?\.md$/;
const LOCALE_FILE_RE = /^(scene_[A-Za-z0-9_]+)\.([a-z]{2})\.md$/;
const CANONICAL_FILE_RE = /^(scene_[A-Za-z0-9_]+)\.md$/;
const ALLOWED_LOCALE_FRONTMATTER_KEYS = new Set([
  "id",
  "type",
  "status",
  "aliases",
  "tags",
]);

type ParsedMarkdownDocument = {
  relativePath: string;
  absolutePath: string;
  frontmatter: Record<string, unknown>;
  body: string;
};

type ParseScenarioManifest = {
  migrationMode: ScenarioMigrationMode;
  defaultLocale: string;
  supportedLocales: string[];
  scenario: ScenarioBlueprint;
};

const normalizeText = (value: string): string =>
  value.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

const createDiagnostic = (
  partial: Omit<BlueprintDiagnostic, "providerName">,
): BlueprintDiagnostic => ({
  providerName: PROVIDER_NAME,
  ...partial,
});

const asString = (
  value: unknown,
  context: { relativePath: string; field: string },
): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createDiagnostic({
      code: "PARSE_ERROR",
      message: `${context.field} must be a non-empty string`,
      relativePath: context.relativePath,
      line: 1,
      column: 1,
      severity: "error",
    });
  }
  return value.trim();
};

const asOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;

const asStringArray = (
  value: unknown,
  context: { relativePath: string; field: string },
): string[] => {
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string")
  ) {
    throw createDiagnostic({
      code: "PARSE_ERROR",
      message: `${context.field} must be an array of strings`,
      relativePath: context.relativePath,
      line: 1,
      column: 1,
      severity: "error",
    });
  }
  return value.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
};

const asOptionalBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "boolean") {
    throw new Error("expected boolean");
  }
  return value;
};

const asOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("expected number");
  }
  return value;
};

const parseYamlRecord = (
  source: string,
  relativePath: string,
  fallbackCode: string,
): Record<string, unknown> => {
  const document = parseDocument(source);
  if (document.errors.length > 0) {
    const issue = document.errors[0];
    throw createDiagnostic({
      code: fallbackCode,
      message: issue.message,
      relativePath,
      line: issue.linePos?.[0]?.line ?? 1,
      column: issue.linePos?.[0]?.col ?? 1,
      severity: "error",
    });
  }
  const parsed = document.toJSON();
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw createDiagnostic({
      code: fallbackCode,
      message: "YAML content must resolve to an object",
      relativePath,
      line: 1,
      column: 1,
      severity: "error",
    });
  }
  return parsed as Record<string, unknown>;
};

const parseMarkdownDocument = (
  storyRoot: string,
  relativePath: string,
): ParsedMarkdownDocument => {
  const absolutePath = path.join(storyRoot, relativePath);
  const raw = normalizeText(readFileSync(absolutePath, "utf8"));
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    throw createDiagnostic({
      code: "PARSE_ERROR",
      message: "Missing YAML frontmatter block",
      relativePath,
      line: 1,
      column: 1,
      severity: "error",
    });
  }

  return {
    relativePath,
    absolutePath,
    frontmatter: parseYamlRecord(match[1], relativePath, "PARSE_ERROR"),
    body: raw.slice(match[0].length),
  };
};

const extractHeading = (body: string, relativePath: string): string => {
  const match = body.match(/^#\s+(.+)$/m);
  if (!match) {
    throw createDiagnostic({
      code: "PARSE_ERROR",
      message: "Scene must contain a top-level heading",
      relativePath,
      line: 1,
      column: 1,
      severity: "error",
    });
  }
  return match[1].trim();
};

const findSection = (body: string, sectionName: string): string | null => {
  const lines = body.split("\n");
  const sectionPattern = new RegExp(`^##\\s+${sectionName}\\s*$`, "i");
  const start = lines.findIndex((line) => sectionPattern.test(line.trim()));
  if (start < 0) {
    return null;
  }

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index].trim())) {
      end = index;
      break;
    }
  }

  return lines
    .slice(start + 1, end)
    .join("\n")
    .trim();
};

const extractLocaleBody = (body: string): string => {
  const section = findSection(body, "Script");
  if (section) {
    return section;
  }

  const stripped = body.replace(/^#\s+.+$/m, "").trim();
  return stripped;
};

const extractLogicBlock = (body: string): string | null => {
  const match = body.match(/```vn-logic\s*\n([\s\S]*?)```/i);
  return match ? match[1].trim() : null;
};

const parseConditionValue = (
  value: unknown,
  relativePath: string,
): VnCondition => {
  if (typeof value === "string") {
    try {
      return parseConditionExpression(value);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw createDiagnostic({
        code: "PARSE_ERROR",
        message: `Invalid condition expression: ${message}`,
        relativePath,
        line: 1,
        column: 1,
        severity: "error",
      });
    }
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as VnCondition;
  }
  throw createDiagnostic({
    code: "PARSE_ERROR",
    message: "Condition entries must be expression strings or objects",
    relativePath,
    line: 1,
    column: 1,
    severity: "error",
  });
};

const parseEffectValue = (value: unknown, relativePath: string): VnEffect => {
  if (typeof value === "string") {
    try {
      return parseEffectExpression(value);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw createDiagnostic({
        code: "PARSE_ERROR",
        message: `Invalid effect expression: ${message}`,
        relativePath,
        line: 1,
        column: 1,
        severity: "error",
      });
    }
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as VnEffect;
  }
  throw createDiagnostic({
    code: "PARSE_ERROR",
    message: "Effect entries must be expression strings or objects",
    relativePath,
    line: 1,
    column: 1,
    severity: "error",
  });
};

const parseConditionList = (
  value: unknown,
  relativePath: string,
): VnCondition[] | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw createDiagnostic({
      code: "PARSE_ERROR",
      message: "Condition field must be an array",
      relativePath,
      line: 1,
      column: 1,
      severity: "error",
    });
  }
  return value.map((entry) => parseConditionValue(entry, relativePath));
};

const parseEffectList = (
  value: unknown,
  relativePath: string,
): VnEffect[] | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw createDiagnostic({
      code: "PARSE_ERROR",
      message: "Effect field must be an array",
      relativePath,
      line: 1,
      column: 1,
      severity: "error",
    });
  }
  return value.map((entry) => parseEffectValue(entry, relativePath));
};

const parseOutcomeBranch = (
  value: unknown,
  relativePath: string,
): VnSkillCheck["onSuccess"] => {
  if (value === undefined) {
    return undefined;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createDiagnostic({
      code: "PARSE_ERROR",
      message: "Skill check branch must be an object",
      relativePath,
      line: 1,
      column: 1,
      severity: "error",
    });
  }

  const record = value as Record<string, unknown>;
  return {
    nextNodeId: asOptionalString(record.next),
    effects: parseEffectList(record.effects, relativePath),
    ...(record.cost_effects === undefined
      ? {}
      : {
          costEffects: parseEffectList(record.cost_effects, relativePath),
        }),
  };
};

const parseSkillCheck = (
  value: unknown,
  relativePath: string,
): VnSkillCheck | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createDiagnostic({
      code: "PARSE_ERROR",
      message: "skill_check must be an object",
      relativePath,
      line: 1,
      column: 1,
      severity: "error",
    });
  }

  const record = value as Record<string, unknown>;
  const parsed: VnSkillCheck = {
    id: asString(record.id, { relativePath, field: "skill_check.id" }),
    voiceId: asString(record.voice_id, {
      relativePath,
      field: "skill_check.voice_id",
    }),
    difficulty:
      asOptionalNumber(record.difficulty) ??
      (() => {
        throw createDiagnostic({
          code: "PARSE_ERROR",
          message: "skill_check.difficulty must be a number",
          relativePath,
          line: 1,
          column: 1,
          severity: "error",
        });
      })(),
  };

  parsed.isPassive = asOptionalBoolean(record.is_passive);
  parsed.showChancePercent = asOptionalBoolean(record.show_chance_percent);
  parsed.karmaSensitive = asOptionalBoolean(record.karma_sensitive);
  parsed.outcomeModel = asOptionalString(record.outcome_model) as
    | VnSkillCheck["outcomeModel"]
    | undefined;
  parsed.onSuccess = parseOutcomeBranch(record.on_success, relativePath);
  parsed.onFail = parseOutcomeBranch(record.on_fail, relativePath);
  parsed.onCritical = parseOutcomeBranch(record.on_critical, relativePath);
  parsed.onSuccessWithCost = parseOutcomeBranch(
    record.on_success_with_cost,
    relativePath,
  ) as VnSkillCheck["onSuccessWithCost"];

  return parsed;
};

const parseChoice = (value: unknown, relativePath: string): VnChoice => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createDiagnostic({
      code: "PARSE_ERROR",
      message: "choice entries must be objects",
      relativePath,
      line: 1,
      column: 1,
      severity: "error",
    });
  }

  const record = value as Record<string, unknown>;
  return {
    id: asString(record.id, { relativePath, field: "choice.id" }),
    text: asString(record.text, { relativePath, field: "choice.text" }),
    nextNodeId: asString(record.next, { relativePath, field: "choice.next" }),
    choiceType: asOptionalString(record.choice_type) as VnChoice["choiceType"],
    visibleIfAll: parseConditionList(record.visible_if_all, relativePath),
    visibleIfAny: parseConditionList(record.visible_if_any, relativePath),
    requireAll: parseConditionList(record.require_all, relativePath),
    requireAny: parseConditionList(record.require_any, relativePath),
    effects: parseEffectList(record.effects, relativePath),
    skillCheck: parseSkillCheck(record.skill_check, relativePath),
  };
};

const parseScenarioManifest = (
  doc: ParsedMarkdownDocument,
): ParseScenarioManifest => {
  const { frontmatter, relativePath } = doc;
  const id = asString(frontmatter.id, { relativePath, field: "id" });
  const title = asString(frontmatter.title, { relativePath, field: "title" });
  const startNodeId = asString(frontmatter.start_node_id, {
    relativePath,
    field: "start_node_id",
  });
  const sceneOrder = asStringArray(frontmatter.scene_order, {
    relativePath,
    field: "scene_order",
  });
  if (sceneOrder[0] !== startNodeId) {
    throw createDiagnostic({
      code: "SCENE_ORDER_MISMATCH",
      message: "start_node_id must match the first scene_order entry",
      relativePath,
      line: 1,
      column: 1,
      severity: "error",
      scenarioId: id,
    });
  }

  const completionRoutes = frontmatter.completion_routes;
  let parsedCompletionRoutes: VnScenarioCompletionRoute[] | undefined;
  if (completionRoutes !== undefined) {
    if (!Array.isArray(completionRoutes)) {
      throw createDiagnostic({
        code: "PARSE_ERROR",
        message: "completion_routes must be an array",
        relativePath,
        line: 1,
        column: 1,
        severity: "error",
        scenarioId: id,
      });
    }
    parsedCompletionRoutes = completionRoutes as VnScenarioCompletionRoute[];
  }

  const defaultLocale = asOptionalString(frontmatter.default_locale) ?? "en";
  const supportedLocales =
    frontmatter.supported_locales === undefined
      ? [defaultLocale]
      : asStringArray(frontmatter.supported_locales, {
          relativePath,
          field: "supported_locales",
        });
  const migrationMode =
    (asOptionalString(frontmatter.migration_mode) as
      | ScenarioMigrationMode
      | undefined) ?? "authoritative";

  return {
    migrationMode,
    defaultLocale,
    supportedLocales,
    scenario: {
      id,
      title,
      startNodeId,
      nodeIds: sceneOrder,
      mode: asOptionalString(frontmatter.mode) as ScenarioBlueprint["mode"],
      packId: asOptionalString(frontmatter.pack_id),
      skillCheckDice: asOptionalString(
        frontmatter.skill_check_dice,
      ) as ScenarioBlueprint["skillCheckDice"],
      musicUrl: asOptionalString(frontmatter.music_url),
      defaultBackgroundUrl: asOptionalString(
        frontmatter.default_background_url,
      ),
      completionRoute:
        parsedCompletionRoutes && parsedCompletionRoutes.length === 1
          ? parsedCompletionRoutes[0]
          : undefined,
      completionRoutes:
        parsedCompletionRoutes && parsedCompletionRoutes.length > 0
          ? parsedCompletionRoutes
          : undefined,
    },
  };
};

const collectScenarioRoots = (
  storyRoot: string,
  currentDir = storyRoot,
): string[] => {
  const roots: string[] = [];
  for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
    if (entry.name === ".obsidian" || entry.name === "99_Archive") {
      continue;
    }
    const absolutePath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      roots.push(...collectScenarioRoots(storyRoot, absolutePath));
      continue;
    }
    if (entry.isFile() && entry.name === "_scenario.md") {
      roots.push(path.relative(storyRoot, currentDir).replaceAll("\\", "/"));
    }
  }
  return roots.sort();
};

const buildAutoContinueChoice = (
  nodeId: string,
  nextNodeId: string,
): VnChoice => ({
  id: `AUTO_CONTINUE_${nodeId.toUpperCase()}`,
  text: "Continue",
  nextNodeId,
});

const validateLocaleDocument = (
  doc: ParsedMarkdownDocument,
  diagnostics: BlueprintDiagnostic[],
): void => {
  const logicBlock = extractLogicBlock(doc.body);
  if (logicBlock) {
    diagnostics.push(
      createDiagnostic({
        code: "LOCALE_LOGIC_FORBIDDEN",
        message: "Locale variants must not define vn-logic blocks",
        relativePath: doc.relativePath,
        line: 1,
        column: 1,
        severity: "error",
      }),
    );
  }

  for (const key of Object.keys(doc.frontmatter)) {
    if (!ALLOWED_LOCALE_FRONTMATTER_KEYS.has(key)) {
      diagnostics.push(
        createDiagnostic({
          code: "LOCALE_LOGIC_FORBIDDEN",
          message: `Locale frontmatter key '${key}' is not allowed`,
          relativePath: doc.relativePath,
          line: 1,
          column: 1,
          severity: "error",
        }),
      );
    }
  }

  if (
    /^##\s+(Choices|Logic|Preconditions|OnEnter|Passive Checks)\s*$/im.test(
      doc.body,
    )
  ) {
    diagnostics.push(
      createDiagnostic({
        code: "LOCALE_LOGIC_FORBIDDEN",
        message: "Locale variants must not define runtime logic sections",
        relativePath: doc.relativePath,
        line: 1,
        column: 1,
        severity: "error",
      }),
    );
  }
};

export const loadObsidianScenarioBundles = (
  storyRoot: string,
): ScenarioBlueprintProviderResult => {
  const diagnostics: BlueprintDiagnostic[] = [];
  const bundles: ScenarioBlueprintBundle[] = [];

  for (const scenarioRoot of collectScenarioRoots(storyRoot)) {
    try {
      const manifest = parseMarkdownDocument(
        storyRoot,
        `${scenarioRoot}/_scenario.md`,
      );
      const parsedManifest = parseScenarioManifest(manifest);
      const absoluteScenarioRoot = path.join(storyRoot, scenarioRoot);
      const sceneFiles = readdirSync(absoluteScenarioRoot, {
        withFileTypes: true,
      })
        .filter((entry) => entry.isFile() && SCENE_FILE_RE.test(entry.name))
        .map((entry) => entry.name)
        .sort();

      const canonicalFiles = sceneFiles.filter((entry) =>
        CANONICAL_FILE_RE.test(entry),
      );
      const localeFiles = sceneFiles.filter((entry) =>
        LOCALE_FILE_RE.test(entry),
      );
      const localeDocs = new Map<string, Map<string, ParsedMarkdownDocument>>();
      for (const localeFile of localeFiles) {
        const match = localeFile.match(LOCALE_FILE_RE);
        if (!match) {
          continue;
        }
        const canonicalId = match[1];
        const locale = match[2];
        const doc = parseMarkdownDocument(
          storyRoot,
          `${scenarioRoot}/${localeFile}`,
        );
        validateLocaleDocument(doc, diagnostics);
        const forScene =
          localeDocs.get(canonicalId) ??
          new Map<string, ParsedMarkdownDocument>();
        forScene.set(locale, doc);
        localeDocs.set(canonicalId, forScene);
      }

      const canonicalById = new Map<string, ParsedMarkdownDocument>();
      for (const fileName of canonicalFiles) {
        const doc = parseMarkdownDocument(
          storyRoot,
          `${scenarioRoot}/${fileName}`,
        );
        const basename = fileName.replace(/\.md$/, "");
        const id = asString(doc.frontmatter.id, {
          relativePath: doc.relativePath,
          field: "id",
        });
        if (id !== basename) {
          diagnostics.push(
            createDiagnostic({
              code: "UNKNOWN_ID",
              message: `Scene basename '${basename}' must match id '${id}'`,
              relativePath: doc.relativePath,
              line: 1,
              column: 1,
              severity: "error",
              scenarioId: parsedManifest.scenario.id,
              nodeId: id,
            }),
          );
        }
        if (canonicalById.has(id)) {
          diagnostics.push(
            createDiagnostic({
              code: "DUPLICATE_SCENE_ID",
              message: `Duplicate scene id '${id}'`,
              relativePath: doc.relativePath,
              line: 1,
              column: 1,
              severity: "error",
              scenarioId: parsedManifest.scenario.id,
              nodeId: id,
            }),
          );
          continue;
        }
        canonicalById.set(id, doc);
      }

      const nodes: NodeBlueprint[] = [];
      for (const sceneId of parsedManifest.scenario.nodeIds) {
        const canonical = canonicalById.get(sceneId);
        if (!canonical) {
          diagnostics.push(
            createDiagnostic({
              code: "MISSING_START_NODE",
              message: `scene_order references missing canonical scene '${sceneId}'`,
              relativePath: manifest.relativePath,
              line: 1,
              column: 1,
              severity: "error",
              scenarioId: parsedManifest.scenario.id,
              nodeId: sceneId,
            }),
          );
          continue;
        }

        const type = asString(canonical.frontmatter.type, {
          relativePath: canonical.relativePath,
          field: "type",
        });
        if (type !== "vn_scene") {
          diagnostics.push(
            createDiagnostic({
              code: "PARSE_ERROR",
              message: `Canonical scene '${sceneId}' must use type: vn_scene`,
              relativePath: canonical.relativePath,
              line: 1,
              column: 1,
              severity: "error",
              scenarioId: parsedManifest.scenario.id,
              nodeId: sceneId,
            }),
          );
          continue;
        }

        const status = asString(canonical.frontmatter.status, {
          relativePath: canonical.relativePath,
          field: "status",
        });
        if (status !== "active") {
          diagnostics.push(
            createDiagnostic({
              code: "SCENE_ORDER_MISMATCH",
              message: `scene_order references non-active scene '${sceneId}'`,
              relativePath: canonical.relativePath,
              line: 1,
              column: 1,
              severity: "error",
              scenarioId: parsedManifest.scenario.id,
              nodeId: sceneId,
            }),
          );
          continue;
        }

        extractHeading(canonical.body, canonical.relativePath);
        const scriptSection = findSection(canonical.body, "Script");
        if (!scriptSection) {
          diagnostics.push(
            createDiagnostic({
              code: "PARSE_ERROR",
              message: "Canonical scene must contain a ## Script section",
              relativePath: canonical.relativePath,
              line: 1,
              column: 1,
              severity: "error",
              scenarioId: parsedManifest.scenario.id,
              nodeId: sceneId,
            }),
          );
          continue;
        }

        const logicBlock = extractLogicBlock(canonical.body);
        if (!logicBlock) {
          diagnostics.push(
            createDiagnostic({
              code: "PARSE_ERROR",
              message: "Canonical scene must contain a vn-logic fenced block",
              relativePath: canonical.relativePath,
              line: 1,
              column: 1,
              severity: "error",
              scenarioId: parsedManifest.scenario.id,
              nodeId: sceneId,
            }),
          );
          continue;
        }

        const parsedLogic = parseYamlRecord(
          logicBlock,
          canonical.relativePath,
          "PARSE_ERROR",
        );
        const nextNodeId = asOptionalString(parsedLogic.next);
        const choices =
          parsedLogic.choices === undefined
            ? []
            : (() => {
                if (!Array.isArray(parsedLogic.choices)) {
                  throw createDiagnostic({
                    code: "PARSE_ERROR",
                    message: "choices must be an array",
                    relativePath: canonical.relativePath,
                    line: 1,
                    column: 1,
                    severity: "error",
                    scenarioId: parsedManifest.scenario.id,
                    nodeId: sceneId,
                  });
                }
                return parsedLogic.choices.map((entry) =>
                  parseChoice(entry, canonical.relativePath),
                );
              })();

        if (nextNodeId && choices.length > 0) {
          diagnostics.push(
            createDiagnostic({
              code: "PARSE_ERROR",
              message: "A scene cannot define both next and choices",
              relativePath: canonical.relativePath,
              line: 1,
              column: 1,
              severity: "error",
              scenarioId: parsedManifest.scenario.id,
              nodeId: sceneId,
            }),
          );
        }

        const sourcePathByLocale: Record<string, string> = {};
        const localizedVariants = localeDocs.get(sceneId) ?? new Map();
        for (const locale of parsedManifest.supportedLocales) {
          if (locale === parsedManifest.defaultLocale) {
            sourcePathByLocale[locale] = `${scenarioRoot}/${path.basename(
              canonical.relativePath,
            )}`;
            continue;
          }
          const localeDoc = localizedVariants.get(locale);
          if (!localeDoc) {
            diagnostics.push(
              createDiagnostic({
                code: "MISSING_LOCALE_VARIANT",
                message: `Missing locale variant '${locale}' for scene '${sceneId}'`,
                relativePath: canonical.relativePath,
                line: 1,
                column: 1,
                severity: "warning",
                scenarioId: parsedManifest.scenario.id,
                nodeId: sceneId,
              }),
            );
            continue;
          }
          extractHeading(localeDoc.body, localeDoc.relativePath);
          if (extractLocaleBody(localeDoc.body).length === 0) {
            diagnostics.push(
              createDiagnostic({
                code: "PARSE_ERROR",
                message: `Locale variant '${locale}' must contain narrative text`,
                relativePath: localeDoc.relativePath,
                line: 1,
                column: 1,
                severity: "error",
                scenarioId: parsedManifest.scenario.id,
                nodeId: sceneId,
              }),
            );
          }
          sourcePathByLocale[locale] = localeDoc.relativePath;
        }

        nodes.push({
          id: sceneId,
          scenarioId: parsedManifest.scenario.id,
          sourcePath: canonical.relativePath,
          defaultLocale: parsedManifest.defaultLocale,
          sourcePathByLocale,
          backgroundUrl: asOptionalString(canonical.frontmatter.background_url),
          characterId: asOptionalString(canonical.frontmatter.character_id),
          voicePresenceMode: asOptionalString(
            canonical.frontmatter.voice_presence_mode,
          ) as NodeBlueprint["voicePresenceMode"],
          activeSpeakers:
            canonical.frontmatter.active_speakers === undefined
              ? undefined
              : asStringArray(canonical.frontmatter.active_speakers, {
                  relativePath: canonical.relativePath,
                  field: "active_speakers",
                }),
          terminal: asOptionalBoolean(parsedLogic.terminal),
          choices:
            choices.length > 0
              ? choices
              : nextNodeId
                ? [buildAutoContinueChoice(sceneId, nextNodeId)]
                : [],
          preconditions: parseConditionList(
            parsedLogic.preconditions,
            canonical.relativePath,
          ),
          onEnter: parseEffectList(
            parsedLogic.on_enter,
            canonical.relativePath,
          ),
          passiveChecks:
            parsedLogic.passive_checks === undefined
              ? undefined
              : ((() => {
                  if (!Array.isArray(parsedLogic.passive_checks)) {
                    throw createDiagnostic({
                      code: "PARSE_ERROR",
                      message: "passive_checks must be an array",
                      relativePath: canonical.relativePath,
                      line: 1,
                      column: 1,
                      severity: "error",
                      scenarioId: parsedManifest.scenario.id,
                      nodeId: sceneId,
                    });
                  }
                  return parsedLogic.passive_checks.map((entry) =>
                    parseSkillCheck(entry, canonical.relativePath),
                  );
                })()?.filter(Boolean) as VnSkillCheck[] | undefined),
        });
      }

      for (const [sceneId, doc] of canonicalById.entries()) {
        if (!parsedManifest.scenario.nodeIds.includes(sceneId)) {
          diagnostics.push(
            createDiagnostic({
              code: "ORPHAN_SCENE_FILE",
              message: `Active canonical scene '${sceneId}' is not listed in scene_order`,
              relativePath: doc.relativePath,
              line: 1,
              column: 1,
              severity: "warning",
              scenarioId: parsedManifest.scenario.id,
              nodeId: sceneId,
            }),
          );
        }
      }

      bundles.push({
        providerName: PROVIDER_NAME,
        migrationMode: parsedManifest.migrationMode,
        scenario: parsedManifest.scenario,
        nodes,
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        "severity" in error &&
        "relativePath" in error
      ) {
        diagnostics.push(error as BlueprintDiagnostic);
        continue;
      }
      throw error;
    }
  }

  return { bundles, diagnostics };
};
