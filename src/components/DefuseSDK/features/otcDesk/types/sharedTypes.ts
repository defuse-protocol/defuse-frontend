import type { MultiPayload } from "@defuse-protocol/contract-types"
import type { walletMessage } from "@defuse-protocol/internal-utils"
import type { Result } from "@thames/monads"
import type { TokenValue } from "../../../types/base"

export type SignMessage = (
  params: walletMessage.WalletMessage
) => Promise<walletMessage.WalletSignatureResult | null>

export type TradeBreakdown = {
  makerSends: TokenValue
  makerReceives: TokenValue
  makerPaysFee: TokenValue
  takerSends: TokenValue
  takerReceives: TokenValue
  takerPaysFee: TokenValue
}

// biome-ignore lint/suspicious/noExplicitAny: we need `any` here
export type ExtractOk<R extends Result<any, any>> = R extends Result<
  infer T,
  // biome-ignore lint/suspicious/noExplicitAny: we need `any` here
  any
>
  ? T
  : never

// biome-ignore lint/suspicious/noExplicitAny: we need `any` here
export type ExtractErr<R extends Result<any, any>> = R extends Result<
  // biome-ignore lint/suspicious/noExplicitAny: we need `any` here
  any,
  infer T
>
  ? T
  : never

export type CreateOtcTrade = (
  multiPayload: MultiPayload
) => Promise<{ tradeId: string; pKey: string; iv: string }>

export type GenerateLink = (
  tradeId: string,
  /** @deprecated Required for backwards compatibility */
  pKey: string,
  /** @deprecated Required for backwards compatibility */
  multiPayload: MultiPayload,
  iv: string
) => string
