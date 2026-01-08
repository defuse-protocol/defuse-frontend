import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type State = {
  walletAddresses: string[]
}

type Actions = {
  addSkippedWalletAddress: (address: string) => void
  isVerificationSkipped: (address: string) => boolean
}

type Store = State & Actions

export const useSkippedVerificationStore = create<Store>()(
  persist(
    (set, get) => ({
      walletAddresses: [],
      addSkippedWalletAddress: (address: string) =>
        set({
          walletAddresses: [...get().walletAddresses, address],
        }),
      isVerificationSkipped: (address: string) =>
        get().walletAddresses.includes(address),
    }),
    {
      name: "app_wallets_skipped_verification_list",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
