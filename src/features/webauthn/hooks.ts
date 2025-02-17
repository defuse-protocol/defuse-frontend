import {
  getCredential,
  saveCredential,
} from "@src/features/webauthn/lib/webauthnCredentialPersistenceService"
import {
  createNew,
  signIn,
  signMessage,
} from "@src/features/webauthn/lib/webauthnService"
import { createWebAuthnStore } from "./lib/createWebAuthnStore"

export const useWebAuthnStore = createWebAuthnStore({
  async signIn() {
    const rawId = await signIn()
    return getCredential(rawId)
  },
  async createNew() {
    const credential = await createNew()
    await saveCredential(credential)
    return credential
  },
  signMessage,
})

export function useWebAuthnActions() {
  return useWebAuthnStore((state) => ({
    signIn: state.signIn,
    createNew: state.createNew,
    signMessage: state.signMessage,
    signOut: state.signOut,
  }))
}

export function useWebAuthnCurrentCredential() {
  return useWebAuthnStore((state) => state.credential)
}

export { useWebAuthnUIStore } from "./lib/webauthnUIStore"
