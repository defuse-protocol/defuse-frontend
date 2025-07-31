import type { walletMessage } from "@defuse-protocol/internal-utils"
import { assert } from "@src/components/DefuseSDK/utils/assert"
import { createActorContext } from "@xstate/react"
import type { PropsWithChildren, ReactElement, ReactNode } from "react"
import { useFormContext } from "react-hook-form"
import { formatUnits } from "viem"
import {
  type Actor,
  type ActorOptions,
  type SnapshotFrom,
  fromPromise,
} from "xstate"
import type { SwappableToken } from "../../../types/swap"
import { computeTotalDeltaDifferentDecimals } from "../../../utils/tokenUtils"
import { swapIntentMachine } from "../../machines/swapIntentMachine"
import { swapUIMachine } from "../../machines/swapUIMachine1Click"
import type { SwapFormValues } from "./SwapForm"

/**
 * We explicitly define the type of `swapUIMachine` to avoid:
 * ```
 * TS7056: The inferred type of this node exceeds the maximum length the
 * compiler will serialize. An explicit type annotation is needed.
 * ```
 *
 * Either the machine type is too complex or we incorrectly specify types inside it.
 * Either way it is just a workaround for TypeScript limitations.
 * Copy-paste the type from `@xstate/react/dist/declarations/src/createActorContext.d.ts`
 */
interface SwapUIMachineContextInterface {
  useSelector: <T>(
    selector: (snapshot: SnapshotFrom<typeof swapUIMachine>) => T,
    compare?: (a: T, b: T) => boolean
  ) => T
  useActorRef: () => Actor<typeof swapUIMachine>
  Provider: (props: {
    children: ReactNode
    options?: ActorOptions<typeof swapUIMachine>
    /** @deprecated Use `logic` instead. */
    machine?: never
    logic?: typeof swapUIMachine
    // biome-ignore lint/suspicious/noExplicitAny: it is fine `any` here
  }) => ReactElement<any, any>
}

export const SwapUIMachineContext: SwapUIMachineContextInterface =
  createActorContext(swapUIMachine)

interface SwapUIMachineProviderProps extends PropsWithChildren {
  initialTokenIn?: SwappableToken
  initialTokenOut?: SwappableToken
  tokenList: SwappableToken[]
  signMessage: (
    params: walletMessage.WalletMessage
  ) => Promise<walletMessage.WalletSignatureResult | null>
  referral?: string
}

export function SwapUIMachineProvider({
  children,
  initialTokenIn,
  initialTokenOut,
  tokenList,
  signMessage,
  referral,
}: SwapUIMachineProviderProps) {
  const { setValue, resetField } = useFormContext<SwapFormValues>()
  const tokenIn = initialTokenIn || tokenList[0]
  const tokenOut = initialTokenOut || tokenList[1]
  assert(tokenIn && tokenOut, "TokenIn and TokenOut must be defined")

  return (
    <SwapUIMachineContext.Provider
      options={{
        input: {
          tokenIn,
          tokenOut,
          tokenList,
          referral,
        },
      }}
      logic={swapUIMachine.provide({
        actions: {
          updateUIAmountOut: ({ context }) => {
            const quote = context.quote
            if (quote == null) {
              resetField("amountOut")
            } else if (quote.tag === "err") {
              setValue("amountOut", "–", {
                shouldValidate: false,
              })
            } else {
              const totalAmountOut = computeTotalDeltaDifferentDecimals(
                [context.parsedFormValues.tokenOut],
                quote.value.tokenDeltas
              )
              const amountOutFormatted = formatUnits(
                totalAmountOut.amount,
                totalAmountOut.decimals
              )
              setValue("amountOut", amountOutFormatted, {
                shouldValidate: true,
              })
            }
          },
        },
        actors: {
          swapActor: swapIntentMachine.provide({
            actors: {
              signMessage: fromPromise(({ input }) => signMessage(input)),
            },
          }),
        },
      })}
    >
      {children}
    </SwapUIMachineContext.Provider>
  )
}
