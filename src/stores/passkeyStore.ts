import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type Credential = { publicKey: string; rawId: string }

type State = {
  credential: Credential | undefined
  knownCredentials: Credential[]
}

type Actions = {
  setCredential: (passkey: Credential) => void
  clearCredential: () => void
}

type Store = State & Actions

export const useCurrentPasskey = create<Store>()(
  persist(
    (set) => ({
      credential: undefined,
      knownCredentials: [],
      setCredential: (passkey: Credential) => {
        set({ credential: passkey })

        set((state) => {
          if (
            !state.knownCredentials.some(
              (c) => c.publicKey === passkey.publicKey
            )
          ) {
            return { knownCredentials: [...state.knownCredentials, passkey] }
          }
          return {}
        })
      },
      clearCredential: () => set({ credential: undefined }),
    }),
    {
      name: "app_wallets_passkey",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
