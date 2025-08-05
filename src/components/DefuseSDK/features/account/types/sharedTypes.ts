import type {
  BaseTokenInfo,
  TokenValue,
  UnifiedTokenInfo,
} from "../../../types/base"

export interface Holding {
  token: BaseTokenInfo | UnifiedTokenInfo
  value: TokenValue | undefined
  usdValue: number | undefined
  transitValue: TokenValue | undefined
  transitUsdValue: number | undefined
}
