export type BattleCardEffectTarget = "self" | "opponent";

export type BattleCardEffect =
  | {
      type: "damage_resolve";
      amount: number;
      target: BattleCardEffectTarget;
    }
  | {
      type: "gain_block";
      amount: number;
      target: BattleCardEffectTarget;
    }
  | {
      type: "heal_resolve";
      amount: number;
      target: BattleCardEffectTarget;
    }
  | {
      type: "draw_cards";
      amount: number;
      target: "self";
    }
  | {
      type: "gain_ap";
      amount: number;
      target: "self";
    }
  | {
      type: "apply_status";
      statusId: string;
      label: string;
      amount: number;
      durationTurns: number;
      target: BattleCardEffectTarget;
    };

export interface BattleCardDefinition {
  id: string;
  label: string;
  description: string;
  costAp: number;
  effectPreview: string;
  effects: readonly BattleCardEffect[];
  tags?: readonly string[];
  artUrl?: string;
}

type BattleOutcomeEffect =
  | { type: "set_flag"; key: string; value: boolean }
  | { type: "grant_xp"; amount: number };

export interface BattleScenarioTemplate {
  id: string;
  title: string;
  briefing: string;
  backgroundUrl?: string;
  labels: {
    resolve: string;
    ap: string;
    block: string;
  };
  player: {
    combatantId: string;
    label: string;
    subtitle?: string;
    portraitUrl?: string;
    startingResolve: number;
    maxAp: number;
    openingHand: number;
    drawPerTurn: number;
    deck: readonly string[];
  };
  enemy: {
    combatantId: string;
    label: string;
    subtitle?: string;
    portraitUrl?: string;
    startingResolve: number;
    intentSequence: readonly string[];
  };
  outcomes: {
    victory: {
      title: string;
      summary: string;
      effects: readonly BattleOutcomeEffect[];
    };
    defeat: {
      title: string;
      summary: string;
      effects: readonly BattleOutcomeEffect[];
    };
  };
}

const BATTLE_CARDS: readonly BattleCardDefinition[] = [
  {
    id: "card_pointed_question",
    label: "Pointed Question",
    description: "Pin Friedrich to a detail he cannot wave away.",
    costAp: 1,
    effectPreview: "Deal 4 resolve damage.",
    effects: [{ type: "damage_resolve", amount: 4, target: "opponent" }],
    tags: ["pressure"],
  },
  {
    id: "card_steady_stance",
    label: "Steady Stance",
    description: "Hold the room long enough to blunt the next counter.",
    costAp: 1,
    effectPreview: "Gain 5 block.",
    effects: [{ type: "gain_block", amount: 5, target: "self" }],
    tags: ["stance"],
  },
  {
    id: "card_center_self",
    label: "Center Yourself",
    description: "Recover your composure before the next exchange.",
    costAp: 1,
    effectPreview: "Heal 3 resolve.",
    effects: [{ type: "heal_resolve", amount: 3, target: "self" }],
    tags: ["composure"],
  },
  {
    id: "card_expose_pattern",
    label: "Expose the Pattern",
    description: "Link one inconsistency to the next and stay on the offensive.",
    costAp: 2,
    effectPreview: "Deal 3 resolve damage and draw 1 card.",
    effects: [
      { type: "damage_resolve", amount: 3, target: "opponent" },
      { type: "draw_cards", amount: 1, target: "self" },
    ],
    tags: ["pressure", "draw"],
  },
  {
    id: "card_press_advantage",
    label: "Press the Advantage",
    description: "Use the room's doubt to keep the tempo on your side.",
    costAp: 2,
    effectPreview: "Deal 6 resolve damage.",
    effects: [{ type: "damage_resolve", amount: 6, target: "opponent" }],
    tags: ["pressure"],
  },
  {
    id: "card_reframe_narrative",
    label: "Reframe the Narrative",
    description: "Take control of the exchange and create another opening.",
    costAp: 1,
    effectPreview: "Gain 1 AP and 3 block.",
    effects: [
      { type: "gain_ap", amount: 1, target: "self" },
      { type: "gain_block", amount: 3, target: "self" },
    ],
    tags: ["tempo", "stance"],
  },
  {
    id: "card_enemy_smug_rebuttal",
    label: "Smug Rebuttal",
    description: "Friedrich swats away the accusation with practiced contempt.",
    costAp: 0,
    effectPreview: "Deal 4 resolve damage.",
    effects: [{ type: "damage_resolve", amount: 4, target: "opponent" }],
  },
  {
    id: "card_enemy_closed_posture",
    label: "Closed Posture",
    description: "He folds inward and lets the room shield him.",
    costAp: 0,
    effectPreview: "Gain 4 block.",
    effects: [{ type: "gain_block", amount: 4, target: "self" }],
  },
  {
    id: "card_enemy_needle_the_wound",
    label: "Needle the Wound",
    description: "He strikes at your uncertainty to keep you off balance.",
    costAp: 0,
    effectPreview: "Deal 3 resolve damage and gain 2 block.",
    effects: [
      { type: "damage_resolve", amount: 3, target: "opponent" },
      { type: "gain_block", amount: 2, target: "self" },
    ],
  },
  {
    id: "card_enemy_desperate_lunge",
    label: "Desperate Lunge",
    description: "A sloppy final push when the pressure starts to close in.",
    costAp: 0,
    effectPreview: "Deal 5 resolve damage.",
    effects: [{ type: "damage_resolve", amount: 5, target: "opponent" }],
  },
];

const BATTLE_SCENARIOS: readonly BattleScenarioTemplate[] = [
  {
    id: "sandbox_son_duel",
    title: "Casino Confrontation",
    briefing:
      "Friedrich tries to bluff his way past the ledger trail. Break his composure before the room turns on you instead.",
    backgroundUrl: "/images/scenes/scene_casino_duel.png",
    labels: {
      resolve: "Resolve",
      ap: "Pressure",
      block: "Stance",
    },
    player: {
      combatantId: "detective",
      label: "Detective",
      startingResolve: 24,
      maxAp: 3,
      openingHand: 5,
      drawPerTurn: 2,
      deck: [
        "card_pointed_question",
        "card_steady_stance",
        "card_center_self",
        "card_expose_pattern",
        "card_pointed_question",
        "card_reframe_narrative",
        "card_press_advantage",
        "card_pointed_question",
      ],
    },
    enemy: {
      combatantId: "friedrich_richter",
      label: "Friedrich Richter",
      subtitle: "Banker's son",
      startingResolve: 18,
      intentSequence: [
        "card_enemy_smug_rebuttal",
        "card_enemy_closed_posture",
        "card_enemy_needle_the_wound",
        "card_enemy_desperate_lunge",
      ],
    },
    outcomes: {
      victory: {
        title: "Friedrich Buckles",
        summary:
          "The room sees the bluff collapse. Friedrich loses his footing and the confrontation shifts back into your control.",
        effects: [
          { type: "set_flag", key: "son_duel_done", value: true },
          { type: "set_flag", key: "son_duel_won", value: true },
          { type: "set_flag", key: "son_duel_lost", value: false },
          { type: "grant_xp", amount: 50 },
        ],
      },
      defeat: {
        title: "You Yield Ground",
        summary:
          "Friedrich steals the momentum, but the truth is still close enough to force a fail-forward fallout scene.",
        effects: [
          { type: "set_flag", key: "son_duel_done", value: true },
          { type: "set_flag", key: "son_duel_won", value: false },
          { type: "set_flag", key: "son_duel_lost", value: true },
          { type: "grant_xp", amount: 50 },
        ],
      },
    },
  },
];

export const getBattleCard = (cardId: string): BattleCardDefinition => {
  const card = BATTLE_CARDS.find((entry) => entry.id === cardId);
  if (!card) {
    throw new Error(`Unknown battle card ${cardId}`);
  }
  return card;
};

export const getBattleScenario = (
  scenarioId: string,
): BattleScenarioTemplate => {
  const scenario = BATTLE_SCENARIOS.find((entry) => entry.id === scenarioId);
  if (!scenario) {
    throw new Error(`Unknown battle scenario ${scenarioId}`);
  }
  return scenario;
};
