import { useShallow } from "zustand/react/shallow"

import {
  getCredential,
  saveCredential,
} from "@src/features/webauthn/lib/webAuthnCredentialService"
import {
  createNew,
  signIn,
  signMessage,
} from "@src/features/webauthn/lib/webauthnService"

import { createWebAuthnStore } from "../lib/createWebAuthnStore"

export const useWebAuthnStore = createWebAuthnStore({
  async signIn() {
    const rawId = await signIn()
    return getCredential(rawId)
  },
  async createNew(passkeyName) {
    const credential = await createNew(passkeyName)
    await saveCredential(credential)
    return credential
  },
  signMessage,
})

export function useWebAuthnActions() {
  return useWebAuthnStore(
    useShallow((state: ReturnType<typeof useWebAuthnStore.getState>) => ({
      signIn: state.signIn,
      createNew: state.createNew,
      signMessage: state.signMessage,
      signOut: state.signOut,
    }))
  )
}

export function useWebAuthnCurrentCredential() {
  return useWebAuthnStore((state) => state.credential)
}

export { useWebAuthnUIStore } from "./useWebAuthnUiStore"
