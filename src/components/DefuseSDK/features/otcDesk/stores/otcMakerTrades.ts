import type { MultiPayload } from "@defuse-protocol/contract-types"
import { authIdentity } from "@defuse-protocol/internal-utils"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { SignerCredentials } from "../../../core/formatters"
import type { IntentsUserId } from "../../../types/intentsUserId"

type OtcMakerTrade = {
  tradeId: string
  updatedAt: number
  makerMultiPayload: MultiPayload
  pKey: string
  iv: string
}

type State = {
  trades: Record<IntentsUserId, OtcMakerTrade[]>
}

type Actions = {
  addTrade: (
    trade: Omit<OtcMakerTrade, "updatedAt">,
    userId: IntentsUserId | SignerCredentials
  ) => void
  removeTrade: (
    tradeId: string,
    userId: IntentsUserId | SignerCredentials
  ) => void
}

type Store = State & Actions

export const otcMakerTradesStore = create<Store>()(
  persist(
    (set) => ({
      trades: {},

      addTrade: (trade, user) => {
        const userId =
          typeof user === "string"
            ? user
            : authIdentity.authHandleToIntentsUserId(
                user.credential,
                user.credentialType
              )

        set((state) => ({
          trades: {
            ...state.trades,
            [userId]: [
              ...(state.trades[userId] ?? []),
              { ...trade, updatedAt: Date.now() },
            ],
          },
        }))
      },

      removeTrade: (tradeId: string, user) => {
        const userId =
          typeof user === "string"
            ? user
            : authIdentity.authHandleToIntentsUserId(
                user.credential,
                user.credentialType
              )

        set((state) => ({
          trades: {
            ...state.trades,
            [userId]: (state.trades[userId] ?? []).filter(
              (trade) => trade.tradeId !== tradeId
            ),
          },
        }))
      },
    }),
    {
      name: "intents_sdk.otc_maker_trades",
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export { otcMakerTradesStore as useOtcMakerTrades }
