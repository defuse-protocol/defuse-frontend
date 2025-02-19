import { Cross2Icon, ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { Button, Callout, Dialog, Separator, Spinner } from "@radix-ui/themes"
import Image from "next/image"
import React from "react"

import { useWebAuthnUIStore } from "@src/features/webauthn/hooks/useWebAuthnUiStore"

export function WebAuthnDialog() {
  const webauthnUI = useWebAuthnUIStore()

  // This is a hack to prevent the dialog background from being flickering
  if (!webauthnUI.isOpen) {
    return null
  }

  return (
    <Dialog.Root open={webauthnUI.isOpen} onOpenChange={webauthnUI.close}>
      <Dialog.Content className="max-w-md pt-7 pb-6">
        <Dialog.Close>
          <button
            type="button"
            className="flex items-center justify-center absolute top-5 right-5 size-10 rounded-full hover:bg-gray-3 active:bg-gray-4"
          >
            <Cross2Icon className="size-5" />
          </button>
        </Dialog.Close>

        <Dialog.Title>
          <div className="flex flex-col items-center gap-3">
            <Image
              src="/static/icons/wallets/webauthn.svg"
              alt=""
              width={46}
              height={46}
            />
            <div className="text-2xl font-black text-center">
              Sign in with passkey
            </div>
          </div>
        </Dialog.Title>

        <div className="flex flex-col gap-5 mt-3">
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              onClick={() => webauthnUI.signIn()}
              size="4"
              className="font-bold"
            >
              <Spinner loading={webauthnUI.isSigningIn} />
              {webauthnUI.isSigningIn
                ? "Connecting..."
                : "Use existing passkey"}
            </Button>

            {webauthnUI.error != null && (
              <Callout.Root
                color="red"
                className="px-3 py-2 text-xs font-medium"
              >
                <Callout.Icon className="[--callout-icon-height:18px]">
                  <ExclamationTriangleIcon />
                </Callout.Icon>
                <Callout.Text className="text-xs font-medium">
                  {webauthnUI.error}
                </Callout.Text>
              </Callout.Root>
            )}
          </div>

          <div className="flex gap-6 items-center justify-center -mx-6">
            <Separator
              orientation="horizontal"
              className="flex-1 border-border"
            />
            <div className="text-gray-11 font-bold text-xs">OR</div>
            <Separator
              orientation="horizontal"
              className="flex-1 border-border"
            />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              const formData = new FormData(event.currentTarget)
              const passkeyName = formData.get("passkeyName") ?? ""

              if (typeof passkeyName !== "string") {
                throw new Error("Invalid passkey name")
              }

              void webauthnUI.createNew(passkeyName)
            }}
            className="flex flex-col gap-4"
          >
            <div className="text-2xl font-black text-center">
              Create new passkey
            </div>

            <input
              name="passkeyName"
              placeholder="Passkey label (only visible to you)"
              required
              className="border-0 rounded-lg py-2 px-4 bg-gray-3 !ring-accent-9 placeholder:font-medium placeholder:text-gray-11 font-medium text-accent-12 text-sm h-12 ease-in-out hover:bg-gray-4 focus:bg-gray-4 focus:ring-2 focus:ring-inset"
            />

            <Button
              type="submit"
              size="4"
              variant="outline"
              className="font-bold"
            >
              <Spinner loading={webauthnUI.isCreating} />
              {webauthnUI.isCreating ? "Creating..." : "Create new passkey"}
            </Button>

            <Callout.Root className="bg-warning px-3 py-2 text-warning-foreground mt-2">
              <Callout.Text className="text-xs font-medium">
                <span className="font-bold">Store your passkeys securely.</span>{" "}
                Losing your passkey means losing access to your account and any
                associated funds permanently.
              </Callout.Text>
            </Callout.Root>
          </form>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  )
}
