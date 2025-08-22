export const PLAYER_STATUS = {
  REFUGEE: 'refugee',
  CITIZEN: 'citizen',
} as const;

export type PlayerStatus = typeof PLAYER_STATUS[keyof typeof PLAYER_STATUS];

export const WORLD_KEYS = {
  GLOBAL: 'global',
} as const;

export const QUEST_SOURCE = {
  NPC: 'npc',
  BOARD: 'board',
} as const;

export const QR_RESOLVE_STATUS = {
  OK: 'ok',
  NOT_FOUND: 'not_found',
  POINT_INACTIVE: 'point_inactive',
} as const;

export const NEXT_ACTION = {
  OPEN_POINT: 'open_point',
  START_INTRO_VN: 'start_intro_vn',
} as const;


