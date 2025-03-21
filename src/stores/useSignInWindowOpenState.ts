import { create } from "zustand"

type State = {
  isOpen: boolean
}

type Actions = {
  open: () => void
  setIsOpen: (isOpen: boolean) => void
}

type Store = State & Actions

export const useSignInWindowOpenState = create<Store>()((set) => ({
  isOpen: false,
  open: () => {
    set({ isOpen: true })
  },
  setIsOpen: (isOpen: boolean) => {
    set({ isOpen })
  },
}))
