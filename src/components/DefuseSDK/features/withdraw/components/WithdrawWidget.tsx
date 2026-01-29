"use client"
import { messageFactory } from "@defuse-protocol/internal-utils"
import { base64 } from "@scure/base"
import { bridgeSDK } from "@src/components/DefuseSDK/constants/bridgeSdk"
import type {
  SupportedChainName,
  TokenInfo,
} from "@src/components/DefuseSDK/types/base"
import { useIs1CsEnabled } from "@src/hooks/useIs1CsEnabled"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import { getAppFeeRecipient } from "@src/utils/getAppFeeRecipient"
import { useSelector } from "@xstate/react"
import { useContext } from "react"
import { fromPromise } from "xstate"
import {
  TokenListUpdater,
  TokenListUpdater1cs,
} from "../../../components/TokenListUpdater"
import { settings } from "../../../constants/settings"
import { WithdrawWidgetProvider } from "../../../providers/WithdrawWidgetProvider"
import type { WithdrawWidgetProps } from "../../../types/withdraw"
import { assert } from "../../../utils/assert"
import { isSupportedChainName } from "../../../utils/blockchain"
import { isBaseToken } from "../../../utils/token"
import { swapIntentMachine } from "../../machines/swapIntentMachine"
import { withdrawUIMachine } from "../../machines/withdrawUIMachine"
import { WithdrawUIMachineContext } from "../WithdrawUIMachineContext"
import { WithdrawForm } from "./WithdrawForm"

/**
 * Check if a token has a deployment on the specified network
 */
function tokenSupportsNetwork(token: TokenInfo, network: string): boolean {
  if (isBaseToken(token)) {
    return token.deployments.some((d) => d.chainName === network)
  }
  return token.groupedTokens.some((gt) =>
    gt.deployments.some((d) => d.chainName === network)
  )
}

/**
 * Find a token from the list that supports the given network.
 * Returns undefined if no token supports the network.
 */
function findTokenForNetwork(
  tokenList: TokenInfo[],
  network: string
): TokenInfo | undefined {
  return tokenList.find((token) => tokenSupportsNetwork(token, network))
}

export const WithdrawWidget = (props: WithdrawWidgetProps) => {
  const is1cs = useIs1CsEnabled()
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)
  const appFeeRecipient = getAppFeeRecipient(whitelabelTemplate)

  // Determine initial token based on presets
  // Priority: presetTokenSymbol > presetNetwork > first token in list
  let initialTokenIn: TokenInfo | undefined

  if (props.presetTokenSymbol !== undefined) {
    // If a specific token is requested, use it
    initialTokenIn = props.tokenList.find(
      (el) =>
        el.symbol.toLowerCase().normalize() ===
        props.presetTokenSymbol?.toLowerCase().normalize()
    )
  }

  // Track if we couldn't find a token for the preset network
  let noTokenForPresetNetwork: SupportedChainName | null = null

  // If no token found by symbol, try to find one that supports the preset network
  if (
    initialTokenIn == null &&
    props.presetNetwork != null &&
    isSupportedChainName(props.presetNetwork)
  ) {
    initialTokenIn = findTokenForNetwork(props.tokenList, props.presetNetwork)
    if (initialTokenIn == null) {
      // User has no tokens available for this network
      noTokenForPresetNetwork = props.presetNetwork
    }
  }

  // Fall back to first token in list
  if (initialTokenIn == null) {
    initialTokenIn = props.tokenList[0]
  }

  assert(initialTokenIn, "Token list must have at least 1 token")

  const initialTokenOut = isBaseToken(initialTokenIn)
    ? initialTokenIn
    : initialTokenIn.groupedTokens[0]

  assert(
    initialTokenOut != null && isBaseToken(initialTokenOut),
    "Token out must be base token"
  )

  return (
    <WithdrawWidgetProvider>
      <WithdrawUIMachineContext.Provider
        options={{
          input: {
            tokenIn: initialTokenIn,
            tokenOut: initialTokenOut,
            tokenList: props.tokenList,
            referral: props.referral,
            appFeeRecipient,
          },
        }}
        logic={withdrawUIMachine.provide({
          actors: {
            swapActor: swapIntentMachine.provide({
              actors: {
                signMessage: fromPromise(({ input }) => {
                  return props.signMessage(input)
                }),
                prepareSignMessages: fromPromise(async ({ input }) => {
                  assert(
                    input.intentOperationParams.type === "withdraw",
                    "Type must be withdraw"
                  )
                  const { nonce, deadline } = await bridgeSDK
                    .intentBuilder()
                    .setDeadline(
                      new Date(Date.now() + settings.swapExpirySec * 1000)
                    )
                    .build()

                  const { quote } = input.intentOperationParams

                  const innerMessage = messageFactory.makeInnerSwapMessage({
                    deadlineTimestamp: Date.parse(deadline),
                    referral: input.referral,
                    signerId: input.defuseUserId,
                    tokenDeltas: quote?.tokenDeltas ?? [],
                    appFee: quote?.appFee ?? [],
                    appFeeRecipient: input.appFeeRecipient,
                  })

                  innerMessage.intents ??= []
                  innerMessage.intents.push(
                    ...input.intentOperationParams.prebuiltWithdrawalIntents
                  )

                  return {
                    innerMessage,
                    walletMessage: messageFactory.makeSwapMessage({
                      innerMessage,
                      nonce: base64.decode(nonce),
                    }),
                  }
                }),
              },
            }),
          },
        })}
      >
        {is1cs ? (
          <TokenListUpdaterWithdraw tokenList={props.tokenList} />
        ) : (
          <TokenListUpdater tokenList={props.tokenList} />
        )}
        <WithdrawForm
          {...props}
          noTokenForPresetNetwork={noTokenForPresetNetwork}
        />
      </WithdrawUIMachineContext.Provider>
    </WithdrawWidgetProvider>
  )
}

function TokenListUpdaterWithdraw({ tokenList }: { tokenList: TokenInfo[] }) {
  const withdrawUIActorRef = WithdrawUIMachineContext.useActorRef()
  const { withdrawFormRef, depositedBalanceRef } = useSelector(
    withdrawUIActorRef,
    (state) => {
      return {
        withdrawFormRef: state.context.withdrawFormRef,
        depositedBalanceRef: state.context.depositedBalanceRef,
      }
    }
  )

  const { tokenIn, tokenOut } = useSelector(withdrawFormRef, (state) => {
    return {
      tokenIn: state.context.tokenIn,
      tokenOut: state.context.tokenOut,
    }
  })

  return (
    <TokenListUpdater1cs
      tokenList={tokenList}
      depositedBalanceRef={depositedBalanceRef}
      tokenIn={tokenIn}
      tokenOut={tokenOut}
    />
  )
}
