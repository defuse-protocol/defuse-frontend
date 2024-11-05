"use client"

import React from "react"

import { safeBalanceToDecimal } from "@src/app/(home)/SwapForm/service/balanceTo"
import WidgetCardDeposit from "@src/components/History/Widget/WidgetCardDeposit"
import WidgetCardFailed from "@src/components/History/Widget/WidgetCardFailed"
import WidgetCardLoading from "@src/components/History/Widget/WidgetCardLoading"
import WidgetCardRollback from "@src/components/History/Widget/WidgetCardRollback"
import WidgetCardStorageDeposit from "@src/components/History/Widget/WidgetCardStorageDeposit"
import WidgetCardSwap from "@src/components/History/Widget/WidgetCardSwap"
import WidgetCardWithdraw from "@src/components/History/Widget/WidgetCardWithdraw"
import { NEAR_TOKEN_META } from "@src/constants/tokens"
import { useSwap } from "@src/hooks/useSwap"
import { useWalletSelector } from "@src/providers/WalletSelectorProvider"
import { type HistoryData, HistoryStatus } from "@src/stores/historyStore"
import type { NetworkTokenWithSwapRoute } from "@src/types/interfaces"

type Props = {
  onCloseHistory?: () => void
  withCloseHistory?: boolean
}

const WidgetCardTransaction = ({
  intentId,
  hash,
  proof,
  details,
  timestamp,
  status,
}: HistoryData & Props) => {
  const { selector, accountId } = useWalletSelector()
  const { callRequestRollbackIntent } = useSwap({ selector, accountId })

  const iTokenDetailMissing =
    !details?.tokenIn ||
    !details.tokenOut ||
    !details.selectedTokenIn ||
    !details.selectedTokenOut

  const tokenInValue = safeBalanceToDecimal(
    details?.tokenIn ?? "0",
    details?.selectedTokenIn?.decimals ?? 0
  )
  const tokenOutValue = safeBalanceToDecimal(
    details?.tokenOut ?? "0",
    details?.selectedTokenOut?.decimals ?? 0
  )

  switch (status) {
    case HistoryStatus.FAILED:
      if (!details?.transaction?.actions || !hash || iTokenDetailMissing) {
        return <WidgetCardLoading />
      }
      return (
        <WidgetCardFailed
          actions={details.transaction.actions}
          tokenIn={tokenInValue}
          tokenOut={tokenOutValue}
          selectedTokenIn={details.selectedTokenIn as NetworkTokenWithSwapRoute}
          selectedTokenOut={
            details.selectedTokenOut as NetworkTokenWithSwapRoute
          }
          hash={hash}
        />
      )

    case HistoryStatus.AVAILABLE:
    case HistoryStatus.COMPLETED:
    case HistoryStatus.INTENT_1_AVAILABLE:
    case HistoryStatus.INTENT_1_EXECUTED:
      if (iTokenDetailMissing || !hash) {
        return <WidgetCardLoading />
      }
      return (
        <WidgetCardSwap
          hash={hash}
          proof={proof ?? undefined}
          status={status}
          intentId={intentId}
          tokenIn={tokenInValue}
          tokenOut={tokenOutValue}
          selectedTokenIn={details.selectedTokenIn as NetworkTokenWithSwapRoute}
          selectedTokenOut={
            details.selectedTokenOut as NetworkTokenWithSwapRoute
          }
          timestamp={timestamp}
          handleCloseIntent={callRequestRollbackIntent}
          receiverId={details.recoverDetails?.receiverId ?? ""}
        />
      )

    case HistoryStatus.ROLLED_BACK:
    case HistoryStatus.INTENT_1_ROLLED_BACK:
      if (!details?.transaction?.actions || !hash || iTokenDetailMissing) {
        return <WidgetCardLoading />
      }
      return (
        <WidgetCardRollback
          actions={details.transaction.actions}
          tokenIn={tokenInValue}
          tokenOut={tokenOutValue}
          selectedTokenIn={details.selectedTokenIn as NetworkTokenWithSwapRoute}
          selectedTokenOut={
            details.selectedTokenOut as NetworkTokenWithSwapRoute
          }
          hash={hash}
        />
      )

    case HistoryStatus.WITHDRAW: {
      if (!details?.transaction || !hash || iTokenDetailMissing) {
        return <WidgetCardLoading />
      }
      const recoverAmount = (
        Number(details.recoverDetails?.amount ?? "0") /
        10 ** 24
      ).toString()
      return (
        <WidgetCardWithdraw
          accountId={details.transaction.signer_id as string}
          tokenOut={recoverAmount ?? tokenOutValue}
          selectedTokenOut={
            details.selectedTokenOut as NetworkTokenWithSwapRoute
          }
          hash={hash}
        />
      )
    }

    case HistoryStatus.DEPOSIT:
      if (!details?.transaction || !hash || iTokenDetailMissing) {
        return <WidgetCardLoading />
      }
      return (
        <WidgetCardDeposit
          accountId={details.transaction.signer_id as string}
          tokenIn={tokenInValue}
          selectedTokenIn={details.selectedTokenIn as NetworkTokenWithSwapRoute}
          hash={hash}
        />
      )

    case HistoryStatus.STORAGE_DEPOSIT: {
      if (
        !details?.recoverDetails?.receiverId ||
        !hash ||
        !details.recoverDetails?.amount
      ) {
        return <WidgetCardLoading />
      }
      const storageAmount = safeBalanceToDecimal(
        details.recoverDetails.amount,
        NEAR_TOKEN_META.decimals
      )
      return (
        <WidgetCardStorageDeposit
          receiverId={details.recoverDetails.receiverId}
          amount={storageAmount}
          hash={hash}
        />
      )
    }
  }

  return <WidgetCardLoading />
}

export default WidgetCardTransaction
