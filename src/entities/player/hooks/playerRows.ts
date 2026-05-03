interface PlayerFlagLike {
  key: string;
  value: boolean;
}

interface PlayerVarLike {
  key: string;
  floatValue: number;
}

export const mapPlayerFlags = (
  rows: readonly PlayerFlagLike[],
  hasIdentity: boolean,
): Record<string, boolean> => {
  if (!hasIdentity) {
    return {};
  }

  const result: Record<string, boolean> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
};

export const mapPlayerVars = (
  rows: readonly PlayerVarLike[],
  hasIdentity: boolean,
): Record<string, number> => {
  if (!hasIdentity) {
    return {};
  }

  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.key] = row.floatValue;
  }
  return result;
};
