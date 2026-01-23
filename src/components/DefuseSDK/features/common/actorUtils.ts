import type { AnyActorRef } from "xstate"

/**
 * Creates a no-op parent ref for XState actors that don't have a parent.
 * Used when registering standalone status tracking actors.
 */
export function createNoopParentRef(): AnyActorRef {
  return {
    send: () => {},
    getSnapshot: () => ({}),
  } as unknown as AnyActorRef
}
