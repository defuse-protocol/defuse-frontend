import {
  Check as CheckIcon,
  Copy as CopyIcon,
  Warning as WarningIcon,
} from "@phosphor-icons/react"
import { Button, Dialog, Spinner } from "@radix-ui/themes"
import type { SignerCredentials } from "@src/components/DefuseSDK/core/formatters"
import { assert } from "@src/components/DefuseSDK/utils/assert"
import { useSelector } from "@xstate/react"
import { useCallback } from "react"
import type { ActorRefFrom } from "xstate"
import { ButtonCustom } from "../../../components/Button/ButtonCustom"
import { Copy } from "../../../components/IntentCard/CopyButton"
import { BaseModalDialog } from "../../../components/Modal/ModalDialog"
import type { giftMakerReadyActor } from "../actors/giftMakerReadyActor"
import type { GiftInfo } from "../actors/shared/getGiftInfo"
import type { giftClaimActor } from "../actors/shared/giftClaimActor"
import { giftMakerHistoryStore } from "../stores/giftMakerHistory"
import type { GenerateLink } from "../types/sharedTypes"
import { ShareableGiftImage } from "./ShareableGiftImage"
import { ErrorReason } from "./shared/ErrorReason"
import { GiftDescription } from "./shared/GiftDescription"
import { GiftHeader } from "./shared/GiftHeader"

type GiftMakerReadyDialogProps = {
  readyGiftRef: ActorRefFrom<typeof giftMakerReadyActor>
  generateLink: GenerateLink
  signerCredentials: SignerCredentials
  onClose?: () => void
}

export function GiftMakerReadyDialog({
  readyGiftRef,
  generateLink,
  signerCredentials,
  onClose,
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
}: {
  readyGiftRef: ActorRefFrom<typeof giftMakerReadyActor>
  generateLink: GenerateLink
  onClose?: () => void
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
    <BaseModalDialog open onClose={finish} isDismissable>
      <GiftHeader title="Share your gift" className="mt-2 text-center">
        <GiftDescription
          description="Your funds are on-chain. The recipient can claim them via the link, or
          you can reclaim them if needed."
          className="text-center"
        />
      </GiftHeader>

      {/* Image Section */}
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

      <div className="flex flex-col justify-center gap-3 mt-5">
        <Copy text={copyGiftLink()}>
          {(copied) => (
            <ButtonCustom
              type="button"
              size="lg"
              variant="primary"
              variantRadix={copied ? "soft" : undefined}
            >
              <div className="flex gap-2 items-center">
                {copied ? (
                  <CheckIcon weight="bold" />
                ) : (
                  <CopyIcon weight="bold" />
                )}
                {copied ? "Copied" : "Copy link"}
              </div>
            </ButtonCustom>
          )}
        </Copy>

        <ButtonCustom
          size="lg"
          type="button"
          variant="danger"
          onClick={cancelGift}
        >
          Cancel gift
        </ButtonCustom>
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
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-4 flex justify-center items-center">
              <WarningIcon weight="bold" className="size-7 text-red-a11" />
            </div>
          </div>
          <Dialog.Title className="text-2xl font-black text-gray-12 mb-2 text-center">
            Your gift is claimed
            <br />
            or already cancelled
          </Dialog.Title>
          <Dialog.Description className="text-sm font-medium text-gray-11 text-center">
            This gift has either been successfully claimed or was previously
            cancelled. 
          </Dialog.Description>

          <div className="flex flex-col md:flex-row justify-center gap-3 mt-5">
            <Button
              type="button"
              size="4"
              className="w-full font-bold"
              variant="outline"
              color="gray"
              onClick={ackCancellationImpossible}
            >
              Ok
            </Button>
          </div>
        </>
      ) : (
        <>
          <Dialog.Title className="text-2xl font-black text-gray-12 mb-2">
            Cancel gift?
          </Dialog.Title>
          <Dialog.Description className="text-sm font-medium text-gray-11">
            The funds will return to your account, and the link will no longer
            work.
          </Dialog.Description>

          {snapshot?.context.error != null &&
            typeof snapshot.context.error?.reason === "string" && (
              <ErrorReason reason={snapshot.context.error?.reason} />
            )}

          <div className="flex flex-col md:flex-row justify-center gap-3 mt-5">
            <Button
              type="button"
              size="4"
              variant="outline"
              color="gray"
              className="md:flex-1 font-bold"
              onClick={abortCancellation}
            >
              Keep
            </Button>

            <Button
              type="button"
              size="4"
              variant="solid"
              color="red"
              className="md:flex-1 font-bold"
              onClick={confirmCancellation}
            >
              <Spinner loading={!!snapshot?.matches("claiming")} />
              {snapshot?.matches("claiming") ? "Cancelling..." : "Cancel gift"}
            </Button>
          </div>
        </>
      )}
    </BaseModalDialog>
  )
}
