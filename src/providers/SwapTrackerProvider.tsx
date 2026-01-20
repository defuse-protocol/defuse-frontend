"use client"

import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { intentStatusMachine } from "@src/components/DefuseSDK/features/machines/intentStatusMachine"
import { oneClickStatusMachine } from "@src/components/DefuseSDK/features/machines/oneClickStatusMachine"
import type { IntentDescription } from "@src/components/DefuseSDK/features/machines/swapIntentMachine"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { SwapDockContent } from "@src/components/SwapDockContent"
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import { type ActorRefFrom, type AnyActorRef, createActor } from "xstate"
import { useActivityDock } from "./ActivityDockProvider"

export type TokenValue = { amount: bigint; decimals: number }

export type TrackedSwapIntent = {
  id: string
  intentHash: string
  depositAddress?: string
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  totalAmountIn: TokenValue
  totalAmountOut: TokenValue
  createdAt: Date
  is1cs: boolean
  actorRef:
    | ActorRefFrom<typeof intentStatusMachine>
    | ActorRefFrom<typeof oneClickStatusMachine>
}

export type RegisterSwapParams = {
  intentHash: string
  depositAddress?: string
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  intentDescription: IntentDescription
  is1cs: boolean
  parentRef?: AnyActorRef
}

type SwapTrackerContextType = {
  trackedSwaps: TrackedSwapIntent[]
  registerSwap: (params: RegisterSwapParams) => void
  dismissSwap: (id: string) => void
  getActiveSwaps: () => TrackedSwapIntent[]
  hasActiveSwap: (id: string) => boolean
}

const SwapTrackerContext = createContext<SwapTrackerContextType | undefined>(
  undefined
)

function createNoopParentRef(): AnyActorRef {
  return {
    send: () => {},
    getSnapshot: () => ({}),
  } as unknown as AnyActorRef
}

export function SwapTrackerProvider({ children }: { children: ReactNode }) {
  const [trackedSwaps, setTrackedSwaps] = useState<TrackedSwapIntent[]>([])
  const { addDockItem, removeDockItem } = useActivityDock()

  const registerSwap = useCallback(
    (params: RegisterSwapParams) => {
      const {
        intentHash,
        depositAddress,
        tokenIn,
        tokenOut,
        intentDescription,
        is1cs,
        parentRef,
      } = params

      if (intentDescription.type !== "swap") return

      const id = depositAddress ?? intentHash
      const swapDescription = intentDescription as Extract<
        IntentDescription,
        { type: "swap" }
      >

      const effectiveParentRef = parentRef ?? createNoopParentRef()

      const actorRef =
        is1cs && depositAddress
          ? createActor(oneClickStatusMachine, {
              input: {
                parentRef: effectiveParentRef,
                intentHash,
                depositAddress,
                tokenIn,
                tokenOut,
                totalAmountIn: swapDescription.totalAmountIn,
                totalAmountOut: swapDescription.totalAmountOut,
              },
            })
          : createActor(intentStatusMachine, {
              input: {
                parentRef: effectiveParentRef,
                intentHash,
                tokenIn,
                tokenOut,
                intentDescription,
              },
            })

      actorRef.start()

      const trackedSwap: TrackedSwapIntent = {
        id,
        intentHash,
        depositAddress,
        tokenIn,
        tokenOut,
        totalAmountIn: swapDescription.totalAmountIn,
        totalAmountOut: swapDescription.totalAmountOut,
        createdAt: new Date(),
        is1cs,
        actorRef: actorRef as TrackedSwapIntent["actorRef"],
      }

      setTrackedSwaps((prev) => {
        if (prev.some((s) => s.id === id)) return prev
        return [trackedSwap, ...prev]
      })

      const formattedIn = formatTokenValue(
        swapDescription.totalAmountIn.amount,
        swapDescription.totalAmountIn.decimals,
        { min: 0.0001, fractionDigits: 4 }
      )
      const formattedOut = formatTokenValue(
        swapDescription.totalAmountOut.amount,
        swapDescription.totalAmountOut.decimals,
        { min: 0.0001, fractionDigits: 4 }
      )

      addDockItem({
        id: `swap-${id}`,
        title: `${formattedIn} ${tokenIn.symbol} → ${formattedOut} ${tokenOut.symbol}`,
        icon: (
          <div className="flex items-center -space-x-2">
            <AssetComboIcon sizeClassName="size-6" {...tokenIn} />
            <AssetComboIcon sizeClassName="size-6" {...tokenOut} />
          </div>
        ),
        rawIcon: true,
        keyValueRows: [],
        renderContent: () => <SwapDockContent swap={trackedSwap} />,
      })
    },
    [addDockItem]
  )

  const dismissSwap = useCallback(
    (id: string) => {
      setTrackedSwaps((prev) => {
        const swap = prev.find((s) => s.id === id)
        if (swap) {
          swap.actorRef.stop()
        }
        return prev.filter((s) => s.id !== id)
      })
      removeDockItem(`swap-${id}`)
    },
    [removeDockItem]
  )

  const getActiveSwaps = useCallback(() => {
    return trackedSwaps
  }, [trackedSwaps])

  const hasActiveSwap = useCallback(
    (id: string) => trackedSwaps.some((s) => s.id === id),
    [trackedSwaps]
  )

  const value = useMemo(
    () => ({
      trackedSwaps,
      registerSwap,
      dismissSwap,
      getActiveSwaps,
      hasActiveSwap,
    }),
    [trackedSwaps, registerSwap, dismissSwap, getActiveSwaps, hasActiveSwap]
  )

  return (
    <SwapTrackerContext.Provider value={value}>
      {children}
    </SwapTrackerContext.Provider>
  )
}

export function useSwapTracker() {
  const context = useContext(SwapTrackerContext)

  if (!context) {
    throw new Error("useSwapTracker must be used within a SwapTrackerProvider")
  }

  return context
}
