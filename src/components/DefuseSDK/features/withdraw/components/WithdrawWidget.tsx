"use client"
import { messageFactory } from "@defuse-protocol/internal-utils"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { useIs1CsEnabled } from "@src/hooks/useIs1CsEnabled"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import { getAppFeeRecipient } from "@src/utils/getAppFeeRecipient"
import { useSelector } from "@xstate/react"
import { useContext } from "react"
import { assign, fromPromise } from "xstate"
import {
  TokenListUpdater,
  TokenListUpdater1cs,
} from "../../../components/TokenListUpdater"
import { settings } from "../../../constants/settings"
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
              },
              actions: {
                assembleSignMessages: assign({
                  messageToSign: ({ context }) => {
                    assert(
                      context.intentOperationParams.type === "withdraw",
                      "Type must be withdraw"
                    )

                    const { quote } = context.intentOperationParams

                    const innerMessage = messageFactory.makeInnerSwapMessage({
                      deadlineTimestamp:
                        Date.now() + settings.swapExpirySec * 1000,
                      referral: context.referral,
                      signerId: context.defuseUserId,
                      tokenDeltas: quote?.tokenDeltas ?? [],
                      appFee: quote?.appFee ?? [],
                      appFeeRecipient: context.appFeeRecipient,
                    })

                    innerMessage.intents ??= []
                    innerMessage.intents.push(
                      ...context.intentOperationParams.prebuiltWithdrawalIntents
                    )

                    return {
                      innerMessage,
                      walletMessage: messageFactory.makeSwapMessage({
                        innerMessage,
                      }),
                    }
                  },
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
