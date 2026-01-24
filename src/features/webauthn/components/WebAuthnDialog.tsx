import Alert from "@src/components/Alert"
import Button from "@src/components/Button"

import { BaseModalDialog } from "@src/components/DefuseSDK/components/Modal/ModalDialog"
import { useWebAuthnUIStore } from "@src/features/webauthn/hooks/useWebAuthnUiStore"
import { PasskeyIcon } from "@src/icons"
import clsx from "clsx"
import { useForm } from "react-hook-form"

interface FormData {
  passkeyName: string
}

export function WebAuthnDialog() {
  const webauthnUI = useWebAuthnUIStore()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  return (
    <BaseModalDialog open={webauthnUI.isOpen} onClose={webauthnUI.close}>
      <div className="flex flex-col items-center justify-center">
        <div className="size-14 rounded-full bg-gray-100 flex items-center justify-center">
          <PasskeyIcon className="size-6" />
        </div>
        <h2 className="mt-3 text-xl font-bold text-center text-gray-900 tracking-tight">
          Sign in with passkey
        </h2>
      </div>
      <div className="mt-6">
        <Button
          onClick={() => webauthnUI.signIn()}
          loading={webauthnUI.isSigningIn}
          size="xl"
          fullWidth
        >
          {webauthnUI.isSigningIn ? "Connecting..." : "Use existing passkey"}
        </Button>

        {webauthnUI.signInError != null && (
          <Alert variant="error" className="mt-2">
            {webauthnUI.signInError}
          </Alert>
        )}
      </div>

      <div className="mt-8 flex items-center gap-x-6 self-stretch">
        <div className="w-full flex-1 border-t border-gray-200" />
        <p className="text-xs font-semibold text-nowrap text-gray-500 uppercase">
          Or
        </p>
        <div className="w-full flex-1 border-t border-gray-200" />
      </div>

      <h2 className="mt-8 text-xl font-bold text-center text-gray-900 tracking-tight">
        Create new passkey
      </h2>

      <form
        className="mt-4"
        onSubmit={handleSubmit(({ passkeyName }) => {
          void webauthnUI.createNew(passkeyName)
        })}
      >
        <label htmlFor="passkeyName" className="sr-only">
          Passkey label (only visible to you)
        </label>
        <input
          id="passkeyName"
          type="text"
          placeholder="Passkey label (only visible to you)"
          className={clsx(
            "block rounded-2xl bg-white px-3 py-4 w-full text-gray-900 font-semibold placeholder:text-gray-400 text-sm leading-none ring-0 border-none outline-1 -outline-offset-1 focus-visible:outline-2 focus-visible:-outline-offset-2",
            errors.passkeyName
              ? "outline-red-500 focus-within:outline-red-500"
              : "outline-gray-200 focus-within:outline-gray-900"
          )}
          {...register("passkeyName", { required: true })}
        />

        <Button
          type="submit"
          size="xl"
          fullWidth
          loading={webauthnUI.isCreating}
          className="mt-2"
        >
          {webauthnUI.isCreating ? "Creating..." : "Create new passkey"}
        </Button>

        {webauthnUI.createError != null && (
          <Alert variant="error" className="mt-2">
            {webauthnUI.createError}
          </Alert>
        )}
      </form>

      <Alert variant="info" className="mt-6">
        Store your passkeys securely. Losing your passkey means losing access to
        your account and any associated funds permanently.
      </Alert>
    </BaseModalDialog>
  )
}
