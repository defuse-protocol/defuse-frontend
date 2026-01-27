import { create } from "zustand"

import { toError } from "@src/utils/errors"
import { logger } from "@src/utils/logger"
import { useWebAuthnStore } from "./useWebAuthnStore"

type State = {
  isOpen: boolean
  isCreating: boolean
  isSigningIn: boolean
  createError: string | null
  signInError: string | null
}

type Actions = {
  open: () => void
  close: () => void
  createNew: (passkeyName: string) => Promise<void>
  signIn: () => Promise<void>
  clearCreateError: () => void
  clearSignInError: () => void
}

export const useWebAuthnUIStore = create<State & Actions>()((set, _get) => ({
  isOpen: false,
  isCreating: false,
  isSigningIn: false,
  createError: null,
  signInError: null,

  open: () => set({ isOpen: true, createError: null, signInError: null }),
  close: () => set({ isOpen: false, createError: null, signInError: null }),
  clearCreateError: () => set({ createError: null }),
  clearSignInError: () => set({ signInError: null }),

  createNew: async (passkeyName) => {
    set({ isCreating: true, createError: null })
    try {
      await useWebAuthnStore.getState().createNew(passkeyName)
      set({ isOpen: false })
    } catch (error) {
      logger.error(error)
      set({ createError: toError(error).message })
    } finally {
      set({ isCreating: false })
    }
  },

  signIn: async () => {
    set({ isSigningIn: true, signInError: null })
    try {
      await useWebAuthnStore.getState().signIn()
      set({ isOpen: false })
    } catch (error) {
      logger.error(error)
      set({ signInError: toError(error).message })
    } finally {
      set({ isSigningIn: false })
    }
  },
}))
