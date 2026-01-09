import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons"
import { Button, Callout } from "@radix-ui/themes"
import clsx from "clsx"
import { AlertDialog } from "radix-ui"

export function WalletBannedDialog({
  open,
  onCancel,
  onBypass,
}: {
  open: boolean
  onCancel: () => void
  onBypass: () => void
}) {
  return (
    <AlertDialog.Root open={open}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className={clsx(
            "fixed inset-0 bg-gray-900/80 z-50",
            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:duration-300",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:duration-200"
          )}
        />
        <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <AlertDialog.Content
              className={clsx(
                "relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl",
                "max-w-md w-full p-6",
                "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4 data-[state=open]:fade-in data-[state=open]:duration-200",
                "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-4 data-[state=closed]:fade-out data-[state=closed]:duration-200"
              )}
            >
              <FailureContent
                open={open}
                onCancel={onCancel}
                onBypass={onBypass}
              />
            </AlertDialog.Content>
          </div>
        </div>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

function FailureContent({
  open: _open,
  onCancel,
  onBypass,
}: {
  open: boolean
  onCancel: () => void
  onBypass: () => void
}) {
  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-full mb-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <AlertDialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Not Supported Wallet Address
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2 text-gray-11">
          For your safety, your wallet address can't be used with this app.
        </AlertDialog.Description>
      </div>

      {/* Info List */}
      <div className="bg-gray-50 dark:bg-gray-800 text-gray-11 rounded-lg p-4 mb-5">
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="bg-amber-100 dark:bg-amber-900 rounded-full p-1 mt-0.5">
              <MagnifyingGlassIcon className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm">
              Wallet address was created before EVM support was added to NEAR
            </span>
          </li>
        </ul>
      </div>

      {/* Warning Message */}
      <Callout.Root className="mb-6 bg-warning px-3 py-2 text-warning-foreground">
        <Callout.Text className="text-xs">
          Please use a different wallet to continue.
        </Callout.Text>
      </Callout.Root>

      <div className="flex flex-col justify-center gap-3 mt-6">
        <AlertDialog.Cancel asChild>
          <Button
            size="4"
            type="button"
            variant="soft"
            color="gray"
            onClick={onCancel}
          >
            Disconnect
          </Button>
        </AlertDialog.Cancel>
        <AlertDialog.Action asChild>
          <Button size="4" type="button" color="red" onClick={onBypass}>
            Proceed anyway, I know what I'm doing
          </Button>
        </AlertDialog.Action>
      </div>
    </>
  )
}
