import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type State = {
  walletAddresses: string[]
  _hasHydrated: boolean
}

type Actions = {
  addSkippedWalletAddress: (address: string) => void
  isVerificationSkipped: (address: string) => boolean
  setHasHydrated: (value: boolean) => void
}

type Store = State & Actions

export const useSkippedVerificationStore = create<Store>()(
  persist(
    (set, get) => ({
      walletAddresses: [],
      _hasHydrated: false,
      addSkippedWalletAddress: (address: string) =>
        set({
          walletAddresses: [...get().walletAddresses, address],
        }),
      isVerificationSkipped: (address: string) =>
        get().walletAddresses.includes(address),
      setHasHydrated: (value: boolean) => set({ _hasHydrated: value }),
    }),
    {
      name: "app_wallets_skipped_verification_list",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (state) => (_persistedState, error) => {
        if (!error) {
          state.setHasHydrated(true)
        }
      },
    }
  )
)
