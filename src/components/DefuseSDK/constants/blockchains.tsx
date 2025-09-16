import { BlockchainEnum } from "@defuse-protocol/internal-utils"
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

export const chainIcons: Record<
  SupportedChainName,
  { dark: string; light: string }
> = {
  eth: {
    dark: "/static/icons/network/ethereum_white.svg",
    light: "/static/icons/network/ethereum.svg",
  },
  near: {
    dark: "/static/icons/network/near.svg",
    light: "/static/icons/network/near_dark.svg",
  },
  base: {
    dark: "/static/icons/network/base.svg",
    light: "/static/icons/network/base.svg",
  },
  arbitrum: {
    dark: "/static/icons/network/arbitrum.svg",
    light: "/static/icons/network/arbitrum.svg",
  },
  bitcoin: {
    dark: "/static/icons/network/btc.svg",
    light: "/static/icons/network/btc.svg",
  },
  solana: {
    dark: "/static/icons/network/solana.svg",
    light: "/static/icons/network/solana.svg",
  },
  dogecoin: {
    dark: "/static/icons/network/dogecoin.svg",
    light: "/static/icons/network/dogecoin.svg",
  },
  turbochain: {
    dark: "/static/icons/network/turbochain.png",
    light: "/static/icons/network/turbochain.png",
  },
  tuxappchain: {
    dark: "/static/icons/network/tuxappchain.svg",
    light: "/static/icons/network/tuxappchain.svg",
  },
  vertex: {
    dark: "/static/icons/network/vertex.svg",
    light: "/static/icons/network/vertex.svg",
  },
  optima: {
    dark: "/static/icons/network/optima.svg",
    light: "/static/icons/network/optima.svg",
  },
  easychain: {
    dark: "/static/icons/network/easychain.svg",
    light: "/static/icons/network/easychain.svg",
  },
  aurora: {
    dark: "/static/icons/network/aurora.svg",
    light: "/static/icons/network/aurora.svg",
  },
  aurora_devnet: {
    dark: "/static/icons/network/aurora_devnet.svg",
    light: "/static/icons/network/aurora_devnet.svg",
  },
  xrpledger: {
    dark: "/static/icons/network/xrpledger_white.svg",
    light: "/static/icons/network/xrpledger.svg",
  },
  zcash: {
    dark: "/static/icons/network/zcash.svg",
    light: "/static/icons/network/zcash-icon-black.svg",
  },
  gnosis: {
    dark: "/static/icons/network/gnosis_white.svg",
    light: "/static/icons/network/gnosis.svg",
  },
  berachain: {
    dark: "/static/icons/network/berachain.svg",
    light: "/static/icons/network/berachain.svg",
  },
  tron: {
    dark: "/static/icons/network/tron.svg",
    light: "/static/icons/network/tron.svg",
  },
  polygon: {
    dark: "/static/icons/network/polygon.svg",
    light: "/static/icons/network/polygon.svg",
  },
  bsc: {
    dark: "/static/icons/network/bsc.svg",
    light: "/static/icons/network/bsc.svg",
  },
  hyperliquid: {
    dark: "/static/icons/network/hyperliquid.svg",
    light: "/static/icons/network/hyperliquid.svg",
  },
  ton: {
    dark: "/static/icons/network/ton.svg",
    light: "/static/icons/network/ton.svg",
  },
  optimism: {
    dark: "/static/icons/network/optimism.svg",
    light: "/static/icons/network/optimism_dark.svg",
  },
  avalanche: {
    dark: "/static/icons/network/avalanche.svg",
    light: "/static/icons/network/avalanche.svg",
  },
  sui: {
    dark: "/static/icons/network/sui.svg",
    light: "/static/icons/network/sui_dark.svg",
  },
  stellar: {
    dark: "/static/icons/network/stellar_white.svg",
    light: "/static/icons/network/stellar.svg",
  },
  aptos: {
    dark: "/static/icons/network/aptos_white.svg",
    light: "/static/icons/network/aptos.svg",
  },
  cardano: {
    dark: "/static/icons/network/cardano.svg",
    light: "/static/icons/network/cardano.svg",
  },
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

const intentsChainIcon = {
  dark: "/static/icons/network/intents_white.svg",
  light: "/static/icons/network/intents.svg",
}

export function getNearIntentsOption(): Record<"intents", IntentsOption> {
  return {
    intents: {
      label: "Near Intents",
      icon: <NetworkIcon chainIcon={intentsChainIcon} chainName="Intents" />,
      value: "near_intents",
      tags: [],
    },
  }
}
