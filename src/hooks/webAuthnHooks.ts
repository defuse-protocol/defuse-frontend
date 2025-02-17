import { useCurrentPasskey } from "@src/stores/passkeyStore"

export function useWebAuthnActions() {
  return useCurrentPasskey((state) => ({
    signIn: state.signIn,
    createNew: state.createNew,
    signMessage: state.signMessage,
    signOut: state.clearCredential,
  }))
}

export function useWebAuthnCurrentCredential() {
  return useCurrentPasskey((state) => state.credential)
}
