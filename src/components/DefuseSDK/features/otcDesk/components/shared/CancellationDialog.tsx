import { WarningCircleIcon } from "@phosphor-icons/react"
import { Button, Dialog, Spinner } from "@radix-ui/themes"
import { useSelector } from "@xstate/react"
import { useCallback } from "react"
import type { ActorRefFrom } from "xstate"
import { BaseModalDialog } from "../../../../components/Modal/ModalDialog"
import type { SignerCredentials } from "../../../../core/formatters"
import type { otcMakerOrderCancellationActor } from "../../actors/otcMakerOrderCancellationActor"
import type { SignMessage } from "../../types/sharedTypes"
import { ErrorReason } from "./ErrorReason"

interface CancellationDialogProps {
  actorRef:
    | ActorRefFrom<typeof otcMakerOrderCancellationActor>
    | undefined
    | null
  signerCredentials: SignerCredentials
  signMessage: SignMessage
}

export function CancellationDialog({
  actorRef,
  signerCredentials,
  signMessage,
}: CancellationDialogProps) {
  const snapshot = useSelector(actorRef ?? undefined, (state) => state)

  const abortCancellation = useCallback(() => {
    actorRef?.send({ type: "ABORT_CANCELLATION" })
  }, [actorRef])

  const ackCancellationImpossible = useCallback(() => {
    actorRef?.send({ type: "ACK_CANCELLATION_IMPOSSIBLE" })
  }, [actorRef])

  return (
    <BaseModalDialog
      open={!!actorRef}
      onClose={abortCancellation}
      title="Cancel order?"
    >
      {snapshot?.matches("idleUncancellable") ? (
        <>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-4 flex justify-center items-center">
              <WarningCircleIcon
                weight="bold"
                className="size-7 text-red-a11"
              />
            </div>
          </div>
          <Dialog.Title className="text-2xl font-black text-gray-12 mb-2 text-center">
            Your order is executed
            <br />
            or already cancelled
          </Dialog.Title>
          <Dialog.Description className="text-sm font-medium text-gray-11 text-center">
            This order has either been successfully completed or was previously
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
            Cancel order?
          </Dialog.Title>
          <Dialog.Description className="text-sm font-medium text-gray-11">
            The funds will stay safely in your wallet, and the link will no
            longer work.
          </Dialog.Description>

          {snapshot?.context.error != null && (
            <div className="mt-2">
              <ErrorReason reason={snapshot?.context.error.reason} />
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-center gap-3 mt-5">
            <Button
              type="button"
              size="4"
              variant="outline"
              color="gray"
              className="md:flex-1 font-bold"
              onClick={() => actorRef?.send({ type: "ABORT_CANCELLATION" })}
            >
              Keep
            </Button>

            <Button
              type="button"
              size="4"
              variant="solid"
              color="red"
              className="md:flex-1 font-bold"
              onClick={() =>
                actorRef?.send({
                  type: "CONFIRM_CANCELLATION",
                  signerCredentials,
                  signMessage,
                })
              }
            >
              <Spinner loading={!!snapshot?.matches("cancelling")} />
              {snapshot?.matches("cancelling")
                ? "Cancelling..."
                : "Cancel order"}
            </Button>
          </div>
        </>
      )}
    </BaseModalDialog>
  )
}
