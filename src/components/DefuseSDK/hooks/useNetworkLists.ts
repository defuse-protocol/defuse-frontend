import type { AuthMethod } from "@defuse-protocol/internal-utils"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import {
  availableChainsForToken,
  availableDisabledChainsForToken,
} from "@src/components/DefuseSDK/utils/blockchain"
import { useMemo } from "react"
import {
  type NetworkOption,
  getNearIntentsOption,
  isBlockchainOption,
} from "../constants/blockchains"
import { getAvailableDepositRoutes } from "../services/depositService"

export type NetworkOptions = Record<string, NetworkOption>

/**
 * Filters networks to only include those where deposits are possible
 * for the given auth method. A network is depositable if either
 * active or passive deposits are supported.
 */
function filterNetworksByDepositAvailability(
  networks: NetworkOptions,
  chainType: AuthMethod | undefined
): NetworkOptions {
  if (chainType == null) {
    return networks
  }

  return Object.fromEntries(
    Object.entries(networks).filter(([_, option]) => {
      // near_intents is a special value that doesn't correspond to a blockchain
      if (!isBlockchainOption(option)) {
        return true
      }
      const routes = getAvailableDepositRoutes(chainType, option.value)
      return routes?.activeDeposit || routes?.passiveDeposit
    })
  )
}

type UsePreparedNetworkLists = (params: {
  networks: NetworkOptions
  token: TokenInfo | null
  near_intents?: boolean
  /** Auth method to filter networks by deposit availability */
  chainType?: AuthMethod
}) => {
  availableNetworks: NetworkOptions
  disabledNetworks: NetworkOptions
}

export const usePreparedNetworkLists: UsePreparedNetworkLists = ({
  networks,
  token,
  near_intents = false,
  chainType,
}) => {
  const availableNetworks = useMemo(() => {
    if (token == null) {
      return {}
    }
    const tokenNetworks = {
      ...(near_intents ? getNearIntentsOption() : {}),
      ...availableChainsForToken(token),
    }
    // Filter out networks where deposits aren't possible for this auth method
    return filterNetworksByDepositAvailability(tokenNetworks, chainType)
  }, [token, near_intents, chainType])

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
