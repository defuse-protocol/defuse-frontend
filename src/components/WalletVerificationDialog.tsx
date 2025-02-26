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
  isVerifying,
  isFailure,
}: {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  isVerifying: boolean
  isFailure: boolean
}) {
  return (
    <AlertDialog.Root open={open}>
      <themes_AlertDialog.Content className="max-w-md px-5 pt-5 pb-[max(env(safe-area-inset-bottom,0px),theme(spacing.5))] sm:animate-none animate-slide-up">
        {isFailure ? (
          <FailureContent
            open={open}
            onConfirm={onConfirm}
            onCancel={onCancel}
            isVerifying={isVerifying}
          />
        ) : (
          <DefaultContent
            open={open}
            onConfirm={onConfirm}
            onCancel={onCancel}
            isVerifying={isVerifying}
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
  isVerifying,
}: {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  isVerifying: boolean
}) {
  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-full mb-4">
          <LockClosedIcon className="w-6 h-6 text-blue-600 darkL:text-blue-400" />
        </div>
        <AlertDialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Signature Check Required
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2 text-gray-600 dark:text-gray-400">
          Please verify your device compatibility with the platform
        </AlertDialog.Description>
      </div>

      {/* Features List */}
      <div className="bg-gray-50 dark:bg-gray-800  text-gray-600 dark:text-gray-300 rounded-lg p-4 mb-5">
        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1">
              <CheckIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm">Safe transactions and transfers</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1">
              <CheckIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm">
              Full access to all platform features
            </span>
          </li>
          <li className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1">
              <CheckIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm">Protection of your funds</span>
          </li>
        </ul>
      </div>

      {/* Warning Message */}
      <Callout.Root className="mb-6 bg-warning px-3 py-2 text-warning-foreground">
        <Callout.Text className="text-xs">
          Canceling this check will sign you out. You can sign in and verify
          anytime.
        </Callout.Text>
      </Callout.Root>

      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
        <themes_AlertDialog.Cancel>
          <Button
            size="4"
            type="button"
            variant="soft"
            color="gray"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </themes_AlertDialog.Cancel>
        <themes_AlertDialog.Action>
          <Button size="4" type="button" onClick={onConfirm}>
            <Spinner loading={isVerifying} />
            {isVerifying ? "Checking..." : "Check Compatibility"}
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
  isVerifying,
}: {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  isVerifying: boolean
}) {
  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-full mb-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <AlertDialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Unable to Verify
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2 text-gray-600 dark:text-gray-400">
          The compatibility check couldn't be completed
        </AlertDialog.Description>
      </div>

      {/* Info List */}
      <div className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg p-4 mb-5">
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="bg-amber-100 dark:bg-amber-900 rounded-full p-1 mt-0.5">
              <Cross2Icon className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm">
              The verification was interrupted or cancelled
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="bg-amber-100 dark:bg-amber-900 rounded-full p-1 mt-0.5">
              <MinusCircledIcon className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm">
              Some wallets (or devices) are incompatible with the platform
            </span>
          </li>
        </ul>
      </div>

      {/* Warning Message */}
      <Callout.Root className="mb-6 bg-warning px-3 py-2 text-warning-foreground">
        <Callout.Text className="text-xs">
          Try again or choose another sign-in option to continue.
        </Callout.Text>
      </Callout.Root>

      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
        <themes_AlertDialog.Cancel>
          <Button
            size="4"
            type="button"
            variant="soft"
            color="gray"
            onClick={onCancel}
          >
            Sign out
          </Button>
        </themes_AlertDialog.Cancel>
        <themes_AlertDialog.Action>
          <Button size="4" type="button" onClick={onConfirm}>
            <Spinner loading={isVerifying}>
              <ReloadIcon />
            </Spinner>
            Try again
          </Button>
        </themes_AlertDialog.Action>
      </div>
    </>
  )
}
