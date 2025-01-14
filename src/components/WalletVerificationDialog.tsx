import * as AlertDialog from "@radix-ui/react-alert-dialog"
import {
  CheckIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
} from "@radix-ui/react-icons"
import {
  Button,
  Spinner,
  AlertDialog as themes_AlertDialog,
} from "@radix-ui/themes"

export function WalletVerificationDialog({
  open,
  onConfirm,
  onCancel,
  isConfirming,
}: {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  isConfirming: boolean
}) {
  return (
    <AlertDialog.Root open={open}>
      <themes_AlertDialog.Content className="max-w-md p-6">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="bg-blue-50 p-3 rounded-full mb-4">
            <LockClosedIcon className="w-6 h-6 text-blue-600" />
          </div>
          <AlertDialog.Title className="text-xl font-semibold text-gray-900">
            Wallet Verification Required
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-gray-600">
            Please verify your wallet to enable full platform functionality
          </AlertDialog.Description>
        </div>

        {/* Features List */}
        <div className="bg-gray-50 rounded-lg p-4 mb-5">
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-full p-1">
                <CheckIcon className="w-3 h-3 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">
                Safe transactions and transfers
              </span>
            </li>
            <li className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-full p-1">
                <CheckIcon className="w-3 h-3 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">
                Full access to all platform features
              </span>
            </li>
            <li className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-full p-1">
                <CheckIcon className="w-3 h-3 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">
                Protection of your funds
              </span>
            </li>
          </ul>
        </div>

        {/* Warning Message */}
        <div className="flex gap-2 items-start mb-6 p-3 bg-amber-50 rounded-lg">
          <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Canceling this verification will disconnect your wallet. You can
            reconnect and verify anytime.
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <themes_AlertDialog.Cancel>
            <Button
              size="3"
              type="button"
              variant="soft"
              color="gray"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </themes_AlertDialog.Cancel>
          <themes_AlertDialog.Action>
            <Button
              size="3"
              type="button"
              onClick={onConfirm}
              className="min-w-[100px]"
            >
              <Spinner loading={isConfirming} />
              {isConfirming ? "Verifying..." : "Verify Now"}
            </Button>
          </themes_AlertDialog.Action>
        </div>
      </themes_AlertDialog.Content>
    </AlertDialog.Root>
  )
}
