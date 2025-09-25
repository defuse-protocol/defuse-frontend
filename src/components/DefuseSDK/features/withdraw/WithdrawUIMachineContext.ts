import { createActorContext } from "@xstate/react"
import type { ReactElement, ReactNode } from "react"
import type { Actor, ActorOptions, SnapshotFrom } from "xstate"
import { withdrawUIMachine } from "../machines/withdrawUIMachine"

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
    selector: (snapshot: SnapshotFrom<typeof withdrawUIMachine>) => T,
    compare?: (a: T, b: T) => boolean
  ) => T
  useActorRef: () => Actor<typeof withdrawUIMachine>
  Provider: (props: {
    children: ReactNode
    options?: ActorOptions<typeof withdrawUIMachine>
    /** @deprecated Use `logic` instead. */
    machine?: never
    logic?: typeof withdrawUIMachine
    // biome-ignore lint/suspicious/noExplicitAny: it is fine `any` here
  }) => ReactElement<any, any>
}

export const WithdrawUIMachineContext: SwapUIMachineContextInterface =
  createActorContext(withdrawUIMachine)
