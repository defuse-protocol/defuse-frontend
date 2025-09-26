import type { BlockchainEnum } from "@defuse-protocol/internal-utils"
import { resolveTokenFamily } from "@src/components/DefuseSDK/utils/tokenFamily"
import { eachBaseTokenInfo } from "@src/components/DefuseSDK/utils/tokenUtils"
import { LIST_TOKENS_FLATTEN, tokenFamilies } from "@src/constants/tokens"
import { config } from "../config"
import { getBlockchainsOptions } from "../constants/blockchains"
import type { NetworkOption } from "../constants/blockchains"
import { CHAIN_IDS } from "../constants/evm"
import type { SupportedChainName, TokenDeployment } from "../types/base"
import type { TokenInfo } from "../types/base"
import { assetNetworkAdapter, reverseAssetNetworkAdapter } from "./adapters"
import { isBaseToken, isNativeToken } from "./token"

export function isAuroraVirtualChain(network: SupportedChainName): boolean {
  const virtualChains = [
    "turbochain",
    "aurora",
    "tuxappchain",
    "vertex",
    "optima",
    "easychain",
    "aurora_devnet",
  ]
  return virtualChains.includes(network)
}

export const filterChains = (
  candidates: Record<string, NetworkOption>,
  searchValue: string
) => {
  if (searchValue === "") {
    return candidates
  }

  const lowerCaseSearchValue = searchValue.toLowerCase()

  return Object.fromEntries(
    Object.entries(candidates).filter(
      ([key, option]) =>
        option.label.toLowerCase().includes(lowerCaseSearchValue) ||
        option.value.toLowerCase().includes(lowerCaseSearchValue) ||
        key.toLowerCase().includes(lowerCaseSearchValue)
    )
  )
}

function filterChainsByFeatureFlags<T extends string>(chains: T[]): T[] {
  let filtered = chains
  if (!config.features.hyperliquid) {
    filtered = filtered.filter((chain) => chain !== "hyperliquid")
  }
  if (!config.features.ton) {
    filtered = filtered.filter((chain) => chain !== "ton")
  }
  if (!config.features.optimism) {
    filtered = filtered.filter((chain) => chain !== "optimism")
  }
  if (!config.features.avalanche) {
    filtered = filtered.filter((chain) => chain !== "avalanche")
  }
  if (!config.features.sui) {
    filtered = filtered.filter((chain) => chain !== "sui")
  }
  if (!config.features.stellar) {
    filtered = filtered.filter((chain) => chain !== "stellar")
  }
  if (!config.features.aptos) {
    filtered = filtered.filter((chain) => chain !== "aptos")
  }
  return filtered
}

export function availableChainsForToken(
  token: TokenInfo,
  tokenList: TokenInfo[] = LIST_TOKENS_FLATTEN
): Record<string, NetworkOption> {
  const tokenFamily = resolveTokenFamily(tokenFamilies, token)

  const allDeployments: TokenDeployment[] = []
  if (tokenFamily) {
    for (const t of eachBaseTokenInfo(tokenList)) {
      if (tokenFamily.tokenIds.includes(t.defuseAssetId)) {
        allDeployments.push(...t.deployments)
      }
    }
  } else {
    for (const t of eachBaseTokenInfo([token])) {
      allDeployments.push(...t.deployments)
    }
  }
  let chains = Array.from(new Set(allDeployments.map((depl) => depl.chainName)))

  chains = filterChainsByFeatureFlags(chains)
  const options = getBlockchainsOptions()

  const res = Object.values(options)
    .filter((option) =>
      chains.includes(reverseAssetNetworkAdapter[option.value])
    )
    .map((option) => [option.value, option])
  return Object.fromEntries(res)
}

export function availableDisabledChainsForToken(
  chains: Record<string, NetworkOption>,
  filteredChains: Record<string, NetworkOption>
): Record<string, NetworkOption> {
  return Object.values(chains).reduce(
    (acc, chain) => {
      const notDisabledChain = filterChainsByFeatureFlags([
        reverseAssetNetworkAdapter[chain.value as BlockchainEnum],
      ])
      if (!filteredChains[chain.value] && notDisabledChain.length > 0) {
        acc[chain.value] = chain
      }
      return acc
    },
    {} as Record<string, NetworkOption>
  )
}

export function getDefaultBlockchainOptionValue(
  token: TokenInfo
): BlockchainEnum | null {
  let deployments: TokenDeployment[]
  if (isBaseToken(token)) {
    deployments = token.deployments
  } else {
    deployments = token.groupedTokens.flatMap((t) => t.deployments)
  }

  if (deployments.length === 1) {
    return assetNetworkAdapter[deployments[0].chainName]
  }

  for (const deployment of deployments) {
    if (isNativeToken(deployment)) {
      return assetNetworkAdapter[deployment.chainName]
    }
  }
  return null
}

export function isSupportedChainName(
  chainName: string
): chainName is SupportedChainName {
  const supportedChainNames = Object.keys(CHAIN_IDS)
  return supportedChainNames.includes(chainName)
}

export const auroraErc20ABI = [
  {
    inputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol",
        type: "string",
      },
      {
        internalType: "uint8",
        name: "decimal",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "admin",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [],
    name: "admin",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "adminDelegatecall",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "flags",
        type: "uint256",
      },
    ],
    name: "adminPause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "adminReceiveEth",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address payable",
        name: "destination",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "adminSendEth",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "key",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "adminSstore",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdrawToEthereum",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "recipient",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdrawToNear",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
]
