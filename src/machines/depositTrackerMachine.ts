import type { DepositStage } from "@src/components/DefuseSDK/features/deposit/utils/depositStatusUtils"
import type {
  BaseTokenInfo,
  SupportedChainName,
  TokenDeployment,
} from "@src/components/DefuseSDK/types/base"
import { assign, setup } from "xstate"

export type TrackedDepositRef = {
  id: string
  token: BaseTokenInfo
  tokenDeployment: TokenDeployment
  amount: bigint
  chainName: SupportedChainName
  userAddress: string
  stage: DepositStage
  txHash?: string
  createdAt: Date
}

export type DepositTrackerContext = {
  deposits: TrackedDepositRef[]
}

export type RegisterDepositParams = {
  id: string
  token: BaseTokenInfo
  tokenDeployment: TokenDeployment
  amount: bigint
  chainName: SupportedChainName
  userAddress: string
}

export const depositTrackerMachine = setup({
  types: {
    context: {} as DepositTrackerContext,
    events: {} as
      | { type: "REGISTER_DEPOSIT"; params: RegisterDepositParams }
      | {
          type: "UPDATE_STAGE"
          id: string
          stage: DepositStage
          txHash?: string
        }
      | { type: "DISMISS_DEPOSIT"; id: string },
  },
  actions: {
    registerDeposit: assign({
      deposits: ({ context, event }) => {
        const { params } = event as {
          type: "REGISTER_DEPOSIT"
          params: RegisterDepositParams
        }
        if (context.deposits.some((d) => d.id === params.id)) {
          return context.deposits
        }
        return [
          {
            id: params.id,
            token: params.token,
            tokenDeployment: params.tokenDeployment,
            amount: params.amount,
            chainName: params.chainName,
            userAddress: params.userAddress,
            stage: "submitting" as DepositStage,
            createdAt: new Date(),
          },
          ...context.deposits,
        ]
      },
    }),
    updateStage: assign({
      deposits: ({ context, event }) => {
        const { id, stage, txHash } = event as {
          type: "UPDATE_STAGE"
          id: string
          stage: DepositStage
          txHash?: string
        }
        return context.deposits.map((d) =>
          d.id === id ? { ...d, stage, txHash: txHash ?? d.txHash } : d
        )
      },
    }),
    dismissDeposit: assign({
      deposits: ({ context, event }) => {
        const { id } = event as { type: "DISMISS_DEPOSIT"; id: string }
        return context.deposits.filter((d) => d.id !== id)
      },
    }),
  },
}).createMachine({
  id: "depositTracker",
  context: { deposits: [] },
  on: {
    REGISTER_DEPOSIT: { actions: "registerDeposit" },
    UPDATE_STAGE: { actions: "updateStage" },
    DISMISS_DEPOSIT: { actions: "dismissDeposit" },
  },
})
