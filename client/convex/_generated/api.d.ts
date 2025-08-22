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
import type * as actions from "../actions.js";
import type * as auth from "../auth.js";
import type * as constants from "../constants.js";
import type * as dialogs from "../dialogs.js";
import type * as helpers_mappoints from "../helpers/mappoints.js";
import type * as helpers_migration from "../helpers/migration.js";
import type * as helpers_player from "../helpers/player.js";
import type * as helpers_qr from "../helpers/qr.js";
import type * as helpers_quest from "../helpers/quest.js";
import type * as mapPoints from "../mapPoints.js";
import type * as qr from "../qr.js";
import type * as quests from "../quests.js";
import type * as seed from "../seed.js";
import type * as server from "../server.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  auth: typeof auth;
  constants: typeof constants;
  dialogs: typeof dialogs;
  "helpers/mappoints": typeof helpers_mappoints;
  "helpers/migration": typeof helpers_migration;
  "helpers/player": typeof helpers_player;
  "helpers/qr": typeof helpers_qr;
  "helpers/quest": typeof helpers_quest;
  mapPoints: typeof mapPoints;
  qr: typeof qr;
  quests: typeof quests;
  seed: typeof seed;
  server: typeof server;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
