/**
 * Shared utilities for status tracking across swap, deposit, and withdraw features.
 */

export type StatusActorSnapshot = {
  value: string | object
  context: {
    txHash?: string | null
    status?: string | null
  }
  can: (event: { type: string }) => boolean
}

/**
 * Extracts a string state value from XState's potentially nested state object.
 * XState can return either a string like "pending" or an object like { pending: "checking" }.
 */
export function extractStateValue(stateValue: string | object): string {
  return typeof stateValue === "string"
    ? stateValue
    : Object.keys(stateValue)[0]
}
