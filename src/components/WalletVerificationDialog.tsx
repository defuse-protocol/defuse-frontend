import * as AlertDialog from "@radix-ui/react-alert-dialog"
import {
  CheckIcon,
  Cross2Icon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  MinusCircledIcon,
  ReloadIcon,
} from "@radix-ui/react-icons"
import {
  Button,
  Callout,
  Spinner,
  AlertDialog as themes_AlertDialog,
} from "@radix-ui/themes"

export function WalletVerificationDialog({
  open,
  onConfirm,
  onCancel,
  isConfirming,
  isFailure,
}: {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  isConfirming: boolean
  isFailure: boolean
}) {
  return (
    <AlertDialog.Root open={open}>
      <themes_AlertDialog.Content className="max-w-md p-6">
        {isFailure ? (
          <FailureContent
            open={open}
            onConfirm={onConfirm}
            onCancel={onCancel}
            isConfirming={isConfirming}
          />
        ) : (
          <DefaultContent
            open={open}
            onConfirm={onConfirm}
            onCancel={onCancel}
            isConfirming={isConfirming}
          />
        )}
      </themes_AlertDialog.Content>
    </AlertDialog.Root>
  )
}

function DefaultContent({
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
    <>
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
      <Callout.Root className="mb-6 bg-warning px-3 py-2 text-warning-foreground">
        <Callout.Text className="text-xs">
          Canceling this verification will disconnect your wallet. You can
          reconnect and verify anytime.
        </Callout.Text>
      </Callout.Root>

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
          <Button size="3" type="button" onClick={onConfirm}>
            <Spinner loading={isConfirming} />
            {isConfirming ? "Verifying..." : "Verify Now"}
          </Button>
        </themes_AlertDialog.Action>
      </div>
    </>
  )
}

function FailureContent({
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
    <>
      {/* Header Section */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="bg-amber-50 p-3 rounded-full mb-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
        </div>
        <AlertDialog.Title className="text-xl font-semibold text-gray-900">
          Unable to Verify Wallet
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2 text-gray-600">
          The verification process couldn't be completed
        </AlertDialog.Description>
      </div>

      {/* Info List */}
      <div className="bg-gray-50 rounded-lg p-4 mb-5">
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="bg-amber-100 rounded-full p-1 mt-0.5">
              <Cross2Icon className="w-3 h-3 text-amber-600" />
            </div>
            <span className="text-sm text-gray-600">
              The verification was interrupted or cancelled
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="bg-amber-100 rounded-full p-1 mt-0.5">
              <MinusCircledIcon className="w-3 h-3 text-amber-600" />
            </div>
            <span className="text-sm text-gray-600">
              Some wallets, like Ledger, can't access important app features
            </span>
          </li>
        </ul>
      </div>

      {/* Warning Message */}
      <Callout.Root className="mb-6 bg-warning px-3 py-2 text-warning-foreground">
        <Callout.Text className="text-xs">
          Try again or connect a different wallet to continue.
        </Callout.Text>
      </Callout.Root>

      <div className="flex justify-end gap-3 mt-6">
        <themes_AlertDialog.Cancel>
          <Button
            size="3"
            type="button"
            variant="soft"
            color="gray"
            onClick={onCancel}
          >
            Disconnect
          </Button>
        </themes_AlertDialog.Cancel>
        <themes_AlertDialog.Action>
          <Button size="3" type="button" onClick={onConfirm}>
            <Spinner loading={isConfirming}>
              <ReloadIcon />
            </Spinner>
            Try Again
          </Button>
        </themes_AlertDialog.Action>
      </div>
    </>
  )
}
