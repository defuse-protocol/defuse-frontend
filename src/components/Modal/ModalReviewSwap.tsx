"use client"

import { Blockquote, Text } from "@radix-ui/themes"
import { formatUnits, parseUnits } from "ethers"
import Image from "next/image"
import React, { useEffect, useState } from "react"

import { balanceToDecimal } from "@src/app/(home)/SwapForm/service/balanceTo"
import { getBalanceNearAllowedToSwap } from "@src/app/(home)/SwapForm/service/getBalanceNearAllowedToSwap"
import Button from "@src/components/Button/Button"
import CardSwap from "@src/components/Card/CardSwap"
import ModalDialog from "@src/components/Modal/ModalDialog"
import { NEAR_TOKEN_META, W_NEAR_TOKEN_META } from "@src/constants/tokens"
import { useCalculateTokenToUsd } from "@src/hooks/useCalculateTokenToUsd"
import useSwapEstimateBot from "@src/hooks/useSwapEstimateBot"
import { useTimeFormatMinutes } from "@src/hooks/useTimeFormat"
import { useTimer } from "@src/hooks/useTimer"
import { useModalStore } from "@src/providers/ModalStoreProvider"
import { useWalletSelector } from "@src/providers/WalletSelectorProvider"
import { ModalType } from "@src/stores/modalStore"
import {
  BlockchainEnum,
  ContractIdEnum,
  type NetworkToken,
} from "@src/types/interfaces"
import { sendGaEvent } from "@src/utils/googleAnalytics"
import parseDefuseAsset from "@src/utils/parseDefuseAsset"
import { smallBalanceToFormat } from "@src/utils/token"

export type ModalReviewSwapPayload = {
  tokenIn: string
  tokenOut: string
  selectedTokenIn: NetworkToken
  selectedTokenOut: NetworkToken
  isNativeInSwap: boolean
  accountFrom?: string
  accountTo?: string
  solverId?: string
}

const RECALCULATE_ESTIMATION_TIME_SECS = 15

const ModalReviewSwap = () => {
  const { onCloseModal, setModalType, payload } = useModalStore(
    (state) => state
  )
  const [isFetching, setIsFetching] = useState(false)
  const { getSwapEstimateBot } = useSwapEstimateBot()
  const [convertPayload, setConvertPayload] = useState<ModalReviewSwapPayload>(
    payload as ModalReviewSwapPayload
  )
  const {
    priceToUsd: priceToUsdTokenIn,
    calculateTokenToUsd: calculateTokenToUsdTokenIn,
  } = useCalculateTokenToUsd()
  const {
    priceToUsd: priceToUsdTokenOut,
    calculateTokenToUsd: calculateTokenToUsdTokenOut,
  } = useCalculateTokenToUsd()
  const [isWNearConjunctionRequired, setIsWNearConjunctionRequired] =
    useState(false)
  const { accountId } = useWalletSelector()

  const recalculateEstimation = async () => {
    try {
      setIsFetching(true)
      const pair = [
        convertPayload.selectedTokenIn.address as string,
        convertPayload.selectedTokenOut.address as string,
      ]
      // Not needed recalculation if ratio is 1:1
      if (
        pair.includes(NEAR_TOKEN_META.address) &&
        pair.includes(W_NEAR_TOKEN_META.address)
      )
        return

      handleCheckNativeBalance()

      const unitsTokenIn = parseUnits(
        convertPayload.tokenIn,
        convertPayload.selectedTokenIn.decimals as number
      ).toString()

      const { bestEstimate } = await getSwapEstimateBot({
        tokenIn: convertPayload.selectedTokenIn.defuse_asset_id,
        tokenOut: convertPayload.selectedTokenOut.defuse_asset_id,
        amountIn: unitsTokenIn,
      })
      // ToDo: Here we need to handle the issue when all of a sudden there is no quotes
      if (bestEstimate === null) return
      const formattedOut = bestEstimate
        ? formatUnits(
            BigInt(bestEstimate.amount_out),
            convertPayload.selectedTokenOut.decimals
          )
        : "0"
      setConvertPayload({ ...convertPayload, tokenOut: formattedOut })
    } catch (e) {
      console.error(
        "Failed to recalculate swap estimation in Modal Review Swap",
        e
      )
    } finally {
      setIsFetching(false)
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: `calculateTokenToUsdTokenIn` and `calculateTokenToUsdTokenOut` are not stable references
  useEffect(() => {
    calculateTokenToUsdTokenIn(
      convertPayload.tokenIn,
      convertPayload.selectedTokenIn
    )
    calculateTokenToUsdTokenOut(
      convertPayload.tokenOut,
      convertPayload.selectedTokenOut
    )
  }, [convertPayload])

  const { timeLeft } = useTimer(
    RECALCULATE_ESTIMATION_TIME_SECS,
    recalculateEstimation
  )
  const { formatTwoNumbers } = useTimeFormatMinutes()

  const handleCheckNativeBalance = async (): Promise<void> => {
    const result = parseDefuseAsset(
      convertPayload.selectedTokenIn.defuse_asset_id
    )
    if (
      result?.blockchain !== BlockchainEnum.Near ||
      result?.contractId !== ContractIdEnum.Native ||
      !accountId
    ) {
      return
    }
    const balanceNear = await getBalanceNearAllowedToSwap(accountId)
    const isLackOfBalance = BigInt(convertPayload.tokenIn) > BigInt(balanceNear)
    setIsWNearConjunctionRequired(isLackOfBalance)
  }

  const handleConfirmSwap = async () => {
    sendGaEvent({
      name: "confirm_swap",
      parameters: { status: "success" },
    })
    setModalType(ModalType.MODAL_CONFIRM_SWAP, payload)
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <reason>
  useEffect(() => {
    void handleCheckNativeBalance()
  }, [])

  return (
    <ModalDialog>
      <div className="flex flex-col min-h-[256px] max-h-[680px] h-full p-5">
        <div className="flex justify-between items-center mb-[44px]">
          <div className="relative w-full shrink text-center text-black-400">
            <Text size="4" weight="bold" className="dark:text-gray-500">
              Review swap
            </Text>
            <div className="absolute top-[30px] left-[50%] -translate-x-2/4 text-gray-600">
              <Text size="2" weight="medium">
                00:{formatTwoNumbers(timeLeft)}
              </Text>
            </div>
          </div>
          <button type={"button"} className="shrink-0" onClick={onCloseModal}>
            <Image
              src="/static/icons/close.svg"
              alt="Close Icon"
              width={14}
              height={14}
            />
          </button>
        </div>
        <CardSwap
          amountIn={smallBalanceToFormat(
            balanceToDecimal(
              convertPayload.tokenIn,
              convertPayload.selectedTokenIn.decimals
            ),
            7
          )}
          amountOut={smallBalanceToFormat(
            balanceToDecimal(
              convertPayload.tokenOut,
              convertPayload.selectedTokenOut.decimals
            ),
            7
          )}
          amountInToUsd={
            priceToUsdTokenIn !== "0"
              ? `~$${smallBalanceToFormat(priceToUsdTokenIn, 7)}`
              : ""
          }
          amountOutToUsd={
            priceToUsdTokenOut !== "0"
              ? `~$${smallBalanceToFormat(priceToUsdTokenOut, 7)}`
              : ""
          }
          selectTokenIn={convertPayload.selectedTokenIn}
          selectTokenOut={convertPayload.selectedTokenOut}
        />
        <div className="flex flex-col w-full mb-6 gap-3">
          <div className="flex justify-between items-center">
            <Text size="2" weight="medium" className="text-gray-600">
              Fee
            </Text>
            <div className="px-2.5 py-1 rounded-full bg-green-100">
              <Text size="2" weight="medium" className="text-green">
                Free
              </Text>
            </div>
          </div>
          <div className="flex justify-between items-center gap-3">
            <Text size="2" weight="medium" className="text-gray-600">
              Estimated time
            </Text>
            <Text size="2" weight="medium">
              ~ 2 min
            </Text>
          </div>
          <div className="flex justify-between items-center gap-3">
            <Text size="2" weight="medium" className="text-gray-600">
              Rate
            </Text>
            <div className="flex justify-center items-center gap-2">
              <Text size="2" weight="medium">
                1
              </Text>
              <Text size="2" weight="medium">
                {convertPayload.selectedTokenIn.symbol}
              </Text>
              =
              <Text size="2" weight="medium">
                {(
                  Number(
                    balanceToDecimal(
                      convertPayload.tokenOut,
                      convertPayload.selectedTokenOut.decimals
                    )
                  ) /
                  Number(
                    balanceToDecimal(
                      convertPayload.tokenIn,
                      convertPayload.selectedTokenIn.decimals
                    )
                  )
                ).toFixed(4)}
              </Text>
              <Text size="2" weight="medium">
                {convertPayload.selectedTokenOut.symbol}
              </Text>
            </div>
          </div>
        </div>
        {isWNearConjunctionRequired && (
          <div className="flex flex-col w-full mb-6 gap-3">
            <Blockquote color="cyan">
              Wrapped Near will be used in conjunction with Near to boost your
              current swap experience. All your wNear will be unwrapped and next
              swap will be used only Near.
            </Blockquote>
            <Blockquote color="gray">
              If you want to keep your wNear then please specify the swap amount
              below.
            </Blockquote>
          </div>
        )}
        <Button
          size="lg"
          fullWidth
          onClick={handleConfirmSwap}
          isLoading={isFetching}
        >
          Confirm swap
        </Button>
      </div>
    </ModalDialog>
  )
}

export default ModalReviewSwap
