"use client"

import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import type { IntentDescription } from "@src/components/DefuseSDK/features/machines/swapIntentMachine"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { SwapStatus } from "@src/components/SwapStatus"
import {
  type RegisterSwapParams,
  type TrackedSwapRef,
  swapTrackerMachine,
} from "@src/machines/swapTrackerMachine"
import { useSelector } from "@xstate/react"
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import { createActor } from "xstate"
import { useActivityDock } from "./ActivityDockProvider"

export type TrackedSwapIntent = TrackedSwapRef

type SwapTrackerMachineContextType = {
  trackedSwaps: TrackedSwapIntent[]
  registerSwap: (params: RegisterSwapParams) => void
  dismissSwap: (id: string) => void
  hasActiveSwap: (id: string) => boolean
}

const SwapTrackerMachineContext = createContext<
  SwapTrackerMachineContextType | undefined
>(undefined)

export function SwapTrackerMachineProvider({
  children,
}: { children: ReactNode }) {
  const [actorRef] = useState(() => createActor(swapTrackerMachine).start())
  const { addDockItem, removeDockItem } = useActivityDock()

  const trackedSwaps = useSelector(actorRef, (s) => s.context.swapRefs)

  const registerSwap = useCallback(
    (params: RegisterSwapParams) => {
      if (params.intentDescription.type !== "swap") return

      const id = params.depositAddress ?? params.intentHash
      const swapDescription = params.intentDescription as Extract<
        IntentDescription,
        { type: "swap" }
      >

      actorRef.send({ type: "REGISTER_SWAP", params })

      const swap = actorRef
        .getSnapshot()
        .context.swapRefs.find((s) => s.id === id)
      if (!swap) return

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
        title: `${formattedIn} ${params.tokenIn.symbol} → ${formattedOut} ${params.tokenOut.symbol}`,
        icon: (
          <div className="flex items-center -space-x-2">
            <AssetComboIcon sizeClassName="size-6" {...params.tokenIn} />
            <AssetComboIcon sizeClassName="size-6" {...params.tokenOut} />
          </div>
        ),
        rawIcon: true,
        keyValueRows: [],
        renderContent: () => <SwapStatus variant="dock" swap={swap} />,
      })
    },
    [actorRef, addDockItem]
  )

  const dismissSwap = useCallback(
    (id: string) => {
      actorRef.send({ type: "DISMISS_SWAP", id })
      removeDockItem(`swap-${id}`)
    },
    [actorRef, removeDockItem]
  )

  const hasActiveSwap = useCallback(
    (id: string) => trackedSwaps.some((s) => s.id === id),
    [trackedSwaps]
  )

  const value = useMemo(
    () => ({
      trackedSwaps,
      registerSwap,
      dismissSwap,
      hasActiveSwap,
    }),
    [trackedSwaps, registerSwap, dismissSwap, hasActiveSwap]
  )

  return (
    <SwapTrackerMachineContext.Provider value={value}>
      {children}
    </SwapTrackerMachineContext.Provider>
  )
}

export function useSwapTrackerMachine() {
  const context = useContext(SwapTrackerMachineContext)

  if (!context) {
    throw new Error(
      "useSwapTrackerMachine must be used within a SwapTrackerMachineProvider"
    )
  }

  return context
}

export type { RegisterSwapParams } from "@src/machines/swapTrackerMachine"
