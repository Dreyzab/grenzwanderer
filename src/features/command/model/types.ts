export type CommandTab = "map" | "vn";

export type CommandPhase =
  | "briefing"
  | "orders"
  | "resolving"
  | "result"
  | "closed";

export type CommandMemberAvailability = "available" | "locked";

export interface CommandActor {
  actorId: string;
  label: string;
  role: string;
  availability: CommandMemberAvailability;
  trust: number;
  notes?: string | null;
  sortOrder: number;
}

export interface CommandOrder {
  id: string;
  actorId: string;
  label: string;
  description: string;
  effectPreview: string;
  disabled: boolean;
  disabledReason?: string;
}

export interface CommandOutcome {
  title: string;
  summary: string;
}

export interface CommandModeTrigger {
  scenarioId: string;
  returnTab: CommandTab;
}
