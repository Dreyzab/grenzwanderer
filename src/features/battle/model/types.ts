export type BattleTab =
  | "home"
  | "vn"
  | "character"
  | "map"
  | "mind_palace"
  | "dev"
  | "command"
  | "battle";

export type BattleReturnTab = "map" | "vn" | "dev";

export type BattlePhase = "player_turn" | "enemy_turn" | "result" | "closed";

export interface BattleOutcome {
  resultType: "victory" | "defeat";
  title: string;
  summary: string;
}

export interface BattleCombatantView {
  combatantId: string;
  side: "player" | "enemy";
  label: string;
  subtitle?: string | null;
  portraitUrl?: string | null;
  resolve: number;
  maxResolve: number;
  ap: number;
  maxAp: number;
  block: number;
  nextIntentLabel?: string | null;
  nextIntentSummary?: string | null;
}

export interface BattleCardView {
  instanceId: string;
  label: string;
  description: string;
  effectPreview: string;
  costAp: number;
  zoneOrder: number;
  isPlayable: boolean;
  playableReason?: string | null;
}
