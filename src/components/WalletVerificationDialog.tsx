import {
  CheckIcon,
  Cross2Icon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  MinusCircledIcon,
  ReloadIcon,
} from "@radix-ui/react-icons"
import { Button, Callout, Spinner } from "@radix-ui/themes"
import clsx from "clsx"
import { AlertDialog } from "radix-ui"

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
                "max-w-md w-full px-5 pt-5 pb-[max(env(safe-area-inset-bottom,0px),20px)]",
                "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4 data-[state=open]:fade-in data-[state=open]:duration-200",
                "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-4 data-[state=closed]:fade-out data-[state=closed]:duration-200"
              )}
            >
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
            </AlertDialog.Content>
          </div>
        </div>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

function DefaultContent({
  open: _open,
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
          <LockClosedIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <AlertDialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Signature Check Required
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2 text-gray-11">
          Please verify your device compatibility with the platform
        </AlertDialog.Description>
      </div>

      {/* Features List */}
      <div className="bg-gray-50 dark:bg-gray-800 text-gray-11 rounded-lg p-4 mb-5">
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
        <AlertDialog.Cancel asChild>
          <Button
            size="4"
            type="button"
            variant="soft"
            color="gray"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </AlertDialog.Cancel>
        <AlertDialog.Action asChild>
          <Button size="4" type="button" onClick={onConfirm}>
            <Spinner loading={isVerifying} />
            {isVerifying ? "Checking..." : "Check Compatibility"}
          </Button>
        </AlertDialog.Action>
      </div>
    </>
  )
}

function FailureContent({
  open: _open,
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
        <AlertDialog.Description className="mt-2 text-gray-11">
          The compatibility check couldn't be completed
        </AlertDialog.Description>
      </div>

      {/* Info List */}
      <div className="bg-gray-50 dark:bg-gray-800 text-gray-11 rounded-lg p-4 mb-5">
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
        <AlertDialog.Cancel asChild>
          <Button
            size="4"
            type="button"
            variant="soft"
            color="gray"
            onClick={onCancel}
          >
            Sign out
          </Button>
        </AlertDialog.Cancel>
        <AlertDialog.Action asChild>
          <Button size="4" type="button" onClick={onConfirm}>
            <Spinner loading={isVerifying}>
              <ReloadIcon />
            </Spinner>
            Try again
          </Button>
        </AlertDialog.Action>
      </div>
    </>
  )
}
