"use client"

import { Spinner, Text } from "@radix-ui/themes"
import { balanceToDecimal } from "@src/app/(home)/SwapForm/service/balanceTo"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import React, { useEffect, useRef, useState } from "react"
import { v4 } from "uuid"

import { usePublishIntentSolver0 } from "@src/api/hooks/intent/usePublishIntentSolver0"
import type { PublishAtomicNearIntentProps } from "@src/api/intent"
import { getNearBlockById } from "@src/api/transaction"

import ModalDialog from "@src/components/Modal/ModalDialog"
import type { ModalReviewSwapPayload } from "@src/components/Modal/ModalReviewSwap"
import { CONFIRM_SWAP_LOCAL_KEY } from "@src/constants/contracts"
import { UseQueryCollectorKeys } from "@src/hooks/useQuery"
import {
  type CallRequestIntentProps,
  type EstimateQueueTransactions,
  useSwap,
} from "@src/hooks/useSwap"
import { useHistoryStore } from "@src/providers/HistoryStoreProvider"
import { useModalStore } from "@src/providers/ModalStoreProvider"
import { useNotificationStore } from "@src/providers/NotificationProvider"
import { useWalletSelector } from "@src/providers/WalletSelectorProvider"
import { ModalType } from "@src/stores/modalStore"
import { NotificationType } from "@src/stores/notificationStore"
import {
  type NearBlock,
  type NearTX,
  QueueTransactions,
} from "@src/types/interfaces"
import { sendGaEvent } from "@src/utils/googleAnalytics"
import { generateIntentID } from "@src/utils/intent"
import { smallBalanceToFormat } from "@src/utils/token"

export interface ModalConfirmSwapPayload extends CallRequestIntentProps {}

const ModalConfirmSwap = () => {
  const [transactionQueue, setTransactionQueue] = useState(1)
  const [dataFromLocal, setDataFromLocal] = useState<ModalConfirmSwapPayload>()
  const [isReadingHistory, setIsReadingHistory] = useState(false)
  const { selector, accountId } = useWalletSelector()
  const [isErrorTransaction, setIsErrorTransaction] = useState(false)
  const {
    callRequestCreateIntent,
    nextEstimateQueueTransactions,
    getEstimateQueueTransactions,
    isProcessing,
    isError: isErrorSwap,
  } = useSwap({
    selector,
    accountId,
  })
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { onCloseModal, payload } = useModalStore((state) => state)
  const modalPayload = payload as ModalReviewSwapPayload
  const {
    data: historyData,
    updateOneHistory,
    isFetched,
  } = useHistoryStore((state) => state)
  const { mutate, isSuccess, isError } = usePublishIntentSolver0()
  const ongoingPublishingRef = useRef(false)
  const { togglePreview } = useHistoryStore((state) => state)

  const getSwapFromLocal = (): ModalConfirmSwapPayload | null => {
    const getConfirmSwapFromLocal = localStorage.getItem(CONFIRM_SWAP_LOCAL_KEY)
    if (!getConfirmSwapFromLocal) return null
    const parsedData: { data: ModalConfirmSwapPayload } = JSON.parse(
      getConfirmSwapFromLocal
    )
    return parsedData.data
  }

  // Storing data for recovering progress of transaction track
  const setSwapToLocal = (inputs: ModalConfirmSwapPayload) => {
    localStorage.setItem(
      CONFIRM_SWAP_LOCAL_KEY,
      JSON.stringify({ data: inputs })
    )
  }

  const handleBatchCleanupQuery = (keys: string[]) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const key of keys) params.delete(key)
    router.replace(`${pathname}?${params}`)
  }

  const handleBatchCreateSwapQuery = ({
    intentId,
  }: {
    intentId: string
  }): boolean => {
    try {
      const queryParams = new URLSearchParams(searchParams.toString())
      queryParams.set("modalType", ModalType.MODAL_CONFIRM_SWAP)
      queryParams.set("intentId", intentId)
      const updatedQueryString = queryParams.toString()
      router.replace(`${pathname}?${updatedQueryString}`)
      return true
    } catch (e) {
      console.log("ModalConfirmSwap handleBatchCreateSwapQuery:", e)
      return false
    }
  }

  const handleEstimateQueueTransactions = async (
    intentId: string
  ): Promise<EstimateQueueTransactions> => {
    const { queueInTrack, queueTransactionsTrack } =
      await getEstimateQueueTransactions({
        tokenIn: modalPayload.tokenIn,
        tokenOut: modalPayload.tokenOut,
        selectedTokenIn: modalPayload.selectedTokenIn,
        selectedTokenOut: modalPayload.selectedTokenOut,
        intentId,
      })
    setTransactionQueue(queueInTrack)
    return {
      queueInTrack,
      queueTransactionsTrack,
    }
  }

  const { setNotification } = useNotificationStore((state) => state)

  const handlePublishIntentToSolver = (
    inputs: ModalConfirmSwapPayload,
    receivedIntentId: string | undefined,
    receivedHash: string
  ): void => {
    if (!receivedIntentId) {
      setNotification({
        id: v4(),
        message: "Intent hasn't been published!",
        type: NotificationType.ERROR,
      })
      return
    }
    mutate({
      hash: receivedHash,
      defuseAssetIdIn: inputs.selectedTokenIn.defuse_asset_id,
      accountId: accountId,
      intentId: receivedIntentId,
      defuseAssetIdOut: inputs.selectedTokenOut.defuse_asset_id,
      unitsAmountIn: inputs.tokenIn,
      unitsAmountOut: inputs.tokenOut,
    } as PublishAtomicNearIntentProps)
  }

  const handleTrackSwap = async () => {
    if (ongoingPublishingRef.current) return

    if (!modalPayload) {
      const data = getSwapFromLocal()

      if (data) {
        setDataFromLocal(data)

        const receivedHash = searchParams.get(
          UseQueryCollectorKeys.TRANSACTION_HASHS
        )
        const receivedIntentId = searchParams.get(
          UseQueryCollectorKeys.INTENT_ID
        )

        const isBatchHashes = receivedHash?.split(",")
        if (!isBatchHashes) {
          console.log(
            "EstimateQueueTransactions has stopped due to the hash is missing, UseQueryCollectorKeys.TRANSACTION_HASHS"
          )
          return
        }
        const lastInTransactionHashes =
          isBatchHashes?.length > 1 ? isBatchHashes.at(-1) : isBatchHashes[0]

        const isCreateIntentRequest =
          data.estimateQueue.queueTransactionsTrack.includes(
            QueueTransactions.CREATE_INTENT
          )

        const { value, done, failure } = await nextEstimateQueueTransactions({
          estimateQueue: data.estimateQueue,
          receivedHash: lastInTransactionHashes as string,
        })

        if (failure) {
          setIsErrorTransaction(true)
          return
        }

        const inputs = {
          tokenIn: data.tokenIn,
          tokenOut: data.tokenOut,
          selectedTokenIn: data.selectedTokenIn,
          selectedTokenOut: data.selectedTokenOut,
          intentId: data.intentId,
          estimateQueue: value,
        }

        if (done && isCreateIntentRequest) {
          ongoingPublishingRef.current = true
          handlePublishIntentToSolver(
            inputs,
            receivedIntentId ?? data.intentId,
            lastInTransactionHashes as string
          )
          return
        }
        if (done) {
          onCloseModal()
          router.replace(pathname)
          return
        }

        setIsReadingHistory(true)

        handleBatchCleanupQuery([
          UseQueryCollectorKeys.INTENT_ID,
          UseQueryCollectorKeys.TRANSACTION_HASHS,
        ])

        setSwapToLocal(inputs)
        handleBatchCreateSwapQuery({
          intentId: data.intentId as string,
        })
        await callRequestCreateIntent(inputs)
      }
      return
    }

    const newIntentId = await generateIntentID()

    if (
      handleBatchCreateSwapQuery({
        intentId: newIntentId,
      })
    ) {
      const estimateQueue = await handleEstimateQueueTransactions(newIntentId)

      setIsReadingHistory(true)

      const inputs = {
        tokenIn: modalPayload.tokenIn,
        tokenOut: modalPayload.tokenOut,
        selectedTokenIn: modalPayload.selectedTokenIn,
        selectedTokenOut: modalPayload.selectedTokenOut,
        intentId: newIntentId,
        estimateQueue,
        accountFrom: modalPayload?.accountFrom,
        accountTo: modalPayload?.accountTo,
        solverId: modalPayload?.solverId,
      }

      setSwapToLocal(inputs)

      ongoingPublishingRef.current = true
      handleCallCreateIntent(inputs, estimateQueue)
    }
  }

  const handleCallCreateIntent = async (
    inputs: CallRequestIntentProps,
    estimateQueue: CallRequestIntentProps["estimateQueue"]
  ): Promise<void> => {
    const callResult: NearTX[] | undefined = await callRequestCreateIntent(
      inputs,
      (mutate) => setSwapToLocal(mutate)
    )
    if (callResult?.length) {
      const timestamps = await Promise.all(
        callResult.map(async (result) => {
          const { result: resultBlock } = (await getNearBlockById(
            result?.transaction.hash as string
          )) as NearBlock
          return (
            resultBlock?.header?.timestamp ??
            Number(`${new Date().getTime()}${"0".repeat(6)}`)
          )
        })
      )

      let resultSequence = 0
      for (const result of callResult) {
        updateOneHistory({
          intentId: inputs.intentId as string,
          hash: result?.transaction.hash as string,
          timestamp: timestamps[resultSequence] ?? 0,
          details: {
            tokenIn: modalPayload.tokenIn,
            tokenOut: modalPayload.tokenOut,
            selectedTokenIn: modalPayload.selectedTokenIn,
            selectedTokenOut: modalPayload.selectedTokenOut,
          },
        })

        const { value, done, failure } = await nextEstimateQueueTransactions({
          estimateQueue: estimateQueue,
          receivedHash: result?.transaction.hash,
        })

        // Toggle preview for the main transaction in batch
        if (failure) {
          setIsErrorTransaction(true)
        } else if (resultSequence === callResult.length - 1) {
          if (!done) {
            handleCallCreateIntent(
              {
                ...inputs,
                estimateQueue: value,
              },
              value
            )
            onCloseModal()
            router.replace(pathname)
          } else {
            togglePreview(result?.transaction.hash as string)
            handlePublishIntentToSolver(
              Object.assign(inputs, {
                selectedTokenIn: modalPayload.selectedTokenIn,
              }),
              inputs.intentId,
              result?.transaction.hash as string
            )
          }
        }

        resultSequence++
      }
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <reason>
  useEffect(() => {
    if (isFetched && !isProcessing) {
      handleTrackSwap()
    }
  }, [historyData, isFetched, isProcessing])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <reason>
  useEffect(() => {
    if (isSuccess) {
      onCloseModal()
      ongoingPublishingRef.current = false
      router.replace(pathname)

      sendGaEvent({
        name: "publish_intent",
        parameters: { status: "success" },
      })
    }
    if (isError || isErrorTransaction) {
      ongoingPublishingRef.current = false
      setNotification({
        id: v4(),
        message: "Intent hasn't been published!",
        type: NotificationType.ERROR,
      })

      sendGaEvent({
        name: "publish_intent",
        parameters: { status: "fail" },
      })
    }
  }, [isSuccess, isError, isErrorTransaction])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <reason>
  useEffect(() => {
    if (isErrorSwap) {
      onCloseModal()
      ongoingPublishingRef.current = false
      router.replace(pathname)
      setNotification({
        id: "418",
        message: isErrorSwap,
        type: NotificationType.ERROR,
      })
    }
  }, [isErrorSwap])

  if (!isReadingHistory) {
    return null
  }

  const tokenInValue = balanceToDecimal(
    (modalPayload?.tokenIn || dataFromLocal?.tokenIn) ?? "0",
    (modalPayload?.selectedTokenIn.decimals ||
      dataFromLocal?.selectedTokenIn.decimals) ??
      0
  )
  const tokenOutValue = balanceToDecimal(
    (modalPayload?.tokenOut || dataFromLocal?.tokenOut) ?? "0",
    (modalPayload?.selectedTokenOut.decimals ||
      dataFromLocal?.selectedTokenOut.decimals) ??
      0
  )

  return (
    <ModalDialog>
      <div className="flex flex-col min-h-[256px] max-h-[680px] h-full p-5">
        <div className="relative flex justify-between items-start mb-[44px]">
          <div className="w-full shrink absolute relative top-[30px] left-[50%] -translate-x-2/4 flex justify-center items-center">
            <div className="relative w-[56px] h-[56px]">
              <Image
                src="/static/icons/Wallet.svg"
                alt="Wallet Icon"
                width={56}
                height={56}
              />
              <div className="absolute -top-[6px] -right-[10px] w-[20px] h-[20px] flex justify-center items-center rounded-full bg-primary">
                <Text size="2" weight="medium" className="text-white">
                  {transactionQueue}
                </Text>
              </div>
            </div>
          </div>
          <button
            type={"button"}
            className="shrink-0 w-[40px] h-[40px] flex justify-center items-center"
            onClick={onCloseModal}
          >
            <Image
              src="/static/icons/close.svg"
              alt="Close Icon"
              width={14}
              height={14}
            />
          </button>
        </div>
        <div className="w-full flex flex-col text-center text-black-400 gap-1 mb-4 dark:text-gray-500">
          <Text size="4" weight="bold">
            Confirm swap
          </Text>
          {isProcessing ? (
            <div className="flex justify-center">
              <Spinner loading={isProcessing} />
            </div>
          ) : (
            <Text size="2" weight="bold" className="text-gray-600">
              Please confirm transaction in your wallet.
            </Text>
          )}
        </div>
        <div className="flex justify-center">
          <div className="flex justify-center items-center gap-1 px-2.5 py-1 bg-gray-950 rounded-full">
            <Text size="2" weight="medium" className="text-black-400">
              {`${smallBalanceToFormat(tokenInValue, 7)} ${modalPayload?.selectedTokenIn?.symbol || dataFromLocal?.selectedTokenIn?.symbol || ""}`}
            </Text>
            <Image
              src="/static/icons/arrow-right.svg"
              alt="Arrow Icon"
              width={24}
              height={24}
            />
            <Text size="2" weight="medium" className="text-black-400">
              {`${smallBalanceToFormat(tokenOutValue, 7)} ${modalPayload?.selectedTokenOut?.symbol || dataFromLocal?.selectedTokenOut?.symbol || ""}`}
            </Text>
          </div>
        </div>
      </div>
    </ModalDialog>
  )
}

export default ModalConfirmSwap
