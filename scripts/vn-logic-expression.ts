import type { PsycheAxis } from "../data/innerVoiceContract";
import type {
  AgencyServiceCriterionId,
  MindThoughtState,
  RumorStateStatus,
  RumorVerificationKind,
  SightMode,
  SpiritState,
  VnCondition,
  VnEffect,
} from "../src/features/vn/types";

type ScalarValue = boolean | number | string;

type CallNode = {
  name: string;
  args: Array<ScalarValue | CallNode>;
};

export class VnLogicExpressionError extends Error {
  readonly line: number;
  readonly column: number;

  constructor(message: string, line: number, column: number) {
    super(message);
    this.line = line;
    this.column = column;
  }
}

const isIdentifierStart = (char: string): boolean => /[A-Za-z_]/.test(char);
const isIdentifierChar = (char: string): boolean => /[A-Za-z0-9_]/.test(char);

class ExpressionParser {
  private readonly input: string;
  private index = 0;
  private line = 1;
  private column = 1;

  constructor(input: string) {
    this.input = input.trim();
  }

  parseCall(): CallNode {
    this.skipWhitespace();
    const node = this.parseCallNode();
    this.skipWhitespace();
    if (!this.isEof()) {
      this.fail(`Unexpected token '${this.peek()}'`);
    }
    return node;
  }

  private parseCallNode(): CallNode {
    const name = this.parseIdentifier();
    this.skipWhitespace();
    this.expect("(");

    const args: Array<ScalarValue | CallNode> = [];
    this.skipWhitespace();
    if (this.peek() === ")") {
      this.advance();
      return { name, args };
    }

    while (!this.isEof()) {
      args.push(this.parseArgument());
      this.skipWhitespace();
      const next = this.peek();
      if (next === ",") {
        this.advance();
        this.skipWhitespace();
        continue;
      }
      if (next === ")") {
        this.advance();
        return { name, args };
      }
      this.fail("Expected ',' or ')'");
    }

    this.fail("Unterminated function call");
  }

  private parseArgument(): ScalarValue | CallNode {
    this.skipWhitespace();
    const next = this.peek();
    if (next === `"` || next === `'`) {
      return this.parseQuotedString();
    }
    if (next === "-" || /[0-9]/.test(next)) {
      return this.parseNumber();
    }
    if (!isIdentifierStart(next)) {
      this.fail(`Unexpected token '${next || "EOF"}'`);
    }

    const startIndex = this.index;
    const identifier = this.parseIdentifier();
    this.skipWhitespace();
    if (this.peek() === "(") {
      this.index = startIndex;
      this.recomputePosition();
      return this.parseCallNode();
    }
    if (identifier === "true") {
      return true;
    }
    if (identifier === "false") {
      return false;
    }
    return identifier;
  }

  private recomputePosition(): void {
    this.line = 1;
    this.column = 1;
    for (let cursor = 0; cursor < this.index; cursor += 1) {
      if (this.input[cursor] === "\n") {
        this.line += 1;
        this.column = 1;
      } else {
        this.column += 1;
      }
    }
  }

  private parseQuotedString(): string {
    const quote = this.peek();
    this.expect(quote);
    let value = "";
    while (!this.isEof()) {
      const char = this.peek();
      this.advance();
      if (char === quote) {
        return value;
      }
      if (char === "\\") {
        const escaped = this.peek();
        if (!escaped) {
          this.fail("Unterminated escape sequence");
        }
        this.advance();
        value += escaped;
        continue;
      }
      value += char;
    }

    this.fail("Unterminated string literal");
  }

  private parseNumber(): number {
    const start = this.index;
    if (this.peek() === "-") {
      this.advance();
    }
    while (/[0-9]/.test(this.peek())) {
      this.advance();
    }
    if (this.peek() === ".") {
      this.advance();
      while (/[0-9]/.test(this.peek())) {
        this.advance();
      }
    }
    const numeric = Number(this.input.slice(start, this.index));
    if (!Number.isFinite(numeric)) {
      this.fail("Invalid numeric literal");
    }
    return numeric;
  }

  private parseIdentifier(): string {
    const start = this.peek();
    if (!isIdentifierStart(start)) {
      this.fail(`Expected identifier, received '${start || "EOF"}'`);
    }

    const from = this.index;
    this.advance();
    while (isIdentifierChar(this.peek())) {
      this.advance();
    }

    return this.input.slice(from, this.index);
  }

  private skipWhitespace(): void {
    while (/\s/.test(this.peek())) {
      this.advance();
    }
  }

  private expect(char: string): void {
    if (this.peek() !== char) {
      this.fail(`Expected '${char}'`);
    }
    this.advance();
  }

  private peek(): string {
    return this.input[this.index] ?? "";
  }

  private advance(): void {
    const char = this.input[this.index];
    this.index += 1;
    if (char === "\n") {
      this.line += 1;
      this.column = 1;
    } else {
      this.column += 1;
    }
  }

  private isEof(): boolean {
    return this.index >= this.input.length;
  }

  private fail(message: string): never {
    throw new VnLogicExpressionError(message, this.line, this.column);
  }
}

const normalizeOperatorName = (value: string): string =>
  value.trim().toLowerCase();

const asString = (value: ScalarValue | CallNode, context: string): string => {
  if (typeof value !== "string") {
    throw new Error(`${context} must be a string identifier`);
  }
  return value;
};

const asNumber = (value: ScalarValue | CallNode, context: string): number => {
  if (typeof value !== "number") {
    throw new Error(`${context} must be a number`);
  }
  return value;
};

const asBoolean = (value: ScalarValue | CallNode, context: string): boolean => {
  if (typeof value !== "boolean") {
    throw new Error(`${context} must be a boolean`);
  }
  return value;
};

const asCall = (value: ScalarValue | CallNode, context: string): CallNode => {
  if (typeof value === "object" && value !== null && "name" in value) {
    return value;
  }
  throw new Error(`${context} must be a nested function call`);
};

const parseConditionCall = (node: CallNode): VnCondition => {
  const name = normalizeOperatorName(node.name);
  if (name === "and" || name === "logic_and") {
    if (node.args.length === 0) {
      throw new Error("logic_and requires at least one nested condition");
    }
    return {
      type: "logic_and",
      conditions: node.args.map((arg, index) =>
        parseConditionCall(asCall(arg, `logic_and arg ${index + 1}`)),
      ),
    };
  }
  if (name === "or" || name === "logic_or") {
    if (node.args.length === 0) {
      throw new Error("logic_or requires at least one nested condition");
    }
    return {
      type: "logic_or",
      conditions: node.args.map((arg, index) =>
        parseConditionCall(asCall(arg, `logic_or arg ${index + 1}`)),
      ),
    };
  }
  if (name === "not" || name === "logic_not") {
    if (node.args.length !== 1) {
      throw new Error("logic_not requires exactly one nested condition");
    }
    return {
      type: "logic_not",
      condition: parseConditionCall(asCall(node.args[0], "logic_not arg 1")),
    };
  }

  switch (name) {
    case "flag_equals":
      return {
        type: "flag_equals",
        key: asString(node.args[0], "flag_equals key"),
        value: asBoolean(node.args[1], "flag_equals value"),
      };
    case "var_gte":
      return {
        type: "var_gte",
        key: asString(node.args[0], "var_gte key"),
        value: asNumber(node.args[1], "var_gte value"),
      };
    case "var_lte":
      return {
        type: "var_lte",
        key: asString(node.args[0], "var_lte key"),
        value: asNumber(node.args[1], "var_lte value"),
      };
    case "has_evidence":
      return {
        type: "has_evidence",
        evidenceId: asString(node.args[0], "has_evidence evidenceId"),
      };
    case "quest_stage_gte":
      return {
        type: "quest_stage_gte",
        questId: asString(node.args[0], "quest_stage_gte questId"),
        stage: asNumber(node.args[1], "quest_stage_gte stage"),
      };
    case "relationship_gte":
      return {
        type: "relationship_gte",
        characterId: asString(node.args[0], "relationship_gte characterId"),
        value: asNumber(node.args[1], "relationship_gte value"),
      };
    case "has_item":
      return {
        type: "has_item",
        itemId: asString(node.args[0], "has_item itemId"),
      };
    case "favor_balance_gte":
      return {
        type: "favor_balance_gte",
        npcId: asString(node.args[0], "favor_balance_gte npcId"),
        value: asNumber(node.args[1], "favor_balance_gte value"),
      };
    case "agency_standing_gte":
      return {
        type: "agency_standing_gte",
        value: asNumber(node.args[0], "agency_standing_gte value"),
      };
    case "rumor_state_is":
      return {
        type: "rumor_state_is",
        rumorId: asString(node.args[0], "rumor_state_is rumorId"),
        status: asString(
          node.args[1],
          "rumor_state_is status",
        ) as RumorStateStatus,
      };
    case "hypothesis_focus_is":
      return {
        type: "hypothesis_focus_is",
        caseId: asString(node.args[0], "hypothesis_focus_is caseId"),
        hypothesisId: asString(
          node.args[1],
          "hypothesis_focus_is hypothesisId",
        ),
      };
    case "thought_state_is":
      return {
        type: "thought_state_is",
        thoughtId: asString(node.args[0], "thought_state_is thoughtId"),
        state: asString(
          node.args[1],
          "thought_state_is state",
        ) as MindThoughtState,
      };
    case "career_rank_gte":
      return {
        type: "career_rank_gte",
        rankId: asString(node.args[0], "career_rank_gte rankId"),
      };
    case "voice_level_gte":
      return {
        type: "voice_level_gte",
        voiceId: asString(node.args[0], "voice_level_gte voiceId"),
        value: asNumber(node.args[1], "voice_level_gte value"),
      };
    case "spirit_state_is":
      return {
        type: "spirit_state_is",
        spiritId: asString(node.args[0], "spirit_state_is spiritId"),
        state: asString(node.args[1], "spirit_state_is state") as SpiritState,
      };
    case "has_controlled_spirit":
      return {
        type: "has_controlled_spirit",
        entityArchetypeId: asString(
          node.args[0],
          "has_controlled_spirit entityArchetypeId",
        ),
      };
    default:
      throw new Error(`Unknown condition operator '${node.name}'`);
  }
};

const parseEffectCall = (node: CallNode): VnEffect => {
  const name = normalizeOperatorName(node.name);
  switch (name) {
    case "set_flag":
      return {
        type: "set_flag",
        key: asString(node.args[0], "set_flag key"),
        value: asBoolean(node.args[1], "set_flag value"),
      };
    case "set_var":
      return {
        type: "set_var",
        key: asString(node.args[0], "set_var key"),
        value: asNumber(node.args[1], "set_var value"),
      };
    case "add_var":
      return {
        type: "add_var",
        key: asString(node.args[0], "add_var key"),
        value: asNumber(node.args[1], "add_var value"),
      };
    case "travel_to":
      return {
        type: "travel_to",
        locationId: asString(node.args[0], "travel_to locationId"),
      };
    case "open_command_mode":
      return {
        type: "open_command_mode",
        scenarioId: asString(node.args[0], "open_command_mode scenarioId"),
        returnTab:
          node.args[1] === undefined
            ? undefined
            : (asString(node.args[1], "open_command_mode returnTab") as
                | "map"
                | "vn"),
      };
    case "open_battle_mode":
      return {
        type: "open_battle_mode",
        scenarioId: asString(node.args[0], "open_battle_mode scenarioId"),
        returnTab:
          node.args[1] === undefined
            ? undefined
            : (asString(node.args[1], "open_battle_mode returnTab") as
                | "map"
                | "vn"),
      };
    case "spawn_map_event":
      return {
        type: "spawn_map_event",
        templateId: asString(node.args[0], "spawn_map_event templateId"),
        ttlMinutes:
          node.args[1] === undefined
            ? undefined
            : asNumber(node.args[1], "spawn_map_event ttlMinutes"),
      };
    case "track_event":
      return {
        type: "track_event",
        eventName: asString(node.args[0], "track_event eventName"),
        value:
          typeof node.args[1] === "number"
            ? asNumber(node.args[1], "track_event value")
            : undefined,
      };
    case "discover_fact":
      return {
        type: "discover_fact",
        caseId: asString(node.args[0], "discover_fact caseId"),
        factId: asString(node.args[1], "discover_fact factId"),
      };
    case "unlock_mind_thought":
      return {
        type: "unlock_mind_thought",
        thoughtId: asString(node.args[0], "unlock_mind_thought thoughtId"),
      };
    case "grant_xp":
      return {
        type: "grant_xp",
        amount: asNumber(node.args[0], "grant_xp amount"),
      };
    case "unlock_group":
      return {
        type: "unlock_group",
        groupId: asString(node.args[0], "unlock_group groupId"),
      };
    case "set_quest_stage":
      return {
        type: "set_quest_stage",
        questId: asString(node.args[0], "set_quest_stage questId"),
        stage: asNumber(node.args[1], "set_quest_stage stage"),
      };
    case "change_relationship":
      return {
        type: "change_relationship",
        characterId: asString(node.args[0], "change_relationship characterId"),
        delta: asNumber(node.args[1], "change_relationship delta"),
      };
    case "change_favor_balance":
      return {
        type: "change_favor_balance",
        npcId: asString(node.args[0], "change_favor_balance npcId"),
        delta: asNumber(node.args[1], "change_favor_balance delta"),
        reason:
          node.args[2] === undefined
            ? undefined
            : asString(node.args[2], "change_favor_balance reason"),
      };
    case "change_agency_standing":
      return {
        type: "change_agency_standing",
        delta: asNumber(node.args[0], "change_agency_standing delta"),
        reason:
          node.args[1] === undefined
            ? undefined
            : asString(node.args[1], "change_agency_standing reason"),
      };
    case "change_faction_signal":
      return {
        type: "change_faction_signal",
        factionId: asString(node.args[0], "change_faction_signal factionId"),
        delta: asNumber(node.args[1], "change_faction_signal delta"),
        reason:
          node.args[2] === undefined
            ? undefined
            : asString(node.args[2], "change_faction_signal reason"),
      };
    case "register_rumor":
      return {
        type: "register_rumor",
        rumorId: asString(node.args[0], "register_rumor rumorId"),
      };
    case "verify_rumor":
      return {
        type: "verify_rumor",
        rumorId: asString(node.args[0], "verify_rumor rumorId"),
        verificationKind: asString(
          node.args[1],
          "verify_rumor verificationKind",
        ) as RumorVerificationKind,
      };
    case "record_service_criterion":
      return {
        type: "record_service_criterion",
        criterionId: asString(
          node.args[0],
          "record_service_criterion criterionId",
        ) as AgencyServiceCriterionId,
      };
    case "grant_evidence":
      return {
        type: "grant_evidence",
        evidenceId: asString(node.args[0], "grant_evidence evidenceId"),
      };
    case "grant_item":
      return {
        type: "grant_item",
        itemId: asString(node.args[0], "grant_item itemId"),
        quantity: asNumber(node.args[1], "grant_item quantity"),
      };
    case "add_heat":
      return {
        type: "add_heat",
        amount: asNumber(node.args[0], "add_heat amount"),
      };
    case "add_tension":
      return {
        type: "add_tension",
        amount: asNumber(node.args[0], "add_tension amount"),
      };
    case "grant_influence":
      return {
        type: "grant_influence",
        amount: asNumber(node.args[0], "grant_influence amount"),
      };
    case "shift_awakening":
      return {
        type: "shift_awakening",
        amount: asNumber(node.args[0], "shift_awakening amount"),
        exposureDelta:
          node.args[1] === undefined
            ? undefined
            : asNumber(node.args[1], "shift_awakening exposureDelta"),
      };
    case "record_entity_observation":
      return {
        type: "record_entity_observation",
        observationId: asString(
          node.args[0],
          "record_entity_observation observationId",
        ),
        entityArchetypeId:
          node.args[1] === undefined
            ? undefined
            : asString(
                node.args[1],
                "record_entity_observation entityArchetypeId",
              ),
      };
    case "unlock_distortion_point":
      return {
        type: "unlock_distortion_point",
        pointId: asString(node.args[0], "unlock_distortion_point pointId"),
      };
    case "set_sight_mode":
      return {
        type: "set_sight_mode",
        mode: asString(node.args[0], "set_sight_mode mode") as SightMode,
      };
    case "apply_rationalist_buffer":
      return {
        type: "apply_rationalist_buffer",
        amount: asNumber(node.args[0], "apply_rationalist_buffer amount"),
      };
    case "tag_entity_signature":
      return {
        type: "tag_entity_signature",
        signatureId: asString(node.args[0], "tag_entity_signature signatureId"),
      };
    case "change_psyche_axis":
      return {
        type: "change_psyche_axis",
        axis: asString(node.args[0], "change_psyche_axis axis") as PsycheAxis,
        delta: asNumber(node.args[1], "change_psyche_axis delta"),
      };
    case "subjugate_spirit":
      return {
        type: "subjugate_spirit",
        spiritId: asString(node.args[0], "subjugate_spirit spiritId"),
      };
    case "destroy_spirit":
      return {
        type: "destroy_spirit",
        spiritId: asString(node.args[0], "destroy_spirit spiritId"),
      };
    case "imprison_spirit":
      return {
        type: "imprison_spirit",
        spiritId: asString(node.args[0], "imprison_spirit spiritId"),
        requiredItemId:
          node.args[1] === undefined
            ? undefined
            : asString(node.args[1], "imprison_spirit requiredItemId"),
      };
    case "release_spirit":
      return {
        type: "release_spirit",
        spiritId: asString(node.args[0], "release_spirit spiritId"),
      };
    default:
      throw new Error(`Unknown effect operator '${node.name}'`);
  }
};

export const parseConditionExpression = (input: string): VnCondition =>
  parseConditionCall(new ExpressionParser(input).parseCall());

export const parseEffectExpression = (input: string): VnEffect =>
  parseEffectCall(new ExpressionParser(input).parseCall());
