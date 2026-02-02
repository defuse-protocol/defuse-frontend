import {
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/20/solid"
import { WarningCircleIcon } from "@phosphor-icons/react"
import Button from "@src/components/Button"
import type { SignerCredentials } from "@src/components/DefuseSDK/core/formatters"
import { assert } from "@src/components/DefuseSDK/utils/assert"
import { useSelector } from "@xstate/react"
import { useCallback } from "react"
import type { ActorRefFrom } from "xstate"
import { Copy } from "../../../components/IntentCard/CopyButton"
import { BaseModalDialog } from "../../../components/Modal/ModalDialog"
import type { giftMakerReadyActor } from "../actors/giftMakerReadyActor"
import type { GiftInfo } from "../actors/shared/getGiftInfo"
import type { giftClaimActor } from "../actors/shared/giftClaimActor"
import { giftMakerHistoryStore } from "../stores/giftMakerHistory"
import type { GenerateLink } from "../types/sharedTypes"
import { ShareableGiftImage } from "./ShareableGiftImage"
import { ErrorReason } from "./shared/ErrorReason"

type GiftMakerReadyDialogProps = {
  readyGiftRef: ActorRefFrom<typeof giftMakerReadyActor>
  generateLink: GenerateLink
  signerCredentials: SignerCredentials
  onClose?: () => void
  isClaimed?: boolean
}

export function GiftMakerReadyDialog({
  readyGiftRef,
  generateLink,
  signerCredentials,
  onClose,
  isClaimed = false,
}: GiftMakerReadyDialogProps) {
  const { giftCancellationRef, giftInfo } = useSelector(
    readyGiftRef,
    (state) => ({
      giftCancellationRef: state.children.giftMakerClaimRef as
        | undefined
        | ActorRefFrom<typeof giftClaimActor>,
      giftInfo: state.context.giftInfo,
    })
  )
  return (
    <>
      <SuccessDialog
        readyGiftRef={readyGiftRef}
        generateLink={generateLink}
        onClose={onClose}
        isClaimed={isClaimed}
      />
      <CancellationDialog
        giftInfo={giftInfo}
        actorRef={giftCancellationRef}
        signerCredentials={signerCredentials}
      />
    </>
  )
}

function SuccessDialog({
  readyGiftRef,
  generateLink,
  onClose,
  isClaimed = false,
}: {
  readyGiftRef: ActorRefFrom<typeof giftMakerReadyActor>
  generateLink: GenerateLink
  onClose?: () => void
  isClaimed?: boolean
}) {
  const { context } = useSelector(readyGiftRef, (state) => ({
    context: state.context,
  }))

  const finish = useCallback(() => {
    readyGiftRef.send({ type: "FINISH" })
    onClose?.()
  }, [readyGiftRef, onClose])

  const cancelGift = useCallback(() => {
    readyGiftRef.send({ type: "CANCEL_GIFT" })
  }, [readyGiftRef])

  const copyGiftLink = useCallback(() => {
    return generateLink({
      secretKey: context.giftInfo.secretKey,
      message: context.parsed.message,
      iv: context.iv,
    })
  }, [
    generateLink,
    context.giftInfo.secretKey,
    context.parsed.message,
    context.iv,
  ])

  return (
    <BaseModalDialog
      open
      onClose={finish}
      title={isClaimed ? "Gift claimed" : "Share your gift"}
    >
      <p className="text-gray-500 text-sm font-medium space-y-4 mt-1">
        {isClaimed
          ? "This gift has been successfully claimed by the recipient."
          : "Your funds are on-chain. The recipient can claim them via the link, or you can reclaim them if needed."}
      </p>

      <ShareableGiftImage
        link={copyGiftLink()}
        token={context.parsed.token}
        amount={context.parsed.amount}
        message={
          context.parsed.message.length > 0
            ? context.parsed.message
            : "Enjoy your gift!"
        }
      />

      <div className="flex flex-col gap-2 mt-5">
        {isClaimed ? (
          <Button size="xl" variant="secondary" fullWidth onClick={finish}>
            Close
          </Button>
        ) : (
          <>
            <Copy text={copyGiftLink()}>
              {(copied) => (
                <Button type="button" size="xl" variant="primary" fullWidth>
                  {copied ? (
                    <ClipboardDocumentCheckIcon className="size-5" />
                  ) : (
                    <ClipboardDocumentIcon className="size-5" />
                  )}
                  {copied ? "Copied" : "Copy link"}
                </Button>
              )}
            </Copy>

            <Button
              size="xl"
              type="button"
              variant="destructive-soft"
              onClick={cancelGift}
              fullWidth
            >
              Cancel gift
            </Button>
          </>
        )}
      </div>
    </BaseModalDialog>
  )
}

export interface CancellationDialogProps {
  actorRef: ActorRefFrom<typeof giftClaimActor> | undefined | null
  giftInfo: GiftInfo
  signerCredentials: SignerCredentials
}

export function CancellationDialog({
  actorRef,
  giftInfo,
  signerCredentials,
}: CancellationDialogProps) {
  const snapshot = useSelector(actorRef ?? undefined, (state) => state)

  const abortCancellation = useCallback(() => {
    actorRef?.send({ type: "ABORT_CLAIM" })
  }, [actorRef])

  const ackCancellationImpossible = useCallback(() => {
    actorRef?.send({ type: "ACK_CLAIM_IMPOSSIBLE" })
    assert(giftInfo.secretKey, "giftInfo.secretKey is not set")
    giftMakerHistoryStore
      .getState()
      .removeGift(giftInfo.secretKey, signerCredentials)
  }, [actorRef, giftInfo, signerCredentials])

  const confirmCancellation = useCallback(() => {
    actorRef?.send({
      type: "CONFIRM_CLAIM",
      params: { giftInfo, signerCredentials },
    })
  }, [actorRef, giftInfo, signerCredentials])

  return (
    <BaseModalDialog open={!!actorRef} onClose={abortCancellation}>
      {snapshot?.matches("idleUnclaimable") ? (
        <>
          <div className="flex justify-center mt-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-red-4 flex justify-center items-center">
              <WarningCircleIcon
                weight="bold"
                className="size-7 text-red-a11"
              />
            </div>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-3 text-center">
            Your gift is claimed
            <br />
            or already cancelled
          </h3>
          <p className="text-sm font-medium text-gray-500 text-center">
            This gift has either been successfully claimed or was previously
            cancelled.
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-3 mt-6">
            <Button
              type="button"
              size="xl"
              variant="outline"
              onClick={ackCancellationImpossible}
              fullWidth
            >
              Ok
            </Button>
          </div>
        </>
      ) : (
        <>
          <h2 className="mt-2 text-2xl/7 font-bold text-gray-900 tracking-tight text-center text-balance">
            Cancel gift?
          </h2>
          <p className="mt-2 text-base/5 text-gray-500 font-medium text-center text-balance">
            The funds will return to your account, and the link will no longer
            work.
          </p>

          {snapshot?.context.error != null &&
            typeof snapshot.context.error?.reason === "string" && (
              <ErrorReason reason={snapshot.context.error?.reason} />
            )}

          <div className="grid grid-cols-2 gap-1 mt-8">
            <Button
              type="button"
              size="xl"
              variant="secondary"
              onClick={abortCancellation}
            >
              Keep gift
            </Button>

            <Button
              type="button"
              size="xl"
              variant="destructive"
              onClick={confirmCancellation}
              loading={!!snapshot?.matches("claiming")}
            >
              {snapshot?.matches("claiming") ? "Cancelling..." : "Cancel gift"}
            </Button>
          </div>
        </>
      )}
    </BaseModalDialog>
  )
}
