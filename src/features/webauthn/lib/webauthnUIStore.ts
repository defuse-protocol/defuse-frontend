import { create } from "zustand"
import { useWebAuthnStore } from "../hooks"

type State = {
  isOpen: boolean
  isCreating: boolean
  isSigningIn: boolean
}

type Actions = {
  open: () => void
  close: () => void
  createNew: () => Promise<void>
  signIn: () => Promise<void>
}

export const useWebAuthnUIStore = create<State & Actions>()((set, get) => ({
  isOpen: false,
  isCreating: false,
  isSigningIn: false,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  createNew: async () => {
    set({ isCreating: true })
    try {
      await useWebAuthnStore.getState().createNew()
      set({ isOpen: false })
    } finally {
      set({ isCreating: false })
    }
  },

  signIn: async () => {
    set({ isSigningIn: true })
    try {
      await useWebAuthnStore.getState().signIn()
      set({ isOpen: false })
    } finally {
      set({ isSigningIn: false })
    }
  },
}))
