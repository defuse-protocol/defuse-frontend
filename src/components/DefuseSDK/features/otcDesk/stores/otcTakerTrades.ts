import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { MultiPayload } from "../../../types/defuse-contracts-types"

type OtcTakerCompletedTrade = {
  tradeId: string
  status: "completed"
  updatedAt: number
  makerMultiPayload: MultiPayload
  takerMultiPayload: MultiPayload
  intentHashes: string[]
}

type OtcTakerUncompletedTrade = {
  tradeId: string
  status: "uncompleted"
  updatedAt: number
  makerMultiPayload: MultiPayload
}

type OtcTakerTrade = OtcTakerUncompletedTrade | OtcTakerCompletedTrade

type State = {
  trades: Record<OtcTakerTrade["tradeId"], OtcTakerTrade>
}

type Actions = {
  addCompletedTrade: (
    trade: Omit<OtcTakerCompletedTrade, "updatedAt" | "status">
  ) => void
  addUncompletedTrade: (
    trade: Omit<OtcTakerUncompletedTrade, "updatedAt" | "status">
  ) => void
}

type Store = State & Actions

export const otcTakerTradesStore = create<Store>()(
  persist(
    (set) => ({
      trades: {},

      addCompletedTrade: (trade) => {
        set((state) => ({
          trades: {
            ...state.trades,
            [trade.tradeId]: {
              ...trade,
              status: "completed",
              updatedAt: Date.now(),
            },
          },
        }))
      },

      addUncompletedTrade: (trade) => {
        set((state) => ({
          trades: {
            ...state.trades,
            [trade.tradeId]: {
              ...trade,
              status: "uncompleted",
              updatedAt: Date.now(),
            },
          },
        }))
      },
    }),
    {
      name: "intents_sdk.otc_taker_trades",
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export { otcTakerTradesStore as useOtcTakerTrades }
