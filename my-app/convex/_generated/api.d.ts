/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as postings from "../postings.js";
import type * as recruiterBriefs from "../recruiterBriefs.js";
import type * as tasks from "../tasks.js";
import type * as voice from "../voice.js";
import type * as voiceDay from "../voiceDay.js";
import type * as voiceWorker from "../voiceWorker.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  postings: typeof postings;
  recruiterBriefs: typeof recruiterBriefs;
  tasks: typeof tasks;
  voice: typeof voice;
  voiceDay: typeof voiceDay;
  voiceWorker: typeof voiceWorker;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
