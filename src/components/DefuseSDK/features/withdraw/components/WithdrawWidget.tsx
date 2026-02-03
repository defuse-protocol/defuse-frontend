"use client"
import { messageFactory } from "@defuse-protocol/internal-utils"
import { base64 } from "@scure/base"
import { bridgeSDK } from "@src/components/DefuseSDK/constants/bridgeSdk"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
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
import { isBaseToken } from "../../../utils/token"
import {
  findTokenInListByBase,
  parseTokenFromUrl,
} from "../../../utils/tokenUrlSymbol"
import { swapIntentMachine } from "../../machines/swapIntentMachine"
import { withdrawUIMachine } from "../../machines/withdrawUIMachine"
import { WithdrawUIMachineContext } from "../WithdrawUIMachineContext"
import { useWithdrawFormChangeNotifier } from "../hooks/useWithdrawFormChangeNotifier"
import { WithdrawForm } from "./WithdrawForm"

export const WithdrawWidget = (props: WithdrawWidgetProps) => {
  const is1cs = useIs1CsEnabled()
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)
  const appFeeRecipient = getAppFeeRecipient(whitelabelTemplate)
  const initialTokenIn = (() => {
    const preset = props.presetTokenSymbol?.trim()
    if (preset === undefined || preset === "") return props.tokenList[0]

    if (preset.includes(":")) {
      const baseFromUrl = parseTokenFromUrl(preset)
      const found = baseFromUrl
        ? findTokenInListByBase(baseFromUrl, props.tokenList)
        : null
      return found ?? props.tokenList[0]
    }

    return (
      props.tokenList.find(
        (el) =>
          el.symbol.toLowerCase().normalize() ===
          preset.toLowerCase().normalize()
      ) ?? props.tokenList[0]
    )
  })()

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
        <FormChangeNotifier
          onFormChange={props.onFormChange}
          presetValues={props.presetValuesForSync}
          tokenList={props.tokenList}
        />
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

function FormChangeNotifier({
  onFormChange,
  presetValues,
  tokenList,
}: {
  onFormChange?: WithdrawWidgetProps["onFormChange"]
  presetValues?: WithdrawWidgetProps["presetValuesForSync"]
  tokenList: TokenInfo[]
}) {
  useWithdrawFormChangeNotifier({ onFormChange, presetValues, tokenList })
  return null
}
