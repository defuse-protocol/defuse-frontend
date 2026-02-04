import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/16/solid"
import { LockClosedIcon, XMarkIcon } from "@heroicons/react/24/outline"
import AlertDialog from "./AlertDialog"
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
  isTokenExpired = false,
}: {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  isVerifying: boolean
  isFailure: boolean
  isTokenExpired?: boolean
}) {
  return (
    <AlertDialog open={open}>
      {isFailure ? (
        <FailureContent
          onConfirm={onConfirm}
          onCancel={onCancel}
          isVerifying={isVerifying}
        />
      ) : (
        <DefaultContent
          onConfirm={onConfirm}
          onCancel={onCancel}
          isVerifying={isVerifying}
          isTokenExpired={isTokenExpired}
        />
      )}
    </AlertDialog>
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
        <AlertDialog.Title className="mt-5">
          Verify your wallet
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2">
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
            <CheckCircleIcon className="size-4 text-gray-600 shrink-0" />
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
        <AlertDialog.Title className="mt-5">
          Verification failed
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2">
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
