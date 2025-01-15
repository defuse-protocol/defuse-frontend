import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type State = {
  walletAddresses: string[]
}

type Actions = {
  addWalletAddress: (address: string) => void
}

type Store = State & Actions

export const useVerifiedWalletsStore = create<Store>()(
  persist(
    (set, get) => ({
      walletAddresses: [],
      addWalletAddress: (address: string) =>
        set({
          walletAddresses: [...get().walletAddresses, address],
        }),
    }),
    {
      name: "app_wallets_verified_list",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
