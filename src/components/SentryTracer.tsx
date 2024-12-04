"use client"

import { useSentrySetContextWallet } from "@src/hooks/useSetSentry"

import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useSentrySetUser } from "@src/hooks/useSetSentry"

export const SentryTracer = () => {
  const { state } = useConnectWallet()

  useSentrySetUser({ userAddress: state.address })
  useSentrySetContextWallet({ userAddress: state.address })
  return null
}
