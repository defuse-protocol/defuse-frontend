import type { ChainType } from "@src/hooks/useConnectWallet"

/**
 * Builds a connector ID string for the "Last used" indicator.
 * EVM wallets get a namespaced ID (e.g. "evm:injected", "evm:walletConnect"),
 * while other chains use the chain type directly (e.g. "near", "solana").
 */
export function buildConnectorId(
  chainType: ChainType,
  evmConnectorId: string | undefined
): string {
  if (chainType === "evm" && evmConnectorId != null) {
    return `evm:${evmConnectorId}`
  }
  return chainType
}
