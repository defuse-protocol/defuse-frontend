"use client"

import type { walletMessage } from "@defuse-protocol/internal-utils"
import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { swapIntent1csMachine } from "@src/components/DefuseSDK/features/machines/swapIntent1csMachine"
import { swapIntentMachine } from "@src/components/DefuseSDK/features/machines/swapIntentMachine"
import { swapUIMachine } from "@src/components/DefuseSDK/features/machines/swapUIMachine"
import { SwapUIMachineContext } from "@src/components/DefuseSDK/features/swap/components/SwapUIMachineProvider"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { assert } from "@src/components/DefuseSDK/utils/assert"
import { useIs1CsEnabled } from "@src/hooks/useIs1CsEnabled"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import { useSlippageStore } from "@src/stores/useSlippageStore"
import { getAppFeeRecipient } from "@src/utils/getAppFeeRecipient"
import { useEffect } from "react"
import type { PropsWithChildren } from "react"
import { useContext } from "react"
import { FormProvider, useForm, useFormContext } from "react-hook-form"
import { fromPromise } from "xstate"

export type EarnFormValues = {
  amountIn: string
  amountOut: string
}

// Re-export SwapUIMachineContext for use in Earn components
// This ensures ModalReviewSwap and other shared components work correctly
export { SwapUIMachineContext as EarnUIMachineContext }

interface EarnUIMachineProviderProps extends PropsWithChildren {
  mode: "deposit" | "withdraw"
  tokenList: TokenInfo[]
  smUsdcToken: TokenInfo
  signMessage: (
    params: walletMessage.WalletMessage
  ) => Promise<walletMessage.WalletSignatureResult | null>
  referral?: string
  onSuccess?: () => void
}

export function EarnUIMachineProvider({
  children,
  mode,
  tokenList,
  smUsdcToken,
  signMessage,
  referral,
}: EarnUIMachineProviderProps) {
  const { setValue } = useFormContext<EarnFormValues>()
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)
  const appFeeRecipient = getAppFeeRecipient(whitelabelTemplate)
  const is1cs = useIs1CsEnabled()

  // For deposits: user sells a token -> gets smUSDC (tokenOut = smUSDC)
  // For withdrawals: user sells smUSDC -> gets a token (tokenIn = smUsdcToken)
  // Filter out earn-only tokens - can't use them as tokenIn for deposits or tokenOut for withdrawals
  const selectableTokens = tokenList.filter(
    (token) => !token.tags?.includes("category:earn-only")
  )
  const defaultSelectableToken = selectableTokens[0]
  assert(
    defaultSelectableToken,
    "Token list must have at least one non-earn-only token"
  )

  const tokenIn = mode === "deposit" ? defaultSelectableToken : smUsdcToken
  const tokenOut = mode === "deposit" ? smUsdcToken : defaultSelectableToken

  return (
    <SwapUIMachineContext.Provider
      key={is1cs ? "1cs" : "not1cs"}
      options={{
        input: {
          tokenIn,
          tokenOut,
          tokenList,
          referral,
          is1cs,
          appFeeRecipient,
        },
      }}
      logic={swapUIMachine.provide({
        actions: {
          updateUIAmount: ({ context }) => {
            const quote = context.quote
            const isExactInput =
              context.formValues.swapType === QuoteRequest.swapType.EXACT_INPUT
            const fieldNameToUpdate = isExactInput ? "amountOut" : "amountIn"
            if (quote === null || quote.tag === "err") {
              setValue(
                fieldNameToUpdate,
                context.formValues[fieldNameToUpdate],
                { shouldValidate: false }
              )
              return
            }
            if (
              context.formValues.amountIn === "" &&
              context.formValues.amountOut === ""
            )
              return
            setValue(fieldNameToUpdate, context.formValues[fieldNameToUpdate], {
              shouldValidate: true,
            })
          },
        },
        actors: {
          swapActor: swapIntentMachine.provide({
            actors: {
              signMessage: fromPromise(({ input }) => signMessage(input)),
            },
          }),
          swap1csActor: swapIntent1csMachine.provide({
            actors: {
              signMessage: fromPromise(({ input }) => signMessage(input)),
            },
          }),
        },
      })}
    >
      <SlippageInitializer />
      {children}
    </SwapUIMachineContext.Provider>
  )
}

function SlippageInitializer() {
  const actorRef = SwapUIMachineContext.useActorRef()
  const getSlippageBasisPoints = useSlippageStore(
    (state) => state.getSlippageBasisPoints
  )
  const currentSlippage = SwapUIMachineContext.useSelector(
    (state) => state.context.slippageBasisPoints
  )

  useEffect(() => {
    const storedSlippage = getSlippageBasisPoints()
    if (storedSlippage !== currentSlippage) {
      actorRef.send({
        type: "SET_SLIPPAGE",
        params: { slippageBasisPoints: storedSlippage },
      })
    }
  }, [actorRef, getSlippageBasisPoints, currentSlippage])

  return null
}

export function EarnFormProvider({ children }: PropsWithChildren) {
  const methods = useForm<EarnFormValues>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      amountIn: "",
      amountOut: "",
    },
  })

  return <FormProvider {...methods}>{children}</FormProvider>
}
