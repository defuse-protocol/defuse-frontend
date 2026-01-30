import type { MultiPayload } from "@defuse-protocol/contract-types"
import {
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid"
import Alert from "@src/components/Alert"
import Button from "@src/components/Button"
import { CurvedArrowIcon } from "@src/icons"
import { useQuery } from "@tanstack/react-query"
import { useSelector } from "@xstate/react"
import clsx from "clsx"
import { useCallback, useEffect, useMemo, useState } from "react"
import { type ActorRefFrom, createActor, toPromise } from "xstate"
import { nearClient } from "../../constants/nearClient"
import type { SignerCredentials } from "../../core/formatters"
import type { SendNearTransaction } from "../../features/machines/publicKeyVerifierMachine"
import type { signIntentMachine } from "../../features/machines/signIntentMachine"
import { otcMakerOrderCancellationActor } from "../../features/otcDesk/actors/otcMakerOrderCancellationActor"
import type {
  GenerateLink,
  SignMessage,
} from "../../features/otcDesk/types/sharedTypes"
import { computeTradeBreakdown } from "../../features/otcDesk/utils/otcMakerBreakdown"
import { parseTradeTerms } from "../../features/otcDesk/utils/parseTradeTerms"
import { usePublicKeyModalOpener } from "../../features/swap/hooks/usePublicKeyModalOpener"
import { getProtocolFee } from "../../services/intentsContractService"
import type { TokenInfo } from "../../types/base"
import { formatTokenValue } from "../../utils/format"
import AssetComboIcon from "../Asset/AssetComboIcon"
import { Copy } from "../IntentCard/CopyButton"
import { BaseModalDialog } from "./ModalDialog"

export type ModalActiveDealProps = {
  open: boolean
  onClose: () => void
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  tradeId: string
  pKey: string
  iv: string
  multiPayload: MultiPayload
  nonceBase64: string
  generateLink: GenerateLink
  signerCredentials: SignerCredentials
  signMessage: SignMessage
  sendNearTransaction: SendNearTransaction
  error?:
    | "ORDER_EXPIRED"
    | "NONCE_ALREADY_USED"
    | "MAKER_INSUFFICIENT_FUNDS"
    | null
}

const ModalActiveDeal = ({
  open,
  onClose,
  tokenIn,
  tokenOut,
  tradeId,
  pKey,
  iv,
  multiPayload,
  nonceBase64,
  generateLink,
  signerCredentials,
  signMessage,
  sendNearTransaction,
  error,
}: ModalActiveDealProps) => {
  const link = generateLink(tradeId, pKey, multiPayload, iv)
  const [view, setView] = useState<"details" | "confirmCancel">("details")

  const expiredAt = useMemo(() => {
    if (error !== "ORDER_EXPIRED") return null
    const result = parseTradeTerms(multiPayload)
    if (!result.isOk()) return null
    const deadline = new Date(result.unwrap().deadline)
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(deadline)
  }, [multiPayload, error])

  const { data: protocolFee } = useQuery({
    queryKey: ["protocol_fee"],
    queryFn: () => getProtocolFee({ nearClient }),
  })

  const breakdown = useMemo(() => {
    if (protocolFee == null) return null

    return computeTradeBreakdown({
      multiPayload,
      tokenIn,
      tokenOut,
      protocolFee,
    })
  }, [multiPayload, tokenIn, tokenOut, protocolFee])

  const [cancellationActorRef, setCancellationActorRef] = useState<ActorRefFrom<
    typeof otcMakerOrderCancellationActor
  > | null>(null)

  const cancellationSnapshot = useSelector(
    cancellationActorRef ?? undefined,
    (state) => state
  )

  const publicKeyVerifierRef = useSelector(
    useSelector(
      cancellationActorRef ?? undefined,
      (state) =>
        state?.children.signRef as
          | undefined
          | ActorRefFrom<typeof signIntentMachine>
    ),
    (state) => state?.children.publicKeyVerifierRef
  )

  // @ts-expect-error publicKeyVerifierRef type mismatch
  usePublicKeyModalOpener(publicKeyVerifierRef, sendNearTransaction)

  useEffect(() => {
    return () => {
      cancellationActorRef?.stop()
    }
  }, [cancellationActorRef])

  useEffect(() => {
    if (!open) {
      setView("details")
      setCancellationActorRef(null)
    }
  }, [open])

  const handleInitiateCancel = useCallback(() => {
    const actor = createActor(otcMakerOrderCancellationActor, {
      input: {
        nonceBas64: nonceBase64,
        tradeId,
        signerCredentials,
      },
    })

    setCancellationActorRef(actor)
    actor.start()
    setView("confirmCancel")

    toPromise(actor)
      .then((output) => {
        if (
          output.orderStatus === "cancelled" ||
          output.orderStatus === "already_cancelled_or_executed"
        ) {
          onClose()
        }
      })
      .catch(() => {})
  }, [nonceBase64, tradeId, signerCredentials, onClose])

  const handleConfirmCancel = useCallback(() => {
    cancellationActorRef?.send({
      type: "CONFIRM_CANCELLATION",
      signerCredentials,
      signMessage,
    })
  }, [cancellationActorRef, signerCredentials, signMessage])

  const handleGoBack = useCallback(() => {
    cancellationActorRef?.stop()
    setCancellationActorRef(null)
    setView("details")
  }, [cancellationActorRef])

  const handleAckUncancellable = useCallback(() => {
    onClose()
  }, [onClose])

  const isCancelling = cancellationSnapshot?.matches("cancelling")
  const isUncancellable = cancellationSnapshot?.matches("idleUncancellable")
  const cancellationError = cancellationSnapshot?.context.error

  return (
    <BaseModalDialog
      open={open}
      onClose={onClose}
      title=""
      back={view === "confirmCancel" ? handleGoBack : undefined}
    >
      {view === "details" && (
        <>
          <div className="flex flex-col items-center justify-center">
            <div className="relative flex gap-2 items-start">
              <AssetComboIcon {...tokenIn} sizeClassName="size-9" />
              <CurvedArrowIcon className="size-4 text-gray-400 absolute bottom-0.5 left-7 -rotate-23" />
              <AssetComboIcon {...tokenOut} sizeClassName="size-13" />
            </div>

            <h2 className="mt-5 text-2xl/7 font-bold tracking-tight text-center text-pretty">
              {getTitle(error)}
            </h2>
            <p className="mt-2 text-base/5 font-medium text-gray-500 text-center text-balance max-w-72">
              {getSubtitle({ error, expiredAt })}
            </p>
          </div>

          {!error && (
            <div className="flex items-center gap-4 rounded-2xl border border-gray-200 p-1 pl-4 mt-6">
              <div className="text-sm/none font-semibold text-gray-900 truncate">
                {link}
              </div>

              <Copy text={link}>
                {(copied) => (
                  <Button variant="primary" size="lg">
                    {copied ? (
                      <ClipboardDocumentCheckIcon className="size-5" />
                    ) : (
                      <ClipboardDocumentIcon className="size-5" />
                    )}
                    <span className="min-w-14.5">
                      {copied ? "Copied!" : "Copy link"}
                    </span>
                  </Button>
                )}
              </Copy>
            </div>
          )}

          {breakdown != null && (
            <dl
              className={clsx(
                "space-y-2",
                error ? "mt-7 pt-5 border-t border-gray-200" : "mt-5"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <dt className="text-sm/5 text-gray-500 font-medium">
                  You send
                </dt>
                <dd className="flex items-center gap-1 justify-end">
                  <span className="text-sm/5 text-gray-900 font-semibold">
                    {formatTokenValue(
                      breakdown.makerSends.amount,
                      breakdown.makerSends.decimals,
                      { fractionDigits: 4 }
                    )}{" "}
                    {tokenIn.symbol}
                  </span>
                  <AssetComboIcon {...tokenIn} sizeClassName="size-4" />
                </dd>
              </div>

              <div className="flex items-center justify-between gap-2">
                <dt className="text-sm/5 text-gray-500 font-medium">
                  You receive
                </dt>
                <dd className="flex items-center gap-1 justify-end">
                  <span className="text-sm/5 text-gray-900 font-semibold">
                    {formatTokenValue(
                      breakdown.makerReceives.amount,
                      breakdown.makerReceives.decimals,
                      { fractionDigits: 4 }
                    )}{" "}
                    {tokenOut.symbol}
                  </span>
                  <AssetComboIcon {...tokenOut} sizeClassName="size-4" />
                </dd>
              </div>

              <div className="flex items-center justify-between gap-2">
                <dt className="text-sm/5 text-gray-500 font-medium">
                  Processing fee
                </dt>
                <dd className="flex items-center gap-1 justify-end">
                  <span className="text-sm/5 text-gray-900 font-semibold">
                    {formatTokenValue(
                      breakdown.makerPaysFee.amount,
                      breakdown.makerPaysFee.decimals,
                      { fractionDigits: 4 }
                    )}{" "}
                    {tokenIn.symbol}
                  </span>
                  <AssetComboIcon {...tokenIn} sizeClassName="size-4" />
                </dd>
              </div>

              <div className="flex items-center justify-between gap-2">
                <dt className="text-sm/5 text-gray-500 font-medium">
                  Recipient receives
                </dt>
                <dd className="flex items-center gap-1 justify-end">
                  <span className="text-sm/5 text-gray-900 font-semibold">
                    {formatTokenValue(
                      breakdown.takerReceives.amount,
                      breakdown.takerReceives.decimals,
                      { fractionDigits: 4 }
                    )}{" "}
                    {tokenIn.symbol}
                  </span>
                  <AssetComboIcon {...tokenIn} sizeClassName="size-4" />
                </dd>
              </div>
            </dl>
          )}

          <div className="mt-5 space-y-2">
            {(!error || error === "MAKER_INSUFFICIENT_FUNDS") && (
              <Button
                onClick={handleInitiateCancel}
                variant="destructive-soft"
                size="xl"
                fullWidth
              >
                Cancel deal
              </Button>
            )}
            <Button onClick={onClose} variant="secondary" size="xl" fullWidth>
              Close
            </Button>
          </div>
        </>
      )}

      {view === "confirmCancel" &&
        (isUncancellable ? (
          <>
            <div className="flex flex-col items-center justify-center">
              <div className="size-13 rounded-full bg-red-100 flex justify-center items-center">
                <XMarkIcon className="size-6 text-red-600" />
              </div>

              <h2 className="mt-5 text-2xl/7 font-bold tracking-tight text-center">
                Your deal has been filled or already cancelled
              </h2>
              <p className="mt-2 text-base/5 font-medium text-gray-500 text-center text-balance">
                This deal has either been successfully completed or was
                previously cancelled.
              </p>
            </div>

            <Button
              onClick={handleAckUncancellable}
              variant="secondary"
              size="xl"
              fullWidth
              className="mt-6"
            >
              Continue
            </Button>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center mt-1">
              <h2 className="text-2xl/7 font-bold tracking-tight text-center">
                Cancel deal?
              </h2>
              <p className="mt-2 text-base/5 font-medium text-gray-500 text-center text-balance">
                Your funds will stay safely in your wallet, and the link will no
                longer work.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-1">
              <Button
                onClick={handleGoBack}
                variant="secondary"
                size="xl"
                disabled={isCancelling}
              >
                Go back
              </Button>
              <Button
                onClick={handleConfirmCancel}
                variant="destructive"
                size="xl"
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Cancel deal"}
              </Button>
            </div>

            {cancellationError && (
              <Alert variant="error" className="mt-2">
                {renderErrorMessage(cancellationError.reason)}
              </Alert>
            )}
          </>
        ))}
    </BaseModalDialog>
  )
}

export default ModalActiveDeal

const getTitle = (error?: string | null) => {
  if (error === "ORDER_EXPIRED") {
    return "Deal expired"
  }

  if (error === "NONCE_ALREADY_USED") {
    return "Deal filled or cancelled"
  }

  if (error === "MAKER_INSUFFICIENT_FUNDS") {
    return "Your balance is too low"
  }

  return "Deal active"
}

const getSubtitle = ({
  error,
  expiredAt,
}: { error?: string | null; expiredAt?: string | null }) => {
  if (error === "MAKER_INSUFFICIENT_FUNDS") {
    return "This deal cannot be filled. Please increase your balance or cancel the deal and create a new one."
  }

  if (error === "ORDER_EXPIRED") {
    if (expiredAt) {
      return `This deal expired on ${expiredAt}.`
    }
    return "This deal has already expired."
  }

  if (error === "NONCE_ALREADY_USED") {
    return "No action needed — this deal was already completed or cancelled."
  }

  return "Share the link with the counterparty to finalize the deal"
}

function renderErrorMessage(reason: string): string {
  switch (reason) {
    case "ERR_PREPARING_SIGNING_DATA":
      return "We were unable to create the trade authorization for you to confirm. This is a technical error on our side. Please try again."
    case "ERR_USER_DIDNT_SIGN":
      return "It seems that you didn't confirm the trade authorization. Please try again."
    default:
      return reason
  }
}
