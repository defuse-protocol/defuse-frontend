import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type Credential = { publicKey: string; rawId: string }

type State = {
  credential: Credential | undefined
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
      setCredential: (passkey: Credential) => {
        set({ credential: passkey })
      },
      clearCredential: () => set({ credential: undefined }),
    }),
    {
      name: "app_wallets_passkey",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
