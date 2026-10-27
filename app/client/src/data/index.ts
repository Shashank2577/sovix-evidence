/**
 * The data layer's public surface (SPEC §9).
 *
 * Screens import from `@/data`; nothing outside this folder should reach for a
 * file path, a fetch, or a derivation rule directly.
 */

export * from "./types";
export * from "./scopes";
export * from "./derive";
export * from "./hydrate";
export * from "./edition";
