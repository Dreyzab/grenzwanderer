import { useMemo } from "react";
import {
  pickPrimaryBinding,
  pickTravelBinding,
  resolveAvailableBindings,
  resolveScenarioIdFromBindings,
} from "../model/mapResolver";
import type { MapRegionId, RuntimeMapPoint, RuntimeMapRoute } from "../types";
import { useMapEphemeralState } from "./useMapEphemeralState";
import {
  type UseMapPersistentStateResult,
  useMapPersistentState,
} from "./useMapPersistentState";

export interface UseMapCompositeStateResult extends Pick<
  UseMapPersistentStateResult,
  | "isMapAvailable"
  | "region"
  | "currentLocationId"
  | "journeyDiscoveryCandidates"
  | "resolverInputs"
  | "isReady"
> {
  points: RuntimeMapPoint[];
  routes: RuntimeMapRoute[];
}

export const useMapCompositeState = (
  regionId?: MapRegionId,
): UseMapCompositeStateResult => {
  const persistent = useMapPersistentState(regionId);
  const ephemeral = useMapEphemeralState();

  const ephemeralPoints = useMemo(() => {
    return ephemeral.events
      .filter((event) => event.point.regionId === persistent.region.id)
      .map((event) => {
        const state =
          persistent.currentLocationId === event.point.locationId
            ? "visited"
            : "discovered";
        const availableBindings = resolveAvailableBindings(
          event.point.bindings,
          {
            ...persistent.resolverInputs,
            pointState: state,
          },
        );
        const primaryBinding = pickPrimaryBinding(availableBindings);
        const travelBinding = pickTravelBinding(availableBindings);
        const resolvedScenarioId =
          resolveScenarioIdFromBindings(availableBindings);

        return {
          ...event.point,
          id: event.eventId,
          category: "EPHEMERAL",
          state,
          availableBindings,
          primaryBinding,
          travelBinding,
          isObjectiveActive: false,
          canTravel: travelBinding !== null,
          resolvedScenarioId,
          canStartScenario: resolvedScenarioId !== null,
          isVisible: true,
          runtimeSource: "ephemeral",
          persistentPointId: event.point.id,
          eventId: event.eventId,
          expiresAtMs: event.expiresAtMs,
          sourceLocationId: event.sourceLocationId,
        } satisfies RuntimeMapPoint;
      });
  }, [
    ephemeral.events,
    persistent.currentLocationId,
    persistent.region.id,
    persistent.resolverInputs,
  ]);

  const routes = useMemo(() => {
    const visiblePoints = new Map(
      persistent.points.map((point) => [point.id, point] as const),
    );
    const shadowRoutes = persistent.shadowRoutes ?? [];

    return shadowRoutes
      .filter((route) =>
        (route.revealFlagsAll ?? []).every((flag) =>
          persistent.activeFlags.has(flag),
        ),
      )
      .map((route): RuntimeMapRoute | null => {
        const routePoints = route.pointIds
          .map((pointId) => visiblePoints.get(pointId) ?? null)
          .filter((point): point is RuntimeMapPoint => point !== null);

        if (routePoints.length !== route.pointIds.length) {
          return null;
        }

        const runtimeRoute: RuntimeMapRoute = {
          id: route.id,
          regionId: route.regionId,
          pointIds: [...route.pointIds],
          color: route.color,
          coordinates: routePoints.map(
            (point) => [point.lng, point.lat] as [number, number],
          ),
        };

        return runtimeRoute;
      })
      .filter((route): route is RuntimeMapRoute => route !== null);
  }, [persistent.activeFlags, persistent.points, persistent.shadowRoutes]);

  return {
    isMapAvailable: persistent.isMapAvailable,
    region: persistent.region,
    currentLocationId: persistent.currentLocationId,
    points: [...persistent.points, ...ephemeralPoints],
    journeyDiscoveryCandidates: persistent.journeyDiscoveryCandidates,
    resolverInputs: persistent.resolverInputs,
    routes,
    isReady: persistent.isReady && ephemeral.isReady,
  };
};
