/**
 * A branded string type representing a Defuse user ID.
 * The brand prevents accidental mixing with regular strings in TypeScript.
 */
export type IntentsUserId = string & { __brand: "IntentsUserId" }
