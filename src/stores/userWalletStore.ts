import { create } from "zustand"

import type { State } from "@src/hooks/useConnectWallet"

const defaultState: State = {
  chainType: undefined,
  network: undefined,
  address: undefined,
}

export const useUserWalletStore = create<{
  wallet: State
  clearWallet: () => void
  confirmWallet: (walletState: State) => void
}>((set) => ({
  wallet: defaultState,
  clearWallet: () => {
    set({ wallet: defaultState })
  },
  confirmWallet: (walletState: State) => {
    set({ wallet: walletState })
  },
}))
