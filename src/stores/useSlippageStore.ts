import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

const DEFAULT_SLIPPAGE_PERCENT = 1 // 1%

type State = {
  slippagePercent: number
}

type Actions = {
  setSlippagePercent: (percent: number) => void
  getSlippageBasisPoints: () => number
}

type Store = State & Actions

const parseSlippageFromStorage = (value: unknown): number => {
  if (typeof value === "number" && value > 0) {
    return value
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed
    }
  }
  return DEFAULT_SLIPPAGE_PERCENT
}

export const useSlippageStore = create<Store>()(
  persist(
    (set, get) => ({
      slippagePercent: DEFAULT_SLIPPAGE_PERCENT,
      setSlippagePercent: (percent: number) => {
        if (percent > 0) {
          set({ slippagePercent: percent })
        }
      },
      getSlippageBasisPoints: () => {
        return Math.round(get().slippagePercent * 10_000)
      },
    }),
    {
      name: "app_slippage_settings",
      storage: createJSONStorage(() => localStorage),
      // Validate and sanitize on rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          const validatedPercent = parseSlippageFromStorage(
            state.slippagePercent
          )
          state.slippagePercent = validatedPercent
        }
      },
    }
  )
)
