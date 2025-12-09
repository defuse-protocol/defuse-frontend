import { type Chain, Chains } from "@defuse-protocol/intents-sdk"
import type {
  MockedChains,
  SupportedChainName,
  VirtualChains,
} from "../types/base"

type RealChains = Exclude<SupportedChainName, VirtualChains | MockedChains>

const mapping: Record<RealChains, Chain> = {
  bitcoin: Chains.Bitcoin,
  bitcoincash: Chains.BitcoinCash,
  eth: Chains.Ethereum,
  base: Chains.Base,
  arbitrum: Chains.Arbitrum,
  bsc: Chains.BNB,
  polygon: Chains.Polygon,
  near: Chains.Near,
  solana: Chains.Solana,
  tron: Chains.Tron,
  gnosis: Chains.Gnosis,
  xrpledger: Chains.XRPL,
  dogecoin: Chains.Dogecoin,
  zcash: Chains.Zcash,
  berachain: Chains.Berachain,
  ton: Chains.TON,
  optimism: Chains.Optimism,
  avalanche: Chains.Avalanche,
  sui: Chains.Sui,
  stellar: Chains.Stellar,
  aptos: Chains.Aptos,
  cardano: Chains.Cardano,
  litecoin: Chains.Litecoin,
  layerx: Chains.LayerX,
  monad: Chains.Monad,
  adi: Chains.Adi,
  starknet: Chains.Starknet,
}

export function getCAIP2(chainName: SupportedChainName): Chain {
  if (chainName in mapping) {
    return mapping[chainName as keyof typeof mapping]
  }
  throw new Error(`Unsupported chain name: ${chainName}`)
}
