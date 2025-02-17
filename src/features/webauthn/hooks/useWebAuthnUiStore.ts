import { create } from "zustand"

import { toError } from "@src/utils/errors"
import { logger } from "@src/utils/logger"
import { useWebAuthnStore } from "./useWebAuthnStore"

type State = {
  isOpen: boolean
  isCreating: boolean
  isSigningIn: boolean
  error: string | null
}

type Actions = {
  open: () => void
  close: () => void
  createNew: () => Promise<void>
  signIn: () => Promise<void>
  clearError: () => void
}

export const useWebAuthnUIStore = create<State & Actions>()((set, get) => ({
  isOpen: false,
  isCreating: false,
  isSigningIn: false,
  error: null,

  open: () => set({ isOpen: true, error: null }),
  close: () => set({ isOpen: false, error: null }),
  clearError: () => set({ error: null }),

  createNew: async () => {
    set({ isCreating: true, error: null })
    try {
      await useWebAuthnStore.getState().createNew()
      set({ isOpen: false })
    } catch (error) {
      logger.error(error)
      set({ error: toError(error).message })
    } finally {
      set({ isCreating: false })
    }
  },

  signIn: async () => {
    set({ isSigningIn: true, error: null })
    try {
      await useWebAuthnStore.getState().signIn()
      set({ isOpen: false })
    } catch (error) {
      logger.error(error)
      set({ error: toError(error).message })
    } finally {
      set({ isSigningIn: false })
    }
  },
}))
