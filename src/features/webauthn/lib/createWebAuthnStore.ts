import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type Status = "idle" | "signing-in" | "creating-new"

type State<T> = {
  credential: T | undefined
  status: Status
}

type Actions<T, P, C> = {
  setCredential: (passkey: T) => void
  signOut: () => void
  signIn: () => Promise<T>
  createNew: (passkeyName: string) => Promise<T>
  signMessage: (challenge: C) => Promise<P>
}

type Store<T, P, C> = State<T> & Actions<T, P, C>

type PasskeyService<T, P, C> = {
  signIn: () => Promise<T>
  createNew: (passkeyName: string) => Promise<T>
  signMessage: (challenge: C, credential: T) => Promise<P>
}

export const createWebAuthnStore = <T, P, C>(
  service: PasskeyService<T, P, C>
) => {
  return create<Store<T, P, C>>()(
    persist(
      (set, get) => ({
        credential: undefined,
        status: "idle" as Status,

        setCredential: (passkey) => {
          set({ credential: passkey })
        },

        signOut: () => set({ credential: undefined }),

        signIn: async () => {
          if (get().credential != null) {
            throw new Error("Already authenticated")
          }

          if (get().status !== "idle") {
            throw new Error("Authentication already in progress")
          }

          set({ status: "signing-in" })

          try {
            const credential = await service.signIn()
            set({ credential })
            return credential
          } finally {
            set({ status: "idle" })
          }
        },

        createNew: async (passkeyName) => {
          if (get().credential != null) {
            throw new Error("Already authenticated")
          }

          if (get().status !== "idle") {
            throw new Error("Authentication already in progress")
          }

          set({ status: "creating-new" })

          try {
            const credential = await service.createNew(passkeyName)
            set({ credential })
            return credential
          } finally {
            set({ status: "idle" })
          }
        },

        signMessage: async (challenge) => {
          const credential = get().credential
          if (credential == null) {
            throw new Error("Unauthenticated")
          }
          return service.signMessage(challenge, credential)
        },
      }),
      {
        name: "app_wallets_passkey",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ credential: state.credential }),
      }
    )
  )
}
