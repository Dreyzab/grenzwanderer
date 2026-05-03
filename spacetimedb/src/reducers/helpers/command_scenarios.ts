import { SenderError } from "spacetimedb/server";

import type { VnEffect } from "../../../../src/shared/vn-contract";

export type CommandMemberAvailability = "available" | "locked";

interface CommandActorTemplate {
  actorId: string;
  label: string;
  role: string;
  notes?: string;
  sortOrder: number;
  trustCharacterId?: string;
  alwaysAvailable?: boolean;
  unlockFlag?: string;
  minimumRelationship?: {
    characterId: string;
    value: number;
  };
}

interface CommandOrderTemplate {
  id: string;
  actorId: string;
  label: string;
  description: string;
  effectPreview: string;
  resultTitle: string;
  resultSummary: string;
  effects: VnEffect[];
}

export interface CommandScenarioTemplate {
  id: string;
  title: string;
  briefing: string;
  actors: readonly CommandActorTemplate[];
  orders: readonly CommandOrderTemplate[];
}

export interface CommandActorPresentation {
  actorId: string;
  label: string;
  role: string;
  availability: CommandMemberAvailability;
  trust: number;
  notes?: string;
  sortOrder: number;
}

export interface CommandOrderPresentation {
  id: string;
  actorId: string;
  label: string;
  description: string;
  effectPreview: string;
  disabled: boolean;
  disabledReason?: string;
}

const COMMAND_SCENARIOS: readonly CommandScenarioTemplate[] = [
  {
    id: "agency_evening_briefing",
    title: "Agency Evening Briefing",
    briefing:
      "The bureau has three leads that can be pursued before dawn. You only have time to commit one operative package before the city shutters its archives and telegraph offices.",
    actors: [
      {
        actorId: "inspector",
        label: "Inspector",
        role: "Field Lead",
        notes: "Always available to execute direct surveillance orders.",
        sortOrder: 0,
        alwaysAvailable: true,
      },
      {
        actorId: "npc_anna_mahler",
        label: "Anna Mahler",
        role: "Informant",
        notes:
          "Unlocks once Anna has been met or her trust has started to move.",
        sortOrder: 1,
        trustCharacterId: "npc_anna_mahler",
        unlockFlag: "met_anna_intro",
        minimumRelationship: {
          characterId: "npc_anna_mahler",
          value: 1,
        },
      },
      {
        actorId: "npc_archivist_otto",
        label: "Archivist Otto",
        role: "Records Specialist",
        notes: "Requires a standing connection to the Rathaus archives.",
        sortOrder: 2,
        trustCharacterId: "npc_archivist_otto",
        unlockFlag: "archive_pass_granted",
        minimumRelationship: {
          characterId: "npc_archivist_otto",
          value: 1,
        },
      },
    ],
    orders: [
      {
        id: "deploy_inspector_watch",
        actorId: "inspector",
        label: "Deploy Night Watch",
        description:
          "Place the inspector on a fixed surveillance route near the station quarter.",
        effectPreview:
          "Reveal a fresh investigative angle and bank experience.",
        resultTitle: "Night Watch Assigned",
        resultSummary:
          "The inspector locks down the station quarter and marks suspicious traffic before dawn.",
        effects: [
          { type: "set_flag", key: "command_watch_assigned", value: true },
          { type: "grant_xp", amount: 5 },
        ],
      },
      {
        id: "request_anna_network",
        actorId: "npc_anna_mahler",
        label: "Tap Anna's Network",
        description:
          "Ask Anna to circulate questions through her café and messenger routes.",
        effectPreview: "Gain a rumor lead and deepen Anna's trust.",
        resultTitle: "Anna Activates Her Network",
        resultSummary:
          "Anna puts her quiet channels to work and sends back a tighter rumor net before first light.",
        effects: [
          { type: "set_flag", key: "command_anna_network_ready", value: true },
          { type: "register_rumor", rumorId: "rumor_bank_rail_yard" },
          {
            type: "record_service_criterion",
            criterionId: "preserved_source_network",
          },
          {
            type: "change_relationship",
            characterId: "npc_anna_mahler",
            delta: 1,
          },
        ],
      },
      {
        id: "pull_archive_packet",
        actorId: "npc_archivist_otto",
        label: "Pull Archive Packet",
        description:
          "Have Otto prepare registry extracts and compare sealed filing movements.",
        effectPreview:
          "Prepare an archive packet and reduce later search friction.",
        resultTitle: "Archive Packet Prepared",
        resultSummary:
          "Otto assembles a precise packet of municipal records and flags anomalies for the next sweep.",
        effects: [
          {
            type: "set_flag",
            key: "command_archive_packet_ready",
            value: true,
          },
          { type: "grant_xp", amount: 3 },
        ],
      },
    ],
  },
];

export const getCommandScenario = (
  scenarioId: string,
): CommandScenarioTemplate => {
  const scenario = COMMAND_SCENARIOS.find((entry) => entry.id === scenarioId);
  if (!scenario) {
    throw new SenderError(`Unknown command scenario ${scenarioId}`);
  }
  return scenario;
};
