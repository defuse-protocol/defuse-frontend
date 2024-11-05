"use client"

import { useEffect, useState } from "react"

import { useGetCoingeckoExchangeList } from "@src/api/hooks/exchange/useGetCoingeckoExchangeList"
import { getBitcoinPriceInUsd } from "@src/api/token"
import { balanceToDecimal } from "@src/app/(home)/SwapForm/service/balanceTo"
import { getBalanceNearAllowedToSwap } from "@src/app/(home)/SwapForm/service/getBalanceNearAllowedToSwap"
import { W_BASE_TOKEN_META, W_NEAR_TOKEN_META } from "@src/constants/tokens"
import { useAccountBalance } from "@src/hooks/useAccountBalance"
import { useMinimumNearBalance } from "@src/hooks/useMinimumNearBalance"
import { useHistoryStore } from "@src/providers/HistoryStoreProvider"
import { useTokensStore } from "@src/providers/TokensStoreProvider"
import { useWalletSelector } from "@src/providers/WalletSelectorProvider"
import type { CoingeckoExchanges } from "@src/types/coingecko"
import {
  BlockchainEnum,
  NetworkEnum,
  type NetworkTokenWithSwapRoute,
  type TokenBalance,
} from "@src/types/interfaces"
import { bitcoinNativeBalance } from "@src/utils/bitcoin"
import {
  ethereumERC20Balance,
  ethereumNativeBalance,
} from "@src/utils/ethereum"
import { nep141Balance } from "@src/utils/near"
import parseDefuseAsset from "@src/utils/parseDefuseAsset"

import { useGetAccount } from "./useGetAccount"

const baseRpc = process.env.BASE_RPC || ""

export const useGetTokensBalance = (
  tokensList: NetworkTokenWithSwapRoute[]
) => {
  const [isFetching, setIsFetching] = useState(false)
  const [isError, setIsError] = useState(false)
  const [data, setData] = useState<NetworkTokenWithSwapRoute[]>([])
  const { accountId, selector } = useWalletSelector()
  const { activePreview } = useHistoryStore((state) => state)
  const { getAccountIdBase, getAccountIdBinance } = useGetAccount({
    accountId,
    selector,
  })

  const { data: exchangesListNear, isFetched: isFetchedListNear } =
    useGetCoingeckoExchangeList("ref_finance")
  const { data: exchangesListBase, isFetched: isFetchedListBase } =
    useGetCoingeckoExchangeList("uniswap-v3-base")

  const { getAccountBalance } = useAccountBalance()
  const { minNearBalance } = useMinimumNearBalance(accountId)
  const { isLoading } = useTokensStore((state) => state)

  const isTokenNative = (address: string): boolean => {
    switch (address) {
      case "native":
        return true
      default:
        return false
    }
  }

  const assignConversionsContext = async (
    tokenBalance: TokenBalance,
    exchangesList: CoingeckoExchanges,
    wTokenAddress: string,
    address: string,
    decimals: number
  ) => {
    const getCoinIndex = exchangesList?.tickers?.findIndex((coin) => {
      return isTokenNative(address)
        ? coin.base.toLowerCase() === wTokenAddress
        : coin.base.toLowerCase() === address.toLowerCase()
    })

    if (getCoinIndex !== -1) {
      const convertedLastUsd =
        exchangesList?.tickers[getCoinIndex].converted_last.usd
      if (convertedLastUsd) {
        Object.assign(tokenBalance, {
          convertedLast: { usd: convertedLastUsd },
        })
        if (tokenBalance?.balance) {
          const balanceUsd =
            Number(balanceToDecimal(tokenBalance.balance, decimals)) *
            convertedLastUsd
          Object.assign(tokenBalance, {
            balanceUsd,
          })
        }
      }
    }
  }

  const getNearTokenBalance = async (
    address: string,
    decimals: number
  ): Promise<TokenBalance> => {
    const tokenBalance: TokenBalance = {}

    await getBalanceNearAllowedToSwap(accountId as string)

    if (accountId && isTokenNative(address)) {
      const { balance } = await getAccountBalance()
      if (balance) {
        Object.assign(tokenBalance, {
          balance,
        })
      }
    } else if (accountId && !isTokenNative(address)) {
      const balance = await nep141Balance(accountId, address)
      if (balance) {
        Object.assign(tokenBalance, { balance })
      }
    }

    if (exchangesListBase) {
      const wTokenAddress = W_NEAR_TOKEN_META.address
      await assignConversionsContext(
        tokenBalance,
        exchangesListNear as CoingeckoExchanges,
        wTokenAddress,
        address,
        decimals
      )
    }

    return tokenBalance
  }

  const getBaseTokenBalance = async (
    address: string,
    decimals: number
  ): Promise<TokenBalance> => {
    const tokenBalance: TokenBalance = {}

    const accountId = getAccountIdBase()
    if (accountId && isTokenNative(address)) {
      const balance = await ethereumNativeBalance(accountId, baseRpc)
      if (balance) {
        Object.assign(tokenBalance, {
          balance,
        })
      }
    } else if (accountId && !isTokenNative(address)) {
      const balance = await ethereumERC20Balance(accountId, address, baseRpc)
      if (balance) {
        Object.assign(tokenBalance, { balance })
      }
    }

    if (exchangesListBase) {
      const wTokenAddress = W_BASE_TOKEN_META.address
      await assignConversionsContext(
        tokenBalance,
        exchangesListBase as CoingeckoExchanges,
        wTokenAddress,
        address,
        decimals
      )
    }

    return tokenBalance
  }

  const getBitcoinTokenBalance = async (
    address: string,
    decimals: number
  ): Promise<TokenBalance> => {
    const tokenBalance: TokenBalance = {}

    const accountId = getAccountIdBinance()
    if (accountId && isTokenNative(address)) {
      const balance = await bitcoinNativeBalance(accountId)
      if (balance) {
        Object.assign(tokenBalance, {
          balance,
        })
      }
    }

    const result = await getBitcoinPriceInUsd()
    const convertedLastUsd = result.bitcoin.usd
    if (convertedLastUsd) {
      Object.assign(tokenBalance, {
        convertedLast: { usd: convertedLastUsd },
      })
      if (tokenBalance?.balance) {
        const balanceUsd =
          Number(balanceToDecimal(tokenBalance.balance, decimals)) *
          convertedLastUsd
        Object.assign(tokenBalance, {
          balanceUsd,
        })
      }
    }

    return tokenBalance
  }

  const getTokensBalance = async () => {
    try {
      setIsFetching(true)
      const dataWithBalances = await Promise.all(
        tokensList.map(async (token) => {
          const result = parseDefuseAsset(token?.defuse_asset_id ?? "")
          if (!result) {
            return token
          }

          switch (result.blockchain) {
            case BlockchainEnum.Near:
              switch (result.network) {
                case NetworkEnum.Mainnet:
                  return {
                    ...token,
                    ...(await getNearTokenBalance(
                      result.contractId,
                      token?.decimals ?? 0
                    )),
                  }
                default:
                  return token
              }
            case BlockchainEnum.Eth:
              switch (result.network) {
                case NetworkEnum.Base:
                  return {
                    ...token,
                    ...(await getBaseTokenBalance(
                      result.contractId,
                      token?.decimals ?? 0
                    )),
                  }
                default:
                  return token
              }
            case BlockchainEnum.Btc:
              switch (result.network) {
                case NetworkEnum.Mainnet:
                  return {
                    ...token,
                    ...(await getBitcoinTokenBalance(
                      result.contractId,
                      token?.decimals ?? 0
                    )),
                  }
                default:
                  return token
              }
            default:
              return token
          }
        })
      )

      setData(dataWithBalances)
      setIsFetching(false)
    } catch (e) {
      console.log("useGetTokensBalance: ", e)
      setIsError(true)
      setIsFetching(false)
    }
  }

  const clearTokensBalance = () => {
    const dataCleanBalances = data.map((token) => ({
      ...token,
      balance: undefined,
      balanceUsd: undefined,
      convertedLast: undefined,
    }))
    setData(dataCleanBalances)
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <reason>
  useEffect(() => {
    if (accountId && tokensList && isFetchedListNear && isFetchedListBase) {
      void getTokensBalance()
    }
  }, [
    accountId,
    tokensList,
    activePreview,
    minNearBalance,
    isFetchedListNear,
    isFetchedListBase,
    isLoading,
  ])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <reason>
  useEffect(() => {
    if (!accountId && !isFetching) {
      clearTokensBalance()
    }
  }, [accountId, isFetching])

  return {
    data,
    isFetching,
    isError,
  }
}
