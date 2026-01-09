"use client"

import { useTurnkey } from "@turnkey/react-wallet-kit"

type TurnkeyContext = ReturnType<typeof useTurnkey>

const defaultValue: Partial<TurnkeyContext> = {
  session: undefined,
  wallets: [],
}

/**
 * Safe wrapper around useTurnkey that returns default values
 * when called outside TurnkeyProvider (e.g., during SSR).
 */
export function useSafeTurnkey(): TurnkeyContext {
  try {
    return useTurnkey()
  } catch {
    return defaultValue as TurnkeyContext
  }
}
