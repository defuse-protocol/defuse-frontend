import { CAIP2_NETWORK } from "@defuse-protocol/bridge-sdk"
import type {
  MockedChains,
  SupportedChainName,
  VirtualChains,
} from "../types/base"

type RealChains = Exclude<SupportedChainName, VirtualChains | MockedChains>

const mapping: Record<RealChains, CAIP2_NETWORK> = {
  bitcoin: CAIP2_NETWORK.Bitcoin,
  eth: CAIP2_NETWORK.Ethereum,
  base: CAIP2_NETWORK.Base,
  arbitrum: CAIP2_NETWORK.Arbitrum,
  bsc: CAIP2_NETWORK.BNB,
  polygon: CAIP2_NETWORK.Polygon,
  near: CAIP2_NETWORK.Near,
  solana: CAIP2_NETWORK.Solana,
  tron: CAIP2_NETWORK.Tron,
  gnosis: CAIP2_NETWORK.Gnosis,
  xrpledger: CAIP2_NETWORK.XRPL,
  dogecoin: CAIP2_NETWORK.Dogecoin,
  zcash: CAIP2_NETWORK.Zcash,
  berachain: CAIP2_NETWORK.Berachain,
  ton: CAIP2_NETWORK.TON,
  optimism: CAIP2_NETWORK.Optimism,
  avalanche: CAIP2_NETWORK.Avalanche,
  sui: CAIP2_NETWORK.Sui,
  stellar: CAIP2_NETWORK.Stellar,
  aptos: CAIP2_NETWORK.Aptos,
}

export function getCAIP2(chainName: SupportedChainName): CAIP2_NETWORK {
  if (chainName in mapping) {
    return mapping[chainName as keyof typeof mapping]
  }
  throw new Error(`Unsupported chain name: ${chainName}`)
}
