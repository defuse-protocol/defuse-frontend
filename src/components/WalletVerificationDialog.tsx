import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/16/solid"
import { LockClosedIcon, XMarkIcon } from "@heroicons/react/24/outline"
import AlertDialog from "./AlertDialog"
import Button from "./Button"

type ContentProps = {
  onConfirm: () => void
  onCancel: () => void
  isVerifying: boolean
  isPasskey: boolean
  isTokenExpired?: boolean
}

export function WalletVerificationDialog({
  open,
  onConfirm,
  onCancel,
  isVerifying,
  isFailure,
  isSessionExpired = false,
  isPasskey = false,
}: {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  isVerifying: boolean
  isFailure: boolean
  isSessionExpired?: boolean
  isPasskey?: boolean
}) {
  const getContent = () => {
    if (isFailure) {
      return (
        <FailureContent
          onConfirm={onConfirm}
          onCancel={onCancel}
          isVerifying={isVerifying}
          isPasskey={isPasskey}
        />
      )
    }
    if (isSessionExpired) {
      return (
        <SessionExpiredContent
          onConfirm={onConfirm}
          onCancel={onCancel}
          isVerifying={isVerifying}
          isPasskey={isPasskey}
        />
      )
    }
    return (
      <DefaultContent
        onConfirm={onConfirm}
        onCancel={onCancel}
        isVerifying={isVerifying}
        isPasskey={isPasskey}
      />
    )
  }

  return <AlertDialog open={open}>{getContent()}</AlertDialog>
}

function DefaultContent({
  onConfirm,
  onCancel,
  isVerifying,
  isPasskey,
  isTokenExpired = false,
}: ContentProps) {
  const authLabel = isPasskey ? "Passkey" : "wallet"

  return (
    <>
      <div className="flex flex-col items-center mt-4">
        <div className="bg-surface-active size-13 rounded-full flex justify-center items-center">
          <LockClosedIcon className="size-6 text-fg-secondary" />
        </div>
        <AlertDialog.Title className="mt-5">
          Verify your {authLabel}
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2">
          {isTokenExpired
            ? `Your previous login session has expired. Please sign a verification message with your ${authLabel} to continue.`
            : `Sign a message to verify ownership of your ${authLabel} and unlock all features.`}
        </AlertDialog.Description>
      </div>

      <ul className="bg-surface-page rounded-3xl p-5 mt-5 space-y-3">
        {[
          "Secure transactions and transfers",
          "Access to all features",
          "Protection of your assets",
        ].map((text) => (
          <li key={text} className="flex items-center gap-1.5">
            <CheckCircleIcon className="size-4 text-fg-secondary shrink-0" />
            <span className="text-sm text-fg-secondary font-medium">
              {text}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 mt-5">
        <Button size="xl" fullWidth onClick={onConfirm} loading={isVerifying}>
          {isVerifying ? "Verifying..." : `Verify ${authLabel}`}
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

      <p className="text-sm text-fg-secondary font-medium text-center mt-3">
        Canceling will sign you out
      </p>
    </>
  )
}

function FailureContent({
  onConfirm,
  onCancel,
  isVerifying,
  isPasskey,
}: ContentProps) {
  const failureReasons = isPasskey
    ? [
        "The authentication was cancelled or timed out",
        "Your Passkey may not be available on this device",
      ]
    : [
        "The signature was rejected or timed out",
        "Some wallets may be incompatible",
      ]

  return (
    <>
      <div className="absolute top-0 inset-x-0 h-32 bg-linear-to-b from-red-50 to-red-50/0" />

      <div className="flex flex-col items-center text-center mt-4">
        <div className="bg-red-100 size-13 rounded-full flex justify-center items-center">
          <XMarkIcon className="size-6 text-red-600" />
        </div>
        <AlertDialog.Title className="mt-5">
          Verification failed
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2">
          {isPasskey
            ? "We couldn\u2019t verify your Passkey. This might happen if the authentication was cancelled."
            : "We couldn\u2019t verify your wallet. This might happen if you rejected the signature request."}
        </AlertDialog.Description>
      </div>

      <ul className="bg-surface-page rounded-3xl p-5 mt-5 space-y-3">
        {failureReasons.map((text) => (
          <li key={text} className="flex items-center gap-1.5">
            <XCircleIcon className="size-4 text-fg-secondary" />
            <span className="text-sm text-fg-secondary font-medium">
              {text}
            </span>
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
  isPasskey,
}: ContentProps) {
  const authLabel = isPasskey ? "Passkey" : "wallet"

  return (
    <>
      <div className="flex flex-col items-center text-center mt-4">
        <div className="bg-surface-active size-13 rounded-full flex justify-center items-center">
          <LockClosedIcon className="size-6 text-fg-secondary" />
        </div>
        <AlertDialog.Title className="mt-5">Session expired</AlertDialog.Title>
        <AlertDialog.Description className="mt-2">
          Your session has expired. Please verify your {authLabel} again to
          continue using all features.
        </AlertDialog.Description>
      </div>

      <ul className="bg-surface-page rounded-3xl p-5 mt-5 space-y-3">
        {[
          "Secure transactions and transfers",
          "Access to all features",
          "Protection of your assets",
        ].map((text) => (
          <li key={text} className="flex items-center gap-1.5">
            <CheckCircleIcon className="size-4 text-fg-secondary shrink-0" />
            <span className="text-sm text-fg-secondary font-medium">
              {text}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 mt-5">
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

      <p className="text-sm text-fg-secondary font-medium text-center mt-3">
        Canceling will sign you out
      </p>
    </>
  )
}
