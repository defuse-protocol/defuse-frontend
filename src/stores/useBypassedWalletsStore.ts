import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type State = {
  walletAddresses: string[]
}

type Actions = {
  addBypassedWalletAddress: (address: string) => void
  isWalletBypassed: (address: string) => boolean
}

type Store = State & Actions

export const useBypassedWalletsStore = create<Store>()(
  persist(
    (set, get) => ({
      walletAddresses: [],
      addBypassedWalletAddress: (address: string) =>
        set({
          walletAddresses: [...get().walletAddresses, address],
        }),
      isWalletBypassed: (address: string) =>
        get().walletAddresses.includes(address),
    }),
    {
      name: "app_wallets_bypassed_list",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
