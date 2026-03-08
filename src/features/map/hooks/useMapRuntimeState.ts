import { useMapCompositeState } from "./useMapCompositeState";

export const useMapRuntimeState = useMapCompositeState;

export type UseMapRuntimeStateResult = ReturnType<typeof useMapRuntimeState>;
