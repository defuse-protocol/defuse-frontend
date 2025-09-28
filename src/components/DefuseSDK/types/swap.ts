import type { authHandle, walletMessage } from "@defuse-protocol/internal-utils"
import type { SendNearTransaction } from "../features/machines/publicKeyVerifierMachine"
import type { TokenInfo } from "./base"
import type { RenderHostAppLink } from "./hostAppLink"

export type SwapEvent = {
  type: string
  data: unknown
  error?: string
}

export type SwapWidgetProps = {
  theme?: "dark" | "light"
  tokenList: TokenInfo[]
  onEmit?: (event: SwapEvent) => void

  /**
   * The address (address for EVM, accountId for NEAR, etc) of the user performing the swap.
   * `null` if the user is not authenticated.
   */
  userAddress: authHandle.AuthHandle["identifier"] | undefined
  userChainType: authHandle.AuthHandle["method"] | undefined

  sendNearTransaction: SendNearTransaction

  signMessage: (
    params: walletMessage.WalletMessage
  ) => Promise<walletMessage.WalletSignatureResult | null>
  onSuccessSwap: (params: {
    amountIn: bigint
    amountOut: bigint
    tokenIn: TokenInfo
    tokenOut: TokenInfo
    txHash: string
    intentHash: string
  }) => void

  renderHostAppLink: RenderHostAppLink
  isDCA: boolean
  initialTokenIn?: TokenInfo
  initialTokenOut?: TokenInfo

  /**
   * Optional referral code, used for tracking purposes.
   * Prop is not reactive, set it once when the component is created.
   */
  referral?: string
}

export type SwapWidget1ClickProps = SwapWidgetProps
