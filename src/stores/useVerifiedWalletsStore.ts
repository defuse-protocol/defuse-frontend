import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type State = {
  walletAddresses: string[]
  _hasHydrated: boolean
}

type Actions = {
  addWalletAddress: (address: string) => void
  setHasHydrated: (value: boolean) => void
}

type Store = State & Actions

export const useVerifiedWalletsStore = create<Store>()(
  persist(
    (set, get) => ({
      walletAddresses: [],
      _hasHydrated: false,
      addWalletAddress: (address: string) =>
        set({
          walletAddresses: [...get().walletAddresses, address],
        }),
      setHasHydrated: (value: boolean) => set({ _hasHydrated: value }),
    }),
    {
      name: "app_wallets_verified_list",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
