import type { TokenDeployment, TokenValue } from "./base"
import type { BaseTokenInfo } from "./base"

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
      recipient: string
      depositAddress: string
      totalAmountIn: TokenValue
      totalAmountOut: TokenValue
    }
