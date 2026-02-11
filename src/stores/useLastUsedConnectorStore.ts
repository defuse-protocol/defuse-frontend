import { useEffect, useState } from "react"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type State = {
  lastUsedConnectorId: string | null
}

type Actions = {
  setLastUsedConnector: (id: string) => void
}

type Store = State & Actions

const useLastUsedConnectorStoreBase = create<Store>()(
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

/**
 * SSR-safe wrapper: returns null for lastUsedConnectorId on the first render
 * so the server and client output match, then rehydrates from localStorage.
 */
export function useLastUsedConnectorStore() {
  const store = useLastUsedConnectorStoreBase()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return {
    lastUsedConnectorId: hydrated ? store.lastUsedConnectorId : null,
    setLastUsedConnector: store.setLastUsedConnector,
  }
}
