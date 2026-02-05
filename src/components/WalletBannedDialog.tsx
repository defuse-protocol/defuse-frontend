import { ExclamationTriangleIcon } from "@heroicons/react/24/outline"
import Alert from "./Alert"
import AlertDialog from "./AlertDialog"
import Button from "./Button"

export function WalletBannedDialog({
  open,
  onAbort,
  onBypass,
}: {
  open: boolean
  onAbort: () => void
  onBypass: () => void
}) {
  return (
    <AlertDialog open={open}>
      <div className="flex flex-col items-center mt-4">
        <div className="bg-yellow-100 size-13 rounded-full flex justify-center items-center">
          <ExclamationTriangleIcon className="size-6 text-yellow-600 " />
        </div>
        <AlertDialog.Title className="mt-5">
          Unsupported wallet address
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2">
          For your safety, your wallet address cannot be used with this app.
        </AlertDialog.Description>

        <Alert variant="info" className="mt-5">
          Your wallet address was created before EVM support was added to NEAR.
          Please use a different wallet to continue.
        </Alert>
      </div>

      <div className="flex flex-col gap-2 mt-5">
        <Button size="xl" fullWidth onClick={onAbort} variant="primary">
          Disconnect
        </Button>
        <Button
          size="xl"
          fullWidth
          onClick={onBypass}
          variant="destructive-soft"
        >
          Proceed anyway, I know what I'm doing
        </Button>
      </div>
    </AlertDialog>
  )
}
