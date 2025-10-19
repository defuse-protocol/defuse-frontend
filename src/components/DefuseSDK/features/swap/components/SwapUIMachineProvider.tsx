import type { walletMessage } from "@defuse-protocol/internal-utils"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { assert } from "@src/components/DefuseSDK/utils/assert"
import { computeTotalDeltaDifferentDecimals } from "@src/components/DefuseSDK/utils/tokenUtils"
import { useIs1CsEnabled } from "@src/hooks/useIs1CsEnabled"
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
import { swapIntent1csMachine } from "../../machines/swapIntent1csMachine"
import { swapIntentMachine } from "../../machines/swapIntentMachine"
import { swapUIMachine } from "../../machines/swapUIMachine"
import { useSwapTokenChangeNotifier } from "../hooks/useTokenChangeNotifier"
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
  initialTokenIn?: TokenInfo
  initialTokenOut?: TokenInfo
  tokenList: TokenInfo[]
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
  const { setValue } = useFormContext<SwapFormValues>()
  const tokenIn = initialTokenIn || tokenList[0]
  const tokenOut = initialTokenOut || tokenList[1]
  const is1cs = useIs1CsEnabled()
  assert(tokenIn && tokenOut, "TokenIn and TokenOut must be defined")

  return (
    <SwapUIMachineContext.Provider
      // re-initialize the provider when the is1cs prop changes
      key={is1cs ? "1cs" : "not1cs"}
      options={{
        input: {
          tokenIn,
          tokenOut,
          tokenList,
          referral,
          is1cs,
        },
      }}
      logic={swapUIMachine.provide({
        actions: {
          updateUIAmount: ({ context }) => {
            const quote = context.quote
            if (quote == null) return
            const totalAmountOutUpdated = context.formValues.amountIn === ""
            const fieldNameToUpdate = totalAmountOutUpdated
              ? "amountIn"
              : "amountOut"
            if (quote.tag === "err") {
              setValue(fieldNameToUpdate, "–", {
                shouldValidate: false,
              })
            } else {
              const totalAmount = computeTotalDeltaDifferentDecimals(
                [
                  totalAmountOutUpdated
                    ? context.parsedFormValues.tokenIn
                    : context.parsedFormValues.tokenOut,
                ],
                quote.value.tokenDeltas
              )
              setValue(
                fieldNameToUpdate,
                formatUnits(
                  totalAmount.amount < 0n
                    ? -totalAmount.amount
                    : totalAmount.amount,
                  totalAmount.decimals
                ),
                {
                  shouldValidate: true,
                }
              )
            }
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
      <TokenChangeNotifier tokenIn={tokenIn} tokenOut={tokenOut} />
      {children}
    </SwapUIMachineContext.Provider>
  )
}

function TokenChangeNotifier({
  tokenIn,
  tokenOut,
}: {
  tokenIn: TokenInfo
  tokenOut: TokenInfo
}) {
  useSwapTokenChangeNotifier({ tokenIn, tokenOut })
  return null
}
