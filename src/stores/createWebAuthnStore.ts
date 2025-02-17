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
  createNew: () => Promise<T>
  signMessage: (challenge: C) => Promise<P>
}

type Store<T, P, C> = State<T> & Actions<T, P, C>

type PasskeyService<T, P, C> = {
  signIn: () => Promise<T>
  createNew: () => Promise<T>
  signMessage: (challenge: C) => Promise<P>
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

        createNew: async () => {
          if (get().credential != null) {
            throw new Error("Already authenticated")
          }

          if (get().status !== "idle") {
            throw new Error("Authentication already in progress")
          }

          set({ status: "creating-new" })

          try {
            const credential = await service.createNew()
            set({ credential })
            return credential
          } finally {
            set({ status: "idle" })
          }
        },

        signMessage: async (challenge) => {
          if (get().credential == null) {
            throw new Error("Unauthenticated")
          }
          return service.signMessage(challenge)
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
