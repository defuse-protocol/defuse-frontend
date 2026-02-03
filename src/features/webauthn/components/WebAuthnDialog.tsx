import Alert from "@src/components/Alert"
import Button from "@src/components/Button"

import { BaseModalDialog } from "@src/components/DefuseSDK/components/Modal/ModalDialog"
import { useWebAuthnUIStore } from "@src/features/webauthn/hooks/useWebAuthnUiStore"
import { PasskeyIcon } from "@src/icons"
import clsx from "clsx"
import { useState } from "react"
import { useForm } from "react-hook-form"

interface FormData {
  passkeyName: string
}

export function WebAuthnDialog() {
  const [isCreating, setIsCreating] = useState(false)
  const webauthnUI = useWebAuthnUIStore()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  // Don't render the portal when closed to avoid orphaned DOM elements
  // during navigation that can block interaction
  if (!webauthnUI.isOpen) {
    return null
  }

  return (
    <BaseModalDialog
      open={true}
      onClose={webauthnUI.close}
      back={isCreating ? () => setIsCreating(false) : undefined}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="size-14 rounded-full bg-gray-100 flex items-center justify-center">
          <PasskeyIcon className="size-6" />
        </div>
        <h2 className="mt-4! text-xl font-bold text-center text-gray-900 tracking-tight">
          {isCreating ? "Create new passkey" : "Sign in with passkey"}
        </h2>
      </div>

      {isCreating ? (
        <form
          onSubmit={handleSubmit(({ passkeyName }) => {
            void webauthnUI.createNew(passkeyName)
          })}
          className="mt-6 space-y-2"
        >
          <label htmlFor="passkeyName" className="sr-only">
            Passkey label (only visible to you)
          </label>
          <input
            id="passkeyName"
            type="text"
            placeholder="Passkey label (only visible to you)"
            className={clsx(
              "block rounded-2xl bg-white px-3.5 py-4.5 w-full text-gray-900 font-semibold placeholder:text-gray-400 text-sm leading-none ring-0 border-none outline-1 -outline-offset-1 focus-visible:outline-2 focus-visible:-outline-offset-2",
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
          >
            {webauthnUI.isCreating ? "Creating..." : "Create new passkey"}
          </Button>

          {webauthnUI.createError != null && (
            <Alert variant="error">{webauthnUI.createError}</Alert>
          )}

          <Alert variant="info" className="mt-6">
            Store your passkeys securely. Losing your passkey means losing
            access to your account and any associated funds permanently.
          </Alert>
        </form>
      ) : (
        <div className="mt-6 space-y-2">
          <Button
            onClick={() => webauthnUI.signIn()}
            loading={webauthnUI.isSigningIn}
            size="xl"
            fullWidth
          >
            {webauthnUI.isSigningIn ? "Connecting..." : "Use existing passkey"}
          </Button>

          <Button
            onClick={() => setIsCreating(true)}
            disabled={webauthnUI.isSigningIn}
            size="xl"
            fullWidth
            variant="secondary"
          >
            Create new passkey
          </Button>

          {webauthnUI.signInError != null && (
            <Alert variant="error">{webauthnUI.signInError}</Alert>
          )}
        </div>
      )}
    </BaseModalDialog>
  )
}
