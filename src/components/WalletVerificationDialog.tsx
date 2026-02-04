import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/16/solid"
import {
  CheckIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import clsx from "clsx"
import Button from "./Button"

type ContentProps = {
  onConfirm: () => void
  onCancel: () => void
  isVerifying: boolean
  isTokenExpired?: boolean
}

export function WalletVerificationDialog({
  open,
  onConfirm,
  onCancel,
  isVerifying,
  isFailure,
  isSessionExpired = false,
}: {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  isVerifying: boolean
  isFailure: boolean
  isSessionExpired?: boolean
}) {
  const getContent = () => {
    if (isFailure) {
      return (
        <FailureContent
          onConfirm={onConfirm}
          onCancel={onCancel}
          isVerifying={isVerifying}
        />
      )
    }
    if (isSessionExpired) {
      return (
        <SessionExpiredContent
          onConfirm={onConfirm}
          onCancel={onCancel}
          isVerifying={isVerifying}
        />
      )
    }
    return (
      <DefaultContent
        onConfirm={onConfirm}
        onCancel={onCancel}
        isVerifying={isVerifying}
      />
    )
  }

  return (
    <AlertDialog.Root open={open}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className={clsx(
            "fixed inset-0 bg-gray-900/80",

            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:duration-300 data-[state=open]:ease-out",

            "data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=closed]:ease-in data-[state=closed]:fade-out"
          )}
        />
        <div className="fixed inset-0 z-20 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-start sm:p-0 lg:pl-74 sm:pt-[10vh]">
            <AlertDialog.Content
              className={clsx(
                "relative transform overflow-hidden rounded-3xl bg-white p-5 text-left shadow-xl",

                "sm:my-8 sm:w-full sm:max-w-sm",

                "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2 fade-in data-[state=open]:ease-out data-[state=open]:duration-200 data-[state=open]:zoom-in-97",

                "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-2 fade-out data-[state=closed]:ease-in data-[state=closed]:duration-1000 data-[state=closed]:zoom-in-97"
              )}
            >
              {getContent()}
            </AlertDialog.Content>
          </div>
        </div>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

function DefaultContent({
  onConfirm,
  onCancel,
  isVerifying,
  isTokenExpired = false,
}: ContentProps) {
  return (
    <>
      <div className="flex flex-col items-center mt-4">
        <div className="bg-gray-100 size-13 rounded-full flex justify-center items-center">
          <LockClosedIcon className="size-6 text-gray-500" />
        </div>
        <AlertDialog.Title className="mt-5 text-2xl/7 font-bold tracking-tight text-center">
          Verify your wallet
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2 text-base/5 font-medium text-gray-500 text-center text-balance">
          {isTokenExpired
            ? "Your previous login session has expired. Please sign a verification message with your wallet to continue."
            : "Sign a message to verify ownership of your wallet and unlock all features."}
        </AlertDialog.Description>
      </div>

      <ul className="bg-gray-50 rounded-3xl p-5 mt-5 space-y-3">
        {[
          "Secure transactions and transfers",
          "Access to all features",
          "Protection of your assets",
        ].map((text) => (
          <li key={text} className="flex items-center gap-1.5">
            <CheckCircleIcon className="size-4 text-gray-600" />
            <span className="text-sm text-gray-600 font-medium">{text}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 mt-5">
        <Button size="xl" fullWidth onClick={onConfirm} loading={isVerifying}>
          {isVerifying ? "Verifying..." : "Verify wallet"}
        </Button>
        <Button
          size="xl"
          fullWidth
          variant="secondary"
          onClick={onCancel}
          disabled={isVerifying}
        >
          Cancel
        </Button>
      </div>

      <p className="text-sm text-gray-500 font-medium text-center mt-3">
        Canceling will sign you out
      </p>
    </>
  )
}

function FailureContent({ onConfirm, onCancel, isVerifying }: ContentProps) {
  return (
    <>
      <div className="absolute top-0 inset-x-0 h-32 bg-linear-to-b from-red-50 to-red-50/0" />

      <div className="flex flex-col items-center text-center mt-4">
        <div className="bg-red-100 size-13 rounded-full flex justify-center items-center">
          <XMarkIcon className="size-6 text-red-600" />
        </div>
        <AlertDialog.Title className="mt-5 text-2xl/7 font-bold tracking-tight text-center">
          Verification failed
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2 text-base/5 font-medium text-gray-500 text-center text-balance">
          We couldn't verify your wallet. This might happen if you rejected the
          signature request.
        </AlertDialog.Description>
      </div>

      <ul className="bg-gray-50 rounded-3xl p-5 mt-5 space-y-3">
        {[
          "The signature was rejected or timed out",
          "Some wallets may be incompatible",
        ].map((text) => (
          <li key={text} className="flex items-center gap-1.5">
            <XCircleIcon className="size-4 text-gray-600" />
            <span className="text-sm text-gray-600 font-medium">{text}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 mt-5">
        <Button size="xl" fullWidth onClick={onConfirm} loading={isVerifying}>
          Try again
        </Button>
        <Button
          size="xl"
          fullWidth
          variant="secondary"
          onClick={onCancel}
          disabled={isVerifying}
        >
          Sign out
        </Button>
      </div>
    </>
  )
}

function SessionExpiredContent({
  onConfirm,
  onCancel,
  isVerifying,
}: ContentProps) {
  return (
    <>
      <div className="flex flex-col items-center text-center">
        <div className="bg-amber-100 p-3 rounded-2xl mb-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
        </div>
        <AlertDialog.Title className="text-xl font-bold text-gray-900 tracking-tight">
          Session expired
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2 text-sm text-gray-500 text-balance">
          Your session has expired. Please verify your wallet again to continue
          using all features.
        </AlertDialog.Description>
      </div>

      <ul className="bg-gray-50 rounded-2xl p-4 mt-6 space-y-3">
        <FeatureItem text="Secure transactions and transfers" />
        <FeatureItem text="Full access to all features" />
        <FeatureItem text="Protection of your funds" />
      </ul>

      <div className="flex flex-col gap-2 mt-6">
        <Button size="xl" fullWidth onClick={onConfirm} loading={isVerifying}>
          {isVerifying ? "Verifying..." : "Verify again"}
        </Button>
        <Button
          size="xl"
          fullWidth
          variant="secondary"
          onClick={onCancel}
          disabled={isVerifying}
        >
          Cancel
        </Button>
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        Canceling will sign you out
      </p>
    </>
  )
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="bg-gray-900 rounded-full p-1">
        <CheckIcon className="w-3 h-3 text-white" />
      </div>
      <span className="text-sm text-gray-700">{text}</span>
    </li>
  )
}
