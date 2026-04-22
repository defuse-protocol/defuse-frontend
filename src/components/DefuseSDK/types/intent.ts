import type { WithdrawalParams } from "@defuse-protocol/intents-sdk"
import type { TokenDeployment, TokenValue } from "./base"
import type { BaseTokenInfo } from "./base"
import type { IntentsUserId } from "./intentsUserId"

export type IntentDescription =
  | {
      type: "swap"
      totalAmountIn: TokenValue
      totalAmountOut: TokenValue
      depositAddress?: string
    }
  | {
      type: "withdraw"
      tokenOut: BaseTokenInfo
      tokenOutDeployment: TokenDeployment
      amountWithdrawn: TokenValue
      accountId: IntentsUserId
      recipient: string
      nearIntentsNetwork: boolean
      withdrawalParams: WithdrawalParams
    }
  | {
      type: "withdraw"
      tokenOut: BaseTokenInfo
      tokenOutDeployment: TokenDeployment
      recipient: string
      depositAddress: string
      totalAmountIn: TokenValue
      totalAmountOut: TokenValue
    }
