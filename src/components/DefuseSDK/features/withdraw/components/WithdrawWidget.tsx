"use client"
import { assign, fromPromise } from "xstate"

import { WidgetRoot } from "../../../components/WidgetRoot"
import { settings } from "../../../constants/settings"
import { WithdrawWidgetProvider } from "../../../providers/WithdrawWidgetProvider"
import type { WithdrawWidgetProps } from "../../../types/withdraw"
import { assert } from "../../../utils/assert"
import {
  makeInnerSwapMessage,
  makeSwapMessage,
} from "../../../utils/messageFactory"
import { isBaseToken } from "../../../utils/token"
import { swapIntentMachine } from "../../machines/swapIntentMachine"
import { withdrawUIMachine } from "../../machines/withdrawUIMachine"
import { WithdrawUIMachineContext } from "../WithdrawUIMachineContext"

import { WithdrawForm } from "./WithdrawForm"

export const WithdrawWidget = (props: WithdrawWidgetProps) => {
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

                      const innerMessage = makeInnerSwapMessage({
                        deadlineTimestamp:
                          Date.now() + settings.swapExpirySec * 1000,
                        referral: context.referral,
                        signerId: context.defuseUserId,
                        tokenDeltas: quote?.tokenDeltas ?? [],
                      })

                      innerMessage.intents ??= []
                      innerMessage.intents.push(
                        ...context.intentOperationParams
                          .prebuiltWithdrawalIntents
                      )

                      return {
                        innerMessage,
                        walletMessage: makeSwapMessage({ innerMessage }),
                      }
                    },
                  }),
                },
              }),
            },
          })}
        >
          <WithdrawForm {...props} />
        </WithdrawUIMachineContext.Provider>
      </WithdrawWidgetProvider>
    </WidgetRoot>
  )
}
