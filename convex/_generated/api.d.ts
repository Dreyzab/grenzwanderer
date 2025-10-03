/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as gameProgress from "../gameProgress.js";
import type * as mapPoints from "../mapPoints.js";
import type * as mapPointsSeed from "../mapPointsSeed.js";
import type * as player from "../player.js";
import type * as quests from "../quests.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  gameProgress: typeof gameProgress;
  mapPoints: typeof mapPoints;
  mapPointsSeed: typeof mapPointsSeed;
  player: typeof player;
  quests: typeof quests;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
