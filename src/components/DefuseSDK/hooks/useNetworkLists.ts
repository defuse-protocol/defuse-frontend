import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import {
  availableChainsForToken,
  availableDisabledChainsForToken,
} from "@src/components/DefuseSDK/utils/blockchain"
import { useMemo } from "react"
import {
  type NetworkOption,
  getNearIntentsOption,
} from "../constants/blockchains"

export type NetworkOptions = Record<string, NetworkOption>

type UsePreparedNetworkLists = (params: {
  networks: NetworkOptions
  token: TokenInfo | null
  near_intents?: boolean
}) => {
  availableNetworks: NetworkOptions
  disabledNetworks: NetworkOptions
}

export const usePreparedNetworkLists: UsePreparedNetworkLists = ({
  networks,
  token,
  near_intents = false,
}) => {
  const availableNetworks = useMemo(
    () =>
      token == null
        ? {}
        : {
            ...(near_intents ? getNearIntentsOption() : {}),
            ...availableChainsForToken(token),
          },
    [token, near_intents]
  )
  const disabledNetworks = useMemo(
    () =>
      token == null
        ? {}
        : availableDisabledChainsForToken(networks, availableNetworks),
    [networks, availableNetworks, token]
  )
  return {
    availableNetworks,
    disabledNetworks,
  }
}
