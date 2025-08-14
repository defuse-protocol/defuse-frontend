import type { TokenResponse } from "@defuse-protocol/one-click-sdk-typescript"
import type { Address } from "viem"
import { settings } from "../../components/DefuseSDK/constants/settings"
import { normalizeToNearAddress } from "../../components/DefuseSDK/features/machines/depositTokenBalanceMachine"
import { logger } from "../../components/DefuseSDK/logger"
import {
  getEvmErc20Balance,
  getEvmNativeBalance,
  getNearNativeBalance,
  getNearNep141Balance,
  getSolanaNativeBalance,
  getSolanaSplBalance,
  getTonJettonBalance,
  getTonNativeBalance,
} from "../../components/DefuseSDK/services/blockchainBalanceService"
import { getWalletRpcUrl1cs } from "../../components/DefuseSDK/services/depositService"
import {
  checkTonJettonWalletRequired1cs,
  createTonClient,
} from "../../components/DefuseSDK/services/tonJettonService"
import { assert } from "../../components/DefuseSDK/utils/assert"
import { validateAddress1cs } from "../../components/DefuseSDK/utils/validateAddress"

export async function getBalance(
  token: TokenResponse,
  userWalletAddress: string | null
): Promise<bigint | null> {
  const blockchain = token.blockchain

  if (
    userWalletAddress === null ||
    !validateAddress1cs(userWalletAddress, blockchain)
  ) {
    return null
  }

  try {
    return await balanceGetters[blockchain](token, userWalletAddress)
  } catch (error) {
    logger.error(error)
    return null
  }
}

const balanceGetters: Record<
  TokenResponse.blockchain,
  (token: TokenResponse, userWalletAddress: string) => Promise<bigint | null>
> = {
  near: nearBalanceGetter,

  eth: ethBalanceGetter,
  base: ethBalanceGetter,
  arb: ethBalanceGetter,
  gnosis: ethBalanceGetter,
  bera: ethBalanceGetter,
  pol: ethBalanceGetter,
  bsc: ethBalanceGetter,
  op: ethBalanceGetter,
  avax: ethBalanceGetter,

  sol: solBalanceGetter,
  ton: tonBalanceGetter,

  btc: unsupportedBalanceGetter,
  doge: unsupportedBalanceGetter,
  xrp: unsupportedBalanceGetter,
  zec: unsupportedBalanceGetter,
  tron: unsupportedBalanceGetter,
  sui: unsupportedBalanceGetter,
  cardano: unsupportedBalanceGetter,
}

async function unsupportedBalanceGetter(
  _token: TokenResponse,
  _userWalletAddress: string
) {
  return null
}

async function nearBalanceGetter(
  token: TokenResponse,
  userWalletAddress: string
) {
  const address = token.contractAddress
  assert(address !== undefined, "Address is not defined")

  const [nep141Balance, nativeBalance] = await Promise.all([
    getNearNep141Balance({
      tokenAddress: address,
      accountId: normalizeToNearAddress(userWalletAddress),
    }),
    getNearNativeBalance({
      accountId: normalizeToNearAddress(userWalletAddress),
    }),
  ])
  // This is unique case for NEAR, where we need to sum up the native balance and the NEP-141 balance
  if (address === "wrap.near") {
    if (nep141Balance === null || nativeBalance === null) {
      throw new Error("Failed to fetch NEAR balances")
    }
    return nep141Balance + nativeBalance
  }
  const balance = await getNearNep141Balance({
    tokenAddress: address,
    accountId: normalizeToNearAddress(userWalletAddress),
  })
  if (balance === null) {
    throw new Error("Failed to fetch NEAR balances")
  }
  return balance
}

async function ethBalanceGetter(
  token: TokenResponse,
  userWalletAddress: string
) {
  const contractAddress = token.contractAddress
  if (contractAddress === undefined) {
    const balance = await getEvmNativeBalance({
      userAddress: userWalletAddress as Address,
      rpcUrl: getWalletRpcUrl1cs(token.blockchain),
    })
    if (balance === null) {
      throw new Error("Failed to fetch EVM balances")
    }
    return balance
  }
  const balance = await getEvmErc20Balance({
    tokenAddress: contractAddress as Address,
    userAddress: userWalletAddress as Address,
    rpcUrl: getWalletRpcUrl1cs(token.blockchain),
  })
  if (balance === null) {
    throw new Error("Failed to fetch EVM balances")
  }

  return balance
}

async function solBalanceGetter(
  token: TokenResponse,
  userWalletAddress: string
) {
  const contractAddress = token.contractAddress
  if (contractAddress === undefined) {
    const balance = await getSolanaNativeBalance({
      userAddress: userWalletAddress,
      rpcUrl: getWalletRpcUrl1cs(token.blockchain),
    })
    if (balance === null) {
      throw new Error("Failed to fetch SOLANA balances")
    }
    return balance
  }

  const balance = await getSolanaSplBalance({
    userAddress: userWalletAddress,
    tokenAddress: contractAddress,
    rpcUrl: getWalletRpcUrl1cs(token.blockchain),
  })
  if (balance === null) {
    throw new Error("Failed to fetch SOLANA balances")
  }
  return balance
}

async function tonBalanceGetter(
  token: TokenResponse,
  userWalletAddress: string
) {
  const contractAddress = token.contractAddress
  if (contractAddress === undefined) {
    const balance = await getTonNativeBalance({
      userAddress: userWalletAddress,
      rpcUrl: getWalletRpcUrl1cs(token.blockchain),
    })
    if (balance === null) {
      throw new Error("Failed to fetch TON balances")
    }
    return balance
  }

  const isJettonWalletCreationRequired = await checkTonJettonWalletRequired1cs(
    createTonClient(settings.rpcUrls.ton),
    token,
    userWalletAddress
  )
  if (isJettonWalletCreationRequired) {
    return null
  }

  const balance = await getTonJettonBalance({
    tokenAddress: contractAddress,
    userAddress: userWalletAddress,
    rpcUrl: getWalletRpcUrl1cs(token.blockchain),
  })
  if (balance === null) {
    throw new Error("Failed to fetch TON balances")
  }
  return balance
}
