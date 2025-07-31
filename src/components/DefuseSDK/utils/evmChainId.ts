import { CHAIN_IDS } from "../constants/evm"
import type { SupportedChainName } from "../types/base"

export function getEVMChainId(chainName: SupportedChainName): number {
  const chainId = CHAIN_IDS[chainName]
  if (chainId != null) {
    return chainId
  }
  throw new Error(`Chain name "${chainName}" is not EVM compatible`)
}
