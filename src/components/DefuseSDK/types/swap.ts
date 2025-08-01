import type { AuthMethod, walletMessage } from "@defuse-protocol/internal-utils"
import type { SendNearTransaction } from "../features/machines/publicKeyVerifierMachine"
import type { BaseTokenInfo, UnifiedTokenInfo } from "./base"
import type { RenderHostAppLink } from "./hostAppLink"

export type SwapEvent = {
  type: string
  data: unknown
  error?: string
}

export type SwappableToken = BaseTokenInfo | UnifiedTokenInfo

export type SwapWidgetProps = {
  theme?: "dark" | "light"
  tokenList: SwappableToken[]
  onEmit?: (event: SwapEvent) => void

  /**
   * The address (address for EVM, accountId for NEAR, etc) of the user performing the swap.
   * `null` if the user is not authenticated.
   */
  userAddress: string | null
  userChainType: AuthMethod | null

  sendNearTransaction: SendNearTransaction

  signMessage: (
    params: walletMessage.WalletMessage
  ) => Promise<walletMessage.WalletSignatureResult | null>
  onSuccessSwap: (params: {
    amountIn: bigint
    amountOut: bigint
    tokenIn: SwappableToken
    tokenOut: SwappableToken
    txHash: string
    intentHash: string
  }) => void

  renderHostAppLink: RenderHostAppLink
  initialTokenIn?: SwappableToken
  initialTokenOut?: SwappableToken

  /**
   * Optional referral code, used for tracking purposes.
   * Prop is not reactive, set it once when the component is created.
   */
  referral?: string

  /**
   * Callback function called when tokens change (tokenIn or tokenOut)
   */
  onTokenChange?: (params: {
    tokenIn: SwappableToken | null
    tokenOut: SwappableToken | null
  }) => void
}

export type SwapWidget1ClickProps = SwapWidgetProps
