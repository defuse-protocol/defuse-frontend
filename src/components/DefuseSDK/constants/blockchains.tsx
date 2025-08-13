import { BlockchainEnum } from "@defuse-protocol/internal-utils"
import type { TokenResponse } from "@defuse-protocol/one-click-sdk-typescript"
import type { SupportedChainName } from "@src/components/DefuseSDK/types/base"
import type { ReactNode } from "react"
import { NetworkIcon } from "../components/Network/NetworkIcon"

type BlockchainOption = {
  label: string
  icon: ReactNode
  value: BlockchainEnum
  tags?: string[]
}

type IntentsOption = {
  label: string
  icon: ReactNode
  value: "near_intents"
  tags?: string[]
}

export type NetworkOption = BlockchainOption | IntentsOption

export function isIntentsOption(
  option: NetworkOption
): option is IntentsOption {
  return option.value === "near_intents"
}

export function isBlockchainOption(
  option: NetworkOption
): option is BlockchainOption {
  return option.value !== "near_intents"
}

export const chainIcons: Record<SupportedChainName, string> = {
  eth: "/static/icons/network/ethereum.svg",
  near: "/static/icons/network/near.svg",
  base: "/static/icons/network/base.svg",
  arbitrum: "/static/icons/network/arbitrum.svg",
  bitcoin: "/static/icons/network/btc.svg",
  solana: "/static/icons/network/solana.svg",
  dogecoin: "/static/icons/network/dogecoin.svg",
  turbochain: "/static/icons/network/turbochain.png",
  tuxappchain: "/static/icons/network/tuxappchain.svg",
  vertex: "/static/icons/network/vertex.svg",
  optima: "/static/icons/network/optima.svg",
  easychain: "/static/icons/network/easychain.svg",
  aurora: "/static/icons/network/aurora.svg",
  aurora_devnet: "/static/icons/network/aurora_devnet.svg",
  xrpledger: "/static/icons/network/xrpledger.svg",
  zcash: "/static/icons/network/zcash-icon-black.svg",
  gnosis: "/static/icons/network/gnosis.svg",
  berachain: "/static/icons/network/berachain.svg",
  tron: "/static/icons/network/tron.svg",
  polygon: "/static/icons/network/polygon.svg",
  bsc: "/static/icons/network/bsc.svg",
  hyperliquid: "/static/icons/network/hyperliquid.svg",
  ton: "/static/icons/network/ton.svg",
  optimism: "/static/icons/network/optimism.svg",
  avalanche: "/static/icons/network/avalanche.svg",
  sui: "/static/icons/network/sui.svg",
  stellar: "/static/icons/network/stellar.svg",
  aptos: "/static/icons/network/aptos.svg",
  cardano: "/static/icons/network/cardano.svg",
}

export const chainIcons1cs: Record<TokenResponse.blockchain, string> = {
  eth: "/static/icons/network/ethereum.svg",
  near: "/static/icons/network/near.svg",
  base: "/static/icons/network/base.svg",
  arb: "/static/icons/network/arbitrum.svg",
  btc: "/static/icons/network/btc.svg",
  sol: "/static/icons/network/solana.svg",
  doge: "/static/icons/network/dogecoin.svg",
  xrp: "/static/icons/network/xrpledger.svg",
  zec: "/static/icons/network/zcash-icon-black.svg",
  gnosis: "/static/icons/network/gnosis.svg",
  bera: "/static/icons/network/berachain.svg",
  tron: "/static/icons/network/tron.svg",
  pol: "/static/icons/network/polygon.svg",
  bsc: "/static/icons/network/bsc.svg",
  ton: "/static/icons/network/ton.svg",
  op: "/static/icons/network/optimism.svg",
  avax: "/static/icons/network/avalanche.svg",
  sui: "/static/icons/network/sui.svg",
  cardano: "/static/icons/network/cardano.svg",
}

export function getBlockchainsOptions(): Record<
  BlockchainEnum,
  BlockchainOption
> {
  const options: Record<BlockchainEnum, BlockchainOption> = {
    [BlockchainEnum.NEAR]: {
      label: "Near",
      icon: <NetworkIcon chainIcon={chainIcons.near} chainName="near" />,
      value: BlockchainEnum.NEAR,
      tags: ["vol:4"],
    },
    [BlockchainEnum.ETHEREUM]: {
      label: "Ethereum",
      icon: <NetworkIcon chainIcon={chainIcons.eth} chainName="eth" />,
      value: BlockchainEnum.ETHEREUM,
      tags: ["vol:6"],
    },
    [BlockchainEnum.BASE]: {
      label: "Base",
      icon: <NetworkIcon chainIcon={chainIcons.base} chainName="base" />,
      value: BlockchainEnum.BASE,
      tags: ["vol:9"],
    },
    [BlockchainEnum.ARBITRUM]: {
      label: "Arbitrum",
      icon: (
        <NetworkIcon chainIcon={chainIcons.arbitrum} chainName="arbitrum" />
      ),
      value: BlockchainEnum.ARBITRUM,
      tags: ["vol:10"],
    },
    [BlockchainEnum.BITCOIN]: {
      label: "Bitcoin",
      icon: <NetworkIcon chainIcon={chainIcons.bitcoin} chainName="bitcoin" />,
      value: BlockchainEnum.BITCOIN,
      tags: ["vol:8"],
    },
    [BlockchainEnum.SOLANA]: {
      label: "Solana",
      icon: <NetworkIcon chainIcon={chainIcons.solana} chainName="solana" />,
      value: BlockchainEnum.SOLANA,
      tags: ["vol:3"],
    },
    [BlockchainEnum.DOGECOIN]: {
      label: "Dogecoin",
      icon: (
        <NetworkIcon chainIcon={chainIcons.dogecoin} chainName="dogecoin" />
      ),
      value: BlockchainEnum.DOGECOIN,
      tags: ["vol:7"],
    },
    [BlockchainEnum.TURBOCHAIN]: {
      label: "TurboChain",
      icon: (
        <NetworkIcon chainIcon={chainIcons.turbochain} chainName="turbochain" />
      ),
      value: BlockchainEnum.TURBOCHAIN,
      tags: ["vol:102"],
    },
    [BlockchainEnum.AURORA]: {
      label: "Aurora",
      icon: <NetworkIcon chainIcon={chainIcons.aurora} chainName="aurora" />,
      value: BlockchainEnum.AURORA,
      tags: ["vol:101"],
    },
    [BlockchainEnum.AURORA_DEVNET]: {
      label: "Aurora Devnet",
      icon: <NetworkIcon chainIcon={chainIcons.aurora} chainName="aurora" />,
      value: BlockchainEnum.AURORA_DEVNET,
      tags: ["vol:200"],
    },
    [BlockchainEnum.XRPLEDGER]: {
      label: "XRP Ledger",
      icon: (
        <NetworkIcon chainIcon={chainIcons.xrpledger} chainName="XRP Ledger" />
      ),
      value: BlockchainEnum.XRPLEDGER,
      tags: ["vol:10"],
    },
    [BlockchainEnum.ZCASH]: {
      label: "Zcash",
      icon: <NetworkIcon chainIcon={chainIcons.zcash} chainName="zcash" />,
      value: BlockchainEnum.ZCASH,
      tags: ["vol:1"],
    },
    [BlockchainEnum.GNOSIS]: {
      label: "Gnosis",
      icon: <NetworkIcon chainIcon={chainIcons.gnosis} chainName="Gnosis" />,
      value: BlockchainEnum.GNOSIS,
      tags: ["vol:5"],
    },
    [BlockchainEnum.BERACHAIN]: {
      label: "BeraChain",
      icon: (
        <NetworkIcon chainIcon={chainIcons.berachain} chainName="BeraChain" />
      ),
      value: BlockchainEnum.BERACHAIN,
      tags: ["vol:11"],
    },
    [BlockchainEnum.TRON]: {
      label: "Tron",
      icon: <NetworkIcon chainIcon={chainIcons.tron} chainName="Tron" />,
      value: BlockchainEnum.TRON,
      tags: ["vol:2"],
    },
    [BlockchainEnum.TUXAPPCHAIN]: {
      label: "TuxaChain",
      icon: (
        <NetworkIcon
          chainIcon={chainIcons.tuxappchain}
          chainName="tuxappchain"
        />
      ),
      value: BlockchainEnum.TUXAPPCHAIN,
      tags: ["vol:103"],
    },
    [BlockchainEnum.VERTEX]: {
      label: "Vertex",
      icon: <NetworkIcon chainIcon={chainIcons.vertex} chainName="vertex" />,
      value: BlockchainEnum.VERTEX,
      tags: ["vol:104"],
    },
    [BlockchainEnum.OPTIMA]: {
      label: "Optima",
      icon: <NetworkIcon chainIcon={chainIcons.optima} chainName="optima" />,
      value: BlockchainEnum.OPTIMA,
      tags: ["vol:105"],
    },
    [BlockchainEnum.EASYCHAIN]: {
      label: "EasyChain",
      icon: (
        <NetworkIcon chainIcon={chainIcons.easychain} chainName="easychain" />
      ),
      value: BlockchainEnum.EASYCHAIN,
      tags: ["vol:106"],
    },
    [BlockchainEnum.POLYGON]: {
      label: "Polygon",
      icon: <NetworkIcon chainIcon={chainIcons.polygon} chainName="Polygon" />,
      value: BlockchainEnum.POLYGON,
      tags: [],
    },
    [BlockchainEnum.BSC]: {
      label: "BNB Smart Chain",
      icon: (
        <NetworkIcon chainIcon={chainIcons.bsc} chainName="BNB Smart Chain" />
      ),
      value: BlockchainEnum.BSC,
      tags: [],
    },
    [BlockchainEnum.HYPERLIQUID]: {
      label: "Hyperliquid",
      icon: (
        <NetworkIcon
          chainIcon={chainIcons.hyperliquid}
          chainName="Hyperliquid"
        />
      ),
      value: BlockchainEnum.HYPERLIQUID,
      tags: [],
    },
    [BlockchainEnum.TON]: {
      label: "TON",
      icon: <NetworkIcon chainIcon={chainIcons.ton} chainName="TON" />,
      value: BlockchainEnum.TON,
      tags: [],
    },
    [BlockchainEnum.OPTIMISM]: {
      label: "Optimism",
      icon: (
        <NetworkIcon chainIcon={chainIcons.optimism} chainName="Optimism" />
      ),
      value: BlockchainEnum.OPTIMISM,
      tags: [],
    },
    [BlockchainEnum.AVALANCHE]: {
      label: "Avalanche",
      icon: (
        <NetworkIcon chainIcon={chainIcons.avalanche} chainName="Avalanche" />
      ),
      value: BlockchainEnum.AVALANCHE,
      tags: [],
    },
    [BlockchainEnum.SUI]: {
      label: "Sui",
      icon: <NetworkIcon chainIcon={chainIcons.sui} chainName="Sui" />,
      value: BlockchainEnum.SUI,
      tags: [],
    },
    [BlockchainEnum.STELLAR]: {
      label: "Stellar",
      icon: <NetworkIcon chainIcon={chainIcons.stellar} chainName="Stellar" />,
      value: BlockchainEnum.STELLAR,
      tags: [],
    },
    [BlockchainEnum.APTOS]: {
      label: "Aptos",
      icon: <NetworkIcon chainIcon={chainIcons.aptos} chainName="Aptos" />,
      value: BlockchainEnum.APTOS,
      tags: [],
    },
    [BlockchainEnum.CARDANO]: {
      label: "Cardano",
      icon: <NetworkIcon chainIcon={chainIcons.cardano} chainName="Cardano" />,
      value: BlockchainEnum.CARDANO,
      tags: [],
    },
  }

  return sortBlockchainOptionsByVolume(options)
}

function sortBlockchainOptionsByVolume(
  options: Record<BlockchainEnum, BlockchainOption>
): Record<BlockchainEnum, BlockchainOption> {
  const sortedEntries = Object.entries(options).sort(([, a], [, b]) => {
    const volTagA = a.tags?.find((tag) => tag.startsWith("vol:"))
    const volTagB = b.tags?.find((tag) => tag.startsWith("vol:"))

    const volA = Number.parseInt(volTagA?.split(":")[1] ?? "0")
    const volB = Number.parseInt(volTagB?.split(":")[1] ?? "0")

    return volA - volB
  })

  return Object.fromEntries(sortedEntries) as Record<
    BlockchainEnum,
    BlockchainOption
  >
}

export function getNearIntentsOption(): Record<"intents", IntentsOption> {
  return {
    intents: {
      label: "Near Intents",
      icon: (
        <NetworkIcon
          chainIcon="/static/icons/network/intents.svg"
          chainName="Intents"
        />
      ),
      value: "near_intents",
      tags: [],
    },
  }
}
