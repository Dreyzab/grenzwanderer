import { useCallback } from "react";
import { useReducer } from "spacetimedb/react";

type ReducerCall<TArgs extends object> = (args: TArgs) => Promise<unknown>;

export const useReducerAction = <TArgs extends object>(
  reducerBinding: any,
): ReducerCall<TArgs> => {
  const reducer = useReducer(reducerBinding) as ReducerCall<TArgs>;

  return useCallback(
    async (args: TArgs) => {
      await reducer(args);
    },
    [reducer],
  );
};
