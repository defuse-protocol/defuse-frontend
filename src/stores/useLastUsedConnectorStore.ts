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
 * SSR-safe wrapper: returns null for lastUsedConnectorId until the persist
 * middleware has finished rehydrating from localStorage, so server and client
 * output match on the first render.
 */
export function useLastUsedConnectorStore() {
  const store = useLastUsedConnectorStoreBase()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (useLastUsedConnectorStoreBase.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    const unsub = useLastUsedConnectorStoreBase.persist.onFinishHydration(
      () => {
        setHydrated(true)
      }
    )
    return unsub
  }, [])

  return {
    lastUsedConnectorId: hydrated ? store.lastUsedConnectorId : null,
    setLastUsedConnector: store.setLastUsedConnector,
  }
}
