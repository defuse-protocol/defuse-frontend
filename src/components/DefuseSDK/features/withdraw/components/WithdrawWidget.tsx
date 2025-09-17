"use client"
import { messageFactory } from "@defuse-protocol/internal-utils"
import { useSelector } from "@xstate/react"
import { useCallback } from "react"
import { assign, fromPromise } from "xstate"
import {
  TokenListUpdater,
  TokenListUpdater1cs,
} from "../../../components/TokenListUpdater"
import { WidgetRoot } from "../../../components/WidgetRoot"
import { settings } from "../../../constants/settings"
import { WithdrawWidgetProvider } from "../../../providers/WithdrawWidgetProvider"
import type {} from "../../../types/base"
import type { WithdrawWidgetProps } from "../../../types/withdraw"
import { assert } from "../../../utils/assert"
import { isBaseToken } from "../../../utils/token"
import { swapIntentMachine } from "../../machines/swapIntentMachine"
import { withdrawUIMachine } from "../../machines/withdrawUIMachine"
import { WithdrawUIMachineContext } from "../WithdrawUIMachineContext"

import type { TokenWithTags } from "@src/constants/tokens"
import { useIs1CsEnabled } from "@src/hooks/useIs1CsEnabled"
import { APP_FEE_RECIPIENT } from "@src/utils/environment"
import { WithdrawForm } from "./WithdrawForm"

export const WithdrawWidget = (props: WithdrawWidgetProps) => {
  const is1cs = useIs1CsEnabled()
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
    <WidgetRoot>
      <WithdrawWidgetProvider>
        <WithdrawUIMachineContext.Provider
          options={{
            input: {
              tokenIn: initialTokenIn,
              tokenOut: initialTokenOut,
              tokenList: props.tokenList,
              referral: props.referral,
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
                        appFeeRecipient: APP_FEE_RECIPIENT,
                      })

                      innerMessage.intents ??= []
                      innerMessage.intents.push(
                        ...context.intentOperationParams
                          .prebuiltWithdrawalIntents
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
    </WidgetRoot>
  )
}

function TokenListUpdaterWithdraw({
  tokenList,
}: { tokenList: TokenWithTags[] }) {
  const withdrawUIActorRef = WithdrawUIMachineContext.useActorRef()
  const { tokenOut } = withdrawUIActorRef
    .getSnapshot()
    .context.withdrawFormRef.getSnapshot().context
  const depositedBalanceRef = useSelector(
    withdrawUIActorRef,
    (state) => state.context.depositedBalanceRef
  )
  const sendTokenUpdate = useCallback(
    ({ tokenOut: token }: { tokenOut?: TokenWithTags }) => {
      if (token) {
        withdrawUIActorRef.send({
          type: "WITHDRAW_FORM.UPDATE_TOKEN",
          params: { token, parsedAmount: null },
        })
      }
    },
    [withdrawUIActorRef]
  )

  return (
    <TokenListUpdater1cs
      tokenList={tokenList}
      depositedBalanceRef={depositedBalanceRef}
      tokenIn={tokenOut}
      tokenOut={tokenOut}
      sendTokenInOrOut={sendTokenUpdate}
    />
  )
}
