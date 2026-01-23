import type { MultiPayload } from "@defuse-protocol/contract-types"
import { authIdentity } from "@defuse-protocol/internal-utils"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { SignerCredentials } from "../../../core/formatters"
import type { IntentsUserId } from "../../../types/intentsUserId"

export type OtcMakerTradeOutcome = "pending" | "executed" | "cancelled"

type OtcMakerTrade = {
  tradeId: string
  updatedAt: number
  makerMultiPayload: MultiPayload
  pKey: string
  iv: string
  /** Intent hash returned from solver relay when trade was published */
  intentHash?: string
  /** Outcome of the trade - only known on the device that created it */
  outcome?: OtcMakerTradeOutcome
}

type State = {
  trades: Record<IntentsUserId, OtcMakerTrade[]>
}

type Actions = {
  addTrade: (
    trade: Omit<OtcMakerTrade, "updatedAt" | "outcome">,
    userId: IntentsUserId | SignerCredentials
  ) => void
  removeTrade: (
    tradeId: string,
    userId: IntentsUserId | SignerCredentials
  ) => void
  updateTradeOutcome: (
    tradeId: string,
    outcome: OtcMakerTradeOutcome,
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
              { ...trade, updatedAt: Date.now(), outcome: "pending" },
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

      updateTradeOutcome: (tradeId, outcome, user) => {
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
            [userId]: (state.trades[userId] ?? []).map((trade) =>
              trade.tradeId === tradeId
                ? { ...trade, outcome, updatedAt: Date.now() }
                : trade
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
