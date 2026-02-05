import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type State = {
  isPrivateModeEnabled: boolean
}

type Actions = {
  setPrivateModeEnabled: (enabled: boolean) => void
  togglePrivateMode: () => void
}

type Store = State & Actions

export const usePrivateModeStore = create<Store>()(
  persist(
    (set, get) => ({
      isPrivateModeEnabled: false,
      setPrivateModeEnabled: (enabled: boolean) => {
        set({ isPrivateModeEnabled: enabled })
      },
      togglePrivateMode: () => {
        set({ isPrivateModeEnabled: !get().isPrivateModeEnabled })
      },
    }),
    {
      name: "app_private_mode",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
