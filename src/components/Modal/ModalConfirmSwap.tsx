"use client"

import React, { useEffect, useRef, useState } from "react"
import { Spinner, Text } from "@radix-ui/themes"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { parseUnits } from "viem"
import { v4 } from "uuid"

import ModalDialog from "@src/components/Modal/ModalDialog"
import { useModalStore } from "@src/providers/ModalStoreProvider"
import {
  CallRequestIntentProps,
  EstimateQueueTransactions,
  useSwap,
} from "@src/hooks/useSwap"
import { useWalletSelector } from "@src/providers/WalletSelectorProvider"
import { UseQueryCollectorKeys } from "@src/hooks/useQuery"
import { ModalReviewSwapPayload } from "@src/components/Modal/ModalReviewSwap"
import { ModalType } from "@src/stores/modalStore"
import { sha256 } from "@src/actions/crypto"
import { useHistoryStore } from "@src/providers/HistoryStoreProvider"
import { usePublishIntentSolver0 } from "@src/api/hooks/Intent/usePublishIntentSolver0"
import { CONFIRM_SWAP_LOCAL_KEY } from "@src/constants/contracts"
import { smallBalanceToFormat } from "@src/utils/token"
import { LIST_NATIVE_TOKENS } from "@src/constants/tokens"
import { PublishAtomicNearIntentProps } from "@src/api/intent"
import { useNotificationStore } from "@src/providers/NotificationProvider"
import { NotificationType } from "@src/stores/notificationStore"
import { getNearBlockById } from "@src/api/transaction"
import {
  NearBlock,
  NearTX,
  NetworkTokenWithSwapRoute,
  QueueTransactions,
} from "@src/types/interfaces"
import userCancelTx from "@src/utils/userCancelTx"

export interface ModalConfirmSwapPayload extends CallRequestIntentProps {}

const ModalConfirmSwap = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [transactionQueue, setTransactionQueue] = useState(0)
  const [dataFromLocal, setDataFromLocal] = useState<ModalConfirmSwapPayload>()
  const [isReadingHistory, setIsReadingHistory] = useState(false)
  const { selector, accountId } = useWalletSelector()
  const {
    callRequestCreateIntent,
    nextEstimateQueueTransactions,
    getEstimateQueueTransactions,
  } = useSwap({
    selector,
    accountId,
  })
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { onCloseModal, payload } = useModalStore((state) => state)
  const modalPayload = payload as ModalReviewSwapPayload
  const { updateOneHistory } = useHistoryStore((state) => state)
  const { mutate, isSuccess, isError } = usePublishIntentSolver0()
  const [allowOtherModals, setAllowOtherModal] = useState(false)
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
    keys.forEach((key) => params.delete(key))
    router.replace(pathname + "?" + params)
  }

  const handleBatchCreateSwapQuery = ({
    clientId,
  }: {
    clientId: string
  }): boolean => {
    try {
      const queryParams = new URLSearchParams(searchParams.toString())
      queryParams.set("modalType", ModalType.MODAL_CONFIRM_SWAP)
      queryParams.set("clientId", clientId)
      const updatedQueryString = queryParams.toString()
      router.replace(pathname + "?" + updatedQueryString)
      return true
    } catch (e) {
      console.log(`ModalConfirmSwap handleBatchCreateSwapQuery: `, e)
      return false
    }
  }

  const handleEstimateQueueTransactions = async (
    clientId: string
  ): Promise<EstimateQueueTransactions> => {
    const { queueInTrack, queueTransactionsTrack } =
      await getEstimateQueueTransactions({
        tokenIn: modalPayload.tokenIn,
        tokenOut: modalPayload.tokenOut,
        selectedTokenIn: modalPayload.selectedTokenIn,
        selectedTokenOut: modalPayload.selectedTokenOut,
        clientId,
        useNative: modalPayload.isNativeInSwap,
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
    receivedClientId: string | undefined,
    receivedHash: string
  ): void => {
    if (!receivedClientId) {
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
      clientId: receivedClientId,
      defuseAssetIdOut: inputs.selectedTokenOut.defuse_asset_id,
      unitsAmountIn: parseUnits(
        inputs.tokenIn,
        inputs.selectedTokenIn?.decimals as number
      ).toString(),
      unitsAmountOut: parseUnits(
        inputs.tokenOut,
        inputs.selectedTokenOut?.decimals as number
      ).toString(),
    } as PublishAtomicNearIntentProps)
  }

  const handleMutateTokenToNativeSupport = (
    selectedToken: NetworkTokenWithSwapRoute
  ) => {
    const tokenNearNative = LIST_NATIVE_TOKENS.find(
      (token) => token.defuse_asset_id === "near:mainnet:native"
    )
    return {
      ...selectedToken,
      defuse_asset_id: tokenNearNative?.routes
        ? tokenNearNative?.routes[1]
        : "",
    }
  }

  const handleTrackSwap = async () => {
    try {
      if (ongoingPublishingRef.current) return

      if (!modalPayload) {
        const data = getSwapFromLocal()
        setIsProcessing(true)
        if (data) {
          setDataFromLocal(data)

          // TODO Linked to [#1]
          const receivedHash = searchParams.get(
            UseQueryCollectorKeys.TRANSACTION_HASHS
          )
          const receivedClientId = searchParams.get(
            UseQueryCollectorKeys.CLIENT_ID
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

          const { value, done } = await nextEstimateQueueTransactions({
            estimateQueue: data.estimateQueue,
            receivedHash: lastInTransactionHashes as string,
          })

          const isNativeTokenIn = data!.selectedTokenIn.address === "native"
          const mutateSelectedTokenIn = isNativeTokenIn
            ? handleMutateTokenToNativeSupport(data!.selectedTokenIn)
            : data!.selectedTokenIn

          const inputs = {
            tokenIn: data!.tokenIn,
            tokenOut: data!.tokenOut,
            selectedTokenIn: mutateSelectedTokenIn,
            selectedTokenOut: data!.selectedTokenOut,
            clientId: data.clientId,
            estimateQueue: value,
          }

          if (done && isCreateIntentRequest) {
            ongoingPublishingRef.current = true
            handlePublishIntentToSolver(
              inputs,
              receivedClientId ?? data.clientId,
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
            UseQueryCollectorKeys.CLIENT_ID,
            UseQueryCollectorKeys.TRANSACTION_HASHS,
          ])

          setSwapToLocal(inputs)
          handleBatchCreateSwapQuery({
            clientId: data.clientId as string,
          })
          await callRequestCreateIntent(inputs)
        }
        return
      }
      ongoingPublishingRef.current = true
      const newClientId = await sha256(v4())
      if (
        handleBatchCreateSwapQuery({
          clientId: newClientId,
        })
      ) {
        const estimateQueue = await handleEstimateQueueTransactions(newClientId)

        setIsReadingHistory(true)

        const inputs = {
          tokenIn: modalPayload.tokenIn,
          tokenOut: modalPayload.tokenOut,
          selectedTokenIn: modalPayload.selectedTokenIn,
          selectedTokenOut: modalPayload.selectedTokenOut,
          clientId: newClientId,
          estimateQueue,
          accountFrom: modalPayload?.accountFrom,
          accountTo: modalPayload?.accountTo,
          solverId: modalPayload?.solverId,
        }

        setSwapToLocal(inputs)

        ongoingPublishingRef.current = true
        const callResult: NearTX[] | void = await callRequestCreateIntent(
          inputs,
          (mutate) => setSwapToLocal(mutate)
        )
        if (callResult?.length) {
          const timestamps = await Promise.all(
            callResult.map(async (result) => {
              const { result: resultBlock } = (await getNearBlockById(
                result.transaction.hash as string
              )) as NearBlock
              return (
                resultBlock?.header?.timestamp ??
                Number(`${new Date().getTime()}` + "0".repeat(6))
              )
            })
          )

          callResult.forEach((result, i) => {
            updateOneHistory({
              clientId: inputs.clientId as string,
              hash: result.transaction.hash as string,
              timestamp: timestamps[i] ?? 0,
              details: {
                tokenIn: modalPayload.tokenIn,
                tokenOut: modalPayload.tokenOut,
                selectedTokenIn: modalPayload.selectedTokenIn,
                selectedTokenOut: modalPayload.selectedTokenOut,
              },
            })
            // Toggle preview for the main transaction in batch
            if (i === callResult.length - 1) {
              togglePreview(result.transaction.hash as string)
              if (
                estimateQueue.queueTransactionsTrack.includes(
                  QueueTransactions.CREATE_INTENT
                )
              ) {
                const isNativeTokenIn =
                  modalPayload!.selectedTokenIn.address === "native"
                const mutateSelectedTokenIn = isNativeTokenIn
                  ? handleMutateTokenToNativeSupport(
                      modalPayload!.selectedTokenIn
                    )
                  : modalPayload!.selectedTokenIn

                handlePublishIntentToSolver(
                  Object.assign(inputs, {
                    selectedTokenIn: mutateSelectedTokenIn,
                  }),
                  inputs.clientId,
                  result.transaction.hash as string
                )
              } else {
                onCloseModal()
                router.replace(pathname)
              }
            }
          })
        }
      }
    } catch (e) {
      console.error(e)
      if (userCancelTx(e)) {
        onCloseModal()
        return
      }

      router.replace(pathname)
      setNotification({
        id: "418",
        message:
          e instanceof Error ? e.message : "An unexpected error occurred!",
        type: NotificationType.ERROR,
      })
    } finally {
      ongoingPublishingRef.current = false
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    async function checkWalletSelector() {
      const wallet = await selector.wallet()
      if (wallet.id === "ethereum-wallets") {
        setAllowOtherModal(true)
      } else {
        setAllowOtherModal(false)
      }
    }
    checkWalletSelector()
  }, [selector])

  useEffect(() => {
    handleTrackSwap()
  }, [])

  useEffect(() => {
    if (isSuccess) {
      onCloseModal()
      ongoingPublishingRef.current = false
      setIsProcessing(false)
      router.replace(pathname)
    }
    if (isError) {
      ongoingPublishingRef.current = false
      onCloseModal()
      setIsProcessing(false)
      setNotification({
        id: v4(),
        message: "Intent hasn't been published!",
        type: NotificationType.ERROR,
      })
    }
  }, [isSuccess, isError])

  if (!isReadingHistory) {
    return null
  }

  return (
    <ModalDialog allowOtherModals={allowOtherModals}>
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
        <div className="flex justify-center">
          <Spinner loading={isProcessing} />
        </div>
        <div className="w-full flex flex-col text-center text-black-400 gap-1 mb-4">
          <Text size="4" weight="bold">
            Confirm swap
          </Text>
          <Text size="2" weight="bold" className="text-gray-600">
            Please confirm transaction in your wallet.
          </Text>
        </div>
        <div className="flex justify-center">
          <div className="flex justify-center items-center gap-1 px-2.5 py-1 bg-gray-950 rounded-full">
            <Text size="2" weight="medium" className="text-black-400">
              {`${smallBalanceToFormat(modalPayload?.tokenIn || dataFromLocal?.tokenIn || "", 7)} ${modalPayload?.selectedTokenIn?.symbol || dataFromLocal?.selectedTokenIn?.symbol || ""}`}
            </Text>
            <Image
              src="/static/icons/arrow-right.svg"
              alt="Arrow Icon"
              width={24}
              height={24}
            />
            <Text size="2" weight="medium" className="text-black-400">
              {`${smallBalanceToFormat(modalPayload?.tokenOut || dataFromLocal?.tokenOut || "", 7)} ${modalPayload?.selectedTokenOut?.symbol || dataFromLocal?.selectedTokenOut?.symbol || ""}`}
            </Text>
          </div>
        </div>
      </div>
    </ModalDialog>
  )
}

export default ModalConfirmSwap
