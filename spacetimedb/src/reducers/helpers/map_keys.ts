export const identityKey = (identity: { toHexString(): string }): string =>
  identity.toHexString();

export const createFlagKey = (
  player: { toHexString(): string },
  key: string,
): string => `${identityKey(player)}::${key}`;

export const createNpcStateKey = (
  player: { toHexString(): string },
  npcId: string,
): string => `${identityKey(player)}::npc::${npcId}`;

export const createRelationshipKey = (
  player: { toHexString(): string },
  characterId: string,
): string => `${identityKey(player)}::${characterId}`;

export const createCommandSessionKey = (player: {
  toHexString(): string;
}): string => `${identityKey(player)}::command`;

export const createCommandPartyMemberKey = (
  player: { toHexString(): string },
  actorId: string,
): string => `${identityKey(player)}::command::member::${actorId}`;

export const createCommandHistoryKey = (
  player: { toHexString(): string },
  orderId: string,
  timestampMicros: bigint,
): string =>
  `${identityKey(player)}::command::history::${orderId}::${timestampMicros.toString()}`;

export const createMapEventKey = (
  player: { toHexString(): string },
  templateId: string,
  timestampMicros: bigint,
  attempt: number,
): string =>
  `${identityKey(player)}::event::${templateId}::${timestampMicros.toString()}::${attempt}`;
