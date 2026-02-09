import { LockClosedIcon } from "@heroicons/react/24/outline"
import AlertDialog from "@src/components/AlertDialog"
import Button from "@src/components/Button"
import { useModalStore } from "../../providers/ModalStoreProvider"

export type ModalConfirmAddPubkeyPayload = {
  accountId: string
  onConfirm: () => void
  onAbort: () => void
}

export const ModalConfirmAddPubkey = () => {
  const { onCloseModal, payload } = useModalStore((state) => state)

  const { accountId, onConfirm, onAbort } =
    payload as ModalConfirmAddPubkeyPayload

  return (
    <AlertDialog open={true}>
      <div className="flex flex-col items-center mt-4">
        <div className="bg-gray-100 size-13 rounded-full flex justify-center items-center">
          <LockClosedIcon className="size-6 text-gray-500" />
        </div>
        <AlertDialog.Title className="mt-5">
          Verify your wallet
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2">
          To verify your account{" "}
          <span className="font-mono bg-gray-100 rounded-md px-1 py-0.5 text-sm text-gray-900 font-medium">
            {accountId}
          </span>
          , please send a one-time transaction.
        </AlertDialog.Description>
      </div>

      <div className="flex flex-col gap-2 mt-5">
        <Button
          size="xl"
          fullWidth
          onClick={() => {
            onConfirm()
          }}
        >
          Confirm account
        </Button>
        <Button
          size="xl"
          fullWidth
          variant="secondary"
          onClick={() => {
            onAbort()
            onCloseModal()
          }}
        >
          Cancel
        </Button>
      </div>
    </AlertDialog>
  )
}
