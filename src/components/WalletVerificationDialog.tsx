import * as AlertDialog from "@radix-ui/react-alert-dialog"
import {
  CheckIcon,
  Cross2Icon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  MinusCircledIcon,
} from "@radix-ui/react-icons"
import Button from "./Button"

type ContentProps = {
  onConfirm: () => void
  onCancel: () => void
  isVerifying: boolean
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
        <AlertDialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-4">
          <div className="rounded-3xl p-6 bg-white shadow-2xl">
            {getContent()}
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

function DefaultContent({ onConfirm, onCancel, isVerifying }: ContentProps) {
  return (
    <>
      <div className="flex flex-col items-center text-center">
        <div className="bg-gray-100 p-3 rounded-2xl mb-4">
          <LockClosedIcon className="w-6 h-6 text-gray-600" />
        </div>
        <AlertDialog.Title className="text-xl font-bold text-gray-900 tracking-tight">
          Verify your wallet
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2 text-sm text-gray-500 text-balance">
          Sign a message to verify ownership of your wallet and unlock all
          features.
        </AlertDialog.Description>
      </div>

      <ul className="bg-gray-50 rounded-2xl p-4 mt-6 space-y-3">
        <FeatureItem text="Secure transactions and transfers" />
        <FeatureItem text="Full access to all features" />
        <FeatureItem text="Protection of your funds" />
      </ul>

      <div className="flex flex-col gap-2 mt-6">
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

      <p className="text-xs text-gray-400 text-center mt-4">
        Canceling will sign you out
      </p>
    </>
  )
}

function FailureContent({ onConfirm, onCancel, isVerifying }: ContentProps) {
  return (
    <>
      <div className="flex flex-col items-center text-center">
        <div className="bg-red-100 p-3 rounded-2xl mb-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
        </div>
        <AlertDialog.Title className="text-xl font-bold text-gray-900 tracking-tight">
          Verification failed
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2 text-sm text-gray-500 text-balance">
          We couldn't verify your wallet. This might happen if you rejected the
          signature request.
        </AlertDialog.Description>
      </div>

      <ul className="bg-gray-50 rounded-2xl p-4 mt-6 space-y-3">
        <li className="flex items-start gap-3">
          <div className="bg-gray-300 rounded-full p-1 mt-0.5">
            <Cross2Icon className="w-3 h-3 text-gray-600" />
          </div>
          <span className="text-sm text-gray-700">
            The signature was rejected or timed out
          </span>
        </li>
        <li className="flex items-start gap-3">
          <div className="bg-gray-300 rounded-full p-1 mt-0.5">
            <MinusCircledIcon className="w-3 h-3 text-gray-600" />
          </div>
          <span className="text-sm text-gray-700">
            Some wallets may be incompatible
          </span>
        </li>
      </ul>

      <div className="flex flex-col gap-2 mt-6">
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
