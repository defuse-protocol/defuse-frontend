import type { TokenInfo, TokenValue } from "../../../types/base"

export interface Holding {
  token: TokenInfo
  value: TokenValue | undefined
  usdValue: number | undefined
  transitValue: TokenValue | undefined
  transitUsdValue: number | undefined
}
