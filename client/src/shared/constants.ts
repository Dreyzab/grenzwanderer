export const MAP_POINT_TYPE = {
  SETTLEMENT: 'settlement',
  NPC: 'npc',
  BOARD: 'board',
  ANOMALY: 'anomaly',
  UNKNOWN: 'unknown',
} as const;

export type MapPointType = typeof MAP_POINT_TYPE[keyof typeof MAP_POINT_TYPE];

export const NEXT_ACTION = {
  OPEN_POINT: 'open_point',
  START_INTRO_VN: 'start_intro_vn',
} as const;

export type NextActionType = typeof NEXT_ACTION[keyof typeof NEXT_ACTION];


