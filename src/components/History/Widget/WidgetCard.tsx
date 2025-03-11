"use client"

import { ArrowTopRightIcon, Cross1Icon } from "@radix-ui/react-icons"
import { Spinner, Text } from "@radix-ui/themes"
import { formatUnits } from "ethers"
import Image from "next/image"
import Link from "next/link"
import React, { useEffect, useState } from "react"

import { balanceToDecimal } from "@src/app/(home)/SwapForm/service/balanceTo"
import Button from "@src/components/Button/Button"
import { WidgetCardTimer } from "@src/components/History/Widget/WidgetCardTimer"
import { LIST_NATIVE_TOKENS } from "@src/constants/tokens"
import { useNetworkTokens } from "@src/hooks/useNetworkTokens"
import { useSwap } from "@src/hooks/useSwap"
import { useHistoryStore } from "@src/providers/HistoryStoreProvider"
import { useWalletSelector } from "@src/providers/WalletSelectorProvider"
import { type HistoryData, HistoryStatus } from "@src/stores/historyStore"
import { type NearTX, QueueTransactions } from "@src/types/interfaces"
import { TransactionMethod } from "@src/types/solver0"
import { NEAR_EXPLORER } from "@src/utils/environment"
import {
  smallBalanceToFormat,
  tokenBalanceToFormatUnits,
} from "@src/utils/token"

const PLACEHOLDER = "XX"
const WAIT_MORE_2MIN = 120000

type Props = {
  onCloseHistory?: () => void
  withCloseHistory?: boolean
}

const WidgetCard = ({
  intentId,
  hash,
  details,
  timestamp,
  status,
  onCloseHistory,
  withCloseHistory,
}: HistoryData & Props) => {
  const [title, setTitle] = useState("")
  const [subTitle, setSubTitle] = useState("")
  const { closeHistoryItem } = useHistoryStore((state) => state)
  const { getTokensDataByIds } = useNetworkTokens()
  const { selector, accountId } = useWalletSelector()
  const { callRequestRollbackIntent } = useSwap({ selector, accountId })

  const handlePrepareMeta = (
    details: HistoryData["details"],
    typeQueueTransactions?: QueueTransactions
  ): { title: string; subTitle?: string } => {
    const tokenInValue = smallBalanceToFormat(
      balanceToDecimal(
        (details?.tokenIn || details?.recoverDetails?.send?.amount) ?? "0",
        details?.selectedTokenIn?.decimals ?? 0
      )
    )
    const tokenOutValue = smallBalanceToFormat(
      balanceToDecimal(
        details?.tokenOut ?? "0",
        details?.selectedTokenOut?.decimals ?? 0
      )
    )

    switch (typeQueueTransactions) {
      case QueueTransactions.CREATE_INTENT:
        switch (status) {
          case HistoryStatus.FAILED:
            return {
              title: "Transaction failed",
              subTitle: `You received ${smallBalanceToFormat(tokenOutValue) ?? PLACEHOLDER} ${details?.selectedTokenOut?.symbol ?? PLACEHOLDER}.`,
            }

          case HistoryStatus.ROLLED_BACK:
          case HistoryStatus.INTENT_1_ROLLED_BACK: {
            const tokensData = getTokensDataByIds([
              details?.recoverDetails?.send?.token_id ?? "",
            ])
            if (!tokensData.length && !details?.tokenIn) {
              return {
                title: "Rolled back!",
                subTitle: "Swap rolled request is completed.",
              }
            }
            const tokenIn = tokensData.length
              ? tokenBalanceToFormatUnits({
                  balance: details?.recoverDetails?.send.amount as string,
                  decimals: tokensData[0].decimals as number,
                })
              : "0"
            return {
              title: "Swap rolled back!",
              subTitle: `You received back ${(Number.parseFloat(tokenInValue) ? tokenInValue : smallBalanceToFormat(tokenIn)) ?? PLACEHOLDER} ${(details?.selectedTokenIn?.symbol || tokensData[0]?.symbol) ?? PLACEHOLDER}.`,
            }
          }

          // to support new intent
          // TODO : remove all stuff related to old Intents
          case HistoryStatus.COMPLETED:
          case HistoryStatus.INTENT_1_EXECUTED:
            return {
              title: "Transaction complete!",
              subTitle: `You received ${smallBalanceToFormat(tokenOutValue) ?? PLACEHOLDER} ${details?.selectedTokenOut?.symbol ?? PLACEHOLDER}.`,
            }

          default:
            if (!details?.tokenIn || !details?.tokenOut) {
              const tokensData = getTokensDataByIds([
                details?.recoverDetails?.send?.token_id ?? "",
                details?.recoverDetails?.receive?.token_id ?? "",
              ])
              if (tokensData.length !== 2) {
                return {
                  title: `Swapping ${PLACEHOLDER} ${PLACEHOLDER} for ${PLACEHOLDER} ${PLACEHOLDER}`,
                }
              }
              const tokenIn = tokenBalanceToFormatUnits({
                balance: details?.recoverDetails?.send.amount as string,
                decimals: tokensData[0].decimals as number,
              })
              const tokenOut = tokenBalanceToFormatUnits({
                balance: details?.recoverDetails?.receive.amount as string,
                decimals: tokensData[1].decimals as number,
              })
              return {
                title: `Swapping ${smallBalanceToFormat(tokenIn ?? "0") ?? PLACEHOLDER} ${tokensData[0].symbol} for ${smallBalanceToFormat(tokenOut ?? "0") ?? PLACEHOLDER} ${tokensData[1].symbol}`,
              }
            }

            return {
              title: `Swapping ${tokenInValue} ${details?.selectedTokenIn?.symbol} for ${tokenOutValue} ${details?.selectedTokenOut?.symbol}`,
            }
        }

      case QueueTransactions.STORAGE_DEPOSIT_TOKEN_IN:
      case QueueTransactions.STORAGE_DEPOSIT_TOKEN_OUT:
        return {
          title: `Storage deposit on ${details?.transaction?.receiver_id ?? PLACEHOLDER} by ${details?.transaction?.signer_id ?? PLACEHOLDER}`,
        }

      case QueueTransactions.DEPOSIT: {
        let title = "Wrapped complete!"
        let subTitle = ""
        const extractMsg = details?.recoverDetails?.msg?.split(" ")
        if (extractMsg?.length && extractMsg.length >= 3) {
          const [action, amount, tokenIn] = extractMsg
          const tokenNearNative = LIST_NATIVE_TOKENS.find(
            (token) => token.defuse_asset_id === "near:mainnet:native"
          )
          assert(tokenNearNative, "Token not found")
          const formattedAmount = smallBalanceToFormat(
            formatUnits(BigInt(amount), tokenNearNative.decimals) ?? ""
          )
          title = `${action} complete!`
          subTitle = `Wrapped ${formattedAmount} ${tokenIn} to ${formattedAmount} w${tokenIn}`
        }

        return {
          title,
          subTitle,
        }
      }

      case QueueTransactions.WITHDRAW: {
        const amount = details?.recoverDetails?.amount
          ? details?.recoverDetails.amount
          : "0"
        const tokenNearNative = LIST_NATIVE_TOKENS.find(
          (token) => token.defuse_asset_id === "near:mainnet:native"
        )
        assert(tokenNearNative, "Token not found")
        const formattedAmount = smallBalanceToFormat(
          formatUnits(BigInt(amount as string), tokenNearNative.decimals) ?? ""
        )
        return {
          title: "Transaction complete!",
          subTitle: `Unwrapped ${formattedAmount} w${tokenNearNative.symbol} to ${formattedAmount} ${tokenNearNative.symbol}`,
        }
      }

      default:
        return { title: "Unknown" }
    }
  }

  const handleGetTypeOfQueueTransactions = (
    transaction: NearTX["transaction"]
  ): QueueTransactions | undefined => {
    const transactionMethodName =
      transaction.actions[0].FunctionCall.method_name
    if (
      transactionMethodName === TransactionMethod.FT_TRANSFER_CALL ||
      transactionMethodName === TransactionMethod.ROLLBACK_INTENT ||
      transactionMethodName === TransactionMethod.NATIVE_ON_TRANSFER
    ) {
      return QueueTransactions.CREATE_INTENT
    }
    if (transactionMethodName === TransactionMethod.STORAGE_DEPOSIT) {
      // No matter is IN or OUT as QueueTransactions.STORAGE_DEPOSIT_TOKEN_OUT
      return QueueTransactions.STORAGE_DEPOSIT_TOKEN_IN
    }
    if (transactionMethodName === TransactionMethod.NEAR_DEPOSIT) {
      return QueueTransactions.DEPOSIT
    }
    if (transactionMethodName === TransactionMethod.NEAR_WITHDRAW) {
      return QueueTransactions.WITHDRAW
    }
  }

  const handleCloseHistory = () => {
    if (onCloseHistory) {
      return onCloseHistory()
    }
    closeHistoryItem(hash)
  }

  const handleRollbackIntent = async () => {
    await callRequestRollbackIntent({ id: intentId })
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <reason>
  useEffect(() => {
    if (details?.transaction) {
      const typeQueueTransactions = handleGetTypeOfQueueTransactions(
        details.transaction as NearTX["transaction"]
      )
      const { title, subTitle } = handlePrepareMeta(
        details,
        typeQueueTransactions
      )
      setTitle(title)
      subTitle && setSubTitle(subTitle)
    }
    return () => {
      setTitle("")
    }
  }, [details])

  return (
    <div className="max-w-full md:max-w-[260px] min-h-[152px] flex flex-col justify-between mx-5 my-2 p-3 card-history bg-white rounded-[8px] border overflow-hidden dark:border-silver-300 dark:bg-black-900">
      <div className="flex justify-between items-center mb-3">
        {(status === HistoryStatus.COMPLETED ||
          status === HistoryStatus.INTENT_1_EXECUTED ||
          status === HistoryStatus.ROLLED_BACK ||
          details?.transaction?.actions[0].FunctionCall.method_name ===
            "storage_deposit") && (
          <Image
            src="/static/icons/CheckCircle.svg"
            width={28}
            height={28}
            alt="CheckCircle"
          />
        )}
        {status === HistoryStatus.FAILED && (
          <Image
            src="/static/icons/Failed.svg"
            width={28}
            height={28}
            alt="Failed"
          />
        )}
        {status !== HistoryStatus.COMPLETED &&
          status !== HistoryStatus.INTENT_1_EXECUTED &&
          status !== HistoryStatus.FAILED &&
          status !== HistoryStatus.ROLLED_BACK &&
          details?.transaction?.actions[0].FunctionCall.method_name !==
            "storage_deposit" && <Spinner size="3" />}

        {withCloseHistory && (
          <button
            type={"button"}
            onClick={handleCloseHistory}
            className="h-[24px] w-[24px] flex justify-center items-center dark:bg-black-800 rounded-md"
          >
            <Cross1Icon width={16} height={16} />
          </button>
        )}
      </div>
      <Text size="1" weight="bold" className="mb-1">
        {title.length > 37 ? `${title.substring(0, 37)}...` : title}
      </Text>
      <Text size="1" className="mb-3">
        {subTitle && subTitle}
        {!subTitle && (
          <WidgetCardTimer
            timeLeft={Math.floor(timestamp / 1e6 + WAIT_MORE_2MIN)}
          />
        )}
      </Text>
      <div className="flex justify-start items-center gap-3 cursor-pointer">
        {status !== HistoryStatus.COMPLETED &&
        status !== HistoryStatus.INTENT_1_EXECUTED &&
        status !== HistoryStatus.FAILED &&
        status !== HistoryStatus.ROLLED_BACK &&
        details?.transaction?.actions[0].FunctionCall.method_name ===
          TransactionMethod.FT_TRANSFER_CALL ? (
          <Button
            size="sm"
            variant="soft"
            className="bg-black cursor-pointer dark:bg-white-300 dark:text-black-800"
            onClick={handleRollbackIntent}
          >
            Cancel Swap
          </Button>
        ) : null}
        <Link
          className="h-[32px] flex items-center gap-[4px] border border-gray-600 rounded-[3px] cursor-pointer px-3"
          href={`${NEAR_EXPLORER}/txns/${hash}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Text
            size="1"
            className="text-gray-600 text-nowrap dark:text-gray-500"
          >
            See in Explorer
          </Text>
          <ArrowTopRightIcon
            width={16}
            height={16}
            className="dark:text-gray-500"
          />
        </Link>
      </div>
    </div>
  )
}

export default WidgetCard

function assert(condition: unknown, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg)
  }
}
