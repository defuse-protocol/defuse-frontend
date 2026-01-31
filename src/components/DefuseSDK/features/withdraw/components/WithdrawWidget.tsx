"use client"
import { messageFactory } from "@defuse-protocol/internal-utils"
import { base64 } from "@scure/base"
import { bridgeSDK } from "@src/components/DefuseSDK/constants/bridgeSdk"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { useIs1CsEnabled } from "@src/hooks/useIs1CsEnabled"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import { getAppFeeRecipient } from "@src/utils/getAppFeeRecipient"
import { useQueryClient } from "@tanstack/react-query"
import { useSelector } from "@xstate/react"
import { useContext } from "react"
import { fromPromise } from "xstate"
import {
  TokenListUpdater,
  TokenListUpdater1cs,
} from "../../../components/TokenListUpdater"
import { settings } from "../../../constants/settings"
import {
  type TokenUsdPriceData,
  tokensUsdPricesQueryKey,
} from "../../../hooks/useTokensUsdPrices"
import { WithdrawWidgetProvider } from "../../../providers/WithdrawWidgetProvider"
import type { WithdrawWidgetProps } from "../../../types/withdraw"
import { assert } from "../../../utils/assert"
import { isBaseToken } from "../../../utils/token"
import { swapIntentMachine } from "../../machines/swapIntentMachine"
import { withdrawUIMachine } from "../../machines/withdrawUIMachine"
import { WithdrawUIMachineContext } from "../WithdrawUIMachineContext"
import { WithdrawForm } from "./WithdrawForm"

export const WithdrawWidget = (props: WithdrawWidgetProps) => {
  const is1cs = useIs1CsEnabled()
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)
  const appFeeRecipient = getAppFeeRecipient(whitelabelTemplate)
  const queryClient = useQueryClient()
  const cachedPrices =
    queryClient.getQueryData<TokenUsdPriceData>(tokensUsdPricesQueryKey) ?? null

  const initialTokenIn =
    props.presetTokenSymbol !== undefined
      ? (props.tokenList.find(
          (el) =>
            el.symbol.toLowerCase().normalize() ===
            props.presetTokenSymbol?.toLowerCase().normalize()
        ) ?? props.tokenList[0])
      : props.tokenList[0]

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
            rawPresets: {
              network: props.presetNetwork,
              tokenSymbol: props.presetTokenSymbol,
              recipient: props.presetRecipient,
              amount: props.presetAmount,
              contactId: props.presetContactId,
            },
            cachedPrices,
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
        <WithdrawForm {...props} />
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
