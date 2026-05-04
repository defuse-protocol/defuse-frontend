import { useEffect, useState } from "react"

import {
  type ChainType,
  type State,
  useConnectWallet,
} from "@src/hooks/useConnectWallet"
import {
  type NearComPromoVariant,
  getNearComPromoVariant,
} from "./nearComPromoVariant"

type NearComPromoState = {
  isHydrated: boolean
  variant: NearComPromoVariant
  chainType: State["chainType"]
  signOut: (params: { id: ChainType }) => Promise<void>
}

export function useNearComPromoState(): NearComPromoState {
  const { state, signOut } = useConnectWallet()
  const [isHydrated, setIsHydrated] = useState(false)
  useEffect(() => setIsHydrated(true), [])

  return {
    isHydrated,
    variant: isHydrated ? getNearComPromoVariant(state.chainType) : "anonymous",
    chainType: state.chainType,
    signOut,
  }
}
