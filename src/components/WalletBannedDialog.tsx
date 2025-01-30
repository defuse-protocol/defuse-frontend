import * as AlertDialog from "@radix-ui/react-alert-dialog"
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  MinusCircledIcon,
} from "@radix-ui/react-icons"
import {
  Button,
  Callout,
  AlertDialog as themes_AlertDialog,
} from "@radix-ui/themes"

export function WalletBannedDialog({
  open,
  onCancel,
}: {
  open: boolean
  onCancel: () => void
}) {
  return (
    <AlertDialog.Root open={open}>
      <themes_AlertDialog.Content className="max-w-md p-6 sm:animate-none animate-slide-up">
        <FailureContent open={open} onCancel={onCancel} />
      </themes_AlertDialog.Content>
    </AlertDialog.Root>
  )
}

function FailureContent({
  open,
  onCancel,
}: {
  open: boolean
  onCancel: () => void
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
        <AlertDialog.Description className="mt-2 text-gray-600 dark:text-gray-400">
          For your safety, your wallet address can't be used with this app.
        </AlertDialog.Description>
      </div>

      {/* Info List */}
      <div className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg p-4 mb-5">
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

      <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
        <themes_AlertDialog.Cancel>
          <Button
            size="4"
            type="button"
            variant="soft"
            color="gray"
            onClick={onCancel}
          >
            Disconnect
          </Button>
        </themes_AlertDialog.Cancel>
      </div>
    </>
  )
}
