import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type State = {
  lastUsedConnectorId: string | null
}

type Actions = {
  setLastUsedConnector: (id: string) => void
}

type Store = State & Actions

export const useLastUsedConnectorStore = create<Store>()(
  persist(
    (set) => ({
      lastUsedConnectorId: null,
      setLastUsedConnector: (id: string) => set({ lastUsedConnectorId: id }),
    }),
    {
      name: "app_last_used_connector",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
