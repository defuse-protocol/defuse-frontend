import { Button, Dialog, Spinner, Text } from "@radix-ui/themes"
import Image from "next/image"
import React from "react"

import { useWebAuthnUIStore } from "@src/features/webauthn/hooks/useWebAuthnUiStore"

export function WebAuthnDialog() {
  const webauthnUI = useWebAuthnUIStore()

  return (
    <Dialog.Root open={webauthnUI.isOpen} onOpenChange={webauthnUI.close}>
      <Dialog.Content className="max-w-md">
        <Dialog.Title>
          <div className="flex flex-col items-center gap-3">
            <Image
              src="/static/icons/wallets/webauthn.svg"
              alt=""
              width={46}
              height={46}
            />
            <div className="text-2xl font-black text-center text-pretty">
              How do you want
              <br />
              to connect with passkey?
            </div>
          </div>
        </Dialog.Title>

        {webauthnUI.error != null && (
          <Text color="red" className="text-center mt-4">
            {webauthnUI.error}
          </Text>
        )}

        <div className="flex flex-col gap-4 mt-5">
          <Button
            type="button"
            onClick={() => webauthnUI.signIn()}
            disabled={webauthnUI.isSigningIn || webauthnUI.isCreating}
            size="4"
            className="font-bold"
          >
            <Spinner loading={webauthnUI.isSigningIn} />
            {webauthnUI.isSigningIn ? "Connecting..." : "Use existing passkey"}
          </Button>
          <Button
            type="button"
            onClick={() => webauthnUI.createNew()}
            disabled={webauthnUI.isCreating || webauthnUI.isSigningIn}
            size="4"
            variant="soft"
            color="gray"
            className="font-bold"
          >
            <Spinner loading={webauthnUI.isCreating} />
            {webauthnUI.isCreating ? "Creating..." : "Create new passkey"}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  )
}
