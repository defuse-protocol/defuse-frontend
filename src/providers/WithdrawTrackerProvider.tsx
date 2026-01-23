"use client"

import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { createNoopParentRef } from "@src/components/DefuseSDK/features/common/actorUtils"
import { intentStatusMachine } from "@src/components/DefuseSDK/features/machines/intentStatusMachine"
import type { IntentDescription } from "@src/components/DefuseSDK/features/machines/swapIntentMachine"
import type {
  BaseTokenInfo,
  TokenInfo,
} from "@src/components/DefuseSDK/types/base"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { WithdrawStatus } from "@src/components/WithdrawStatus"
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { type ActorRefFrom, type AnyActorRef, createActor } from "xstate"
import { useActivityDock } from "./ActivityDockProvider"

export type TokenValue = { amount: bigint; decimals: number }

export type TrackedWithdrawIntent = {
  id: string
  intentHash: string
  tokenIn: TokenInfo
  tokenOut: BaseTokenInfo
  amountIn: TokenValue
  amountOut: TokenValue
  recipient: string
  createdAt: Date
  actorRef: ActorRefFrom<typeof intentStatusMachine>
}

export type RegisterWithdrawParams = {
  intentHash: string
  tokenIn: TokenInfo
  tokenOut: BaseTokenInfo
  intentDescription: IntentDescription
  parentRef?: AnyActorRef
}

type WithdrawTrackerContextType = {
  trackedWithdraws: TrackedWithdrawIntent[]
  registerWithdraw: (params: RegisterWithdrawParams) => void
  dismissWithdraw: (id: string) => void
  hasActiveWithdraw: (id: string) => boolean
}

const WithdrawTrackerContext = createContext<
  WithdrawTrackerContextType | undefined
>(undefined)

export function WithdrawTrackerProvider({ children }: { children: ReactNode }) {
  const [trackedWithdraws, setTrackedWithdraws] = useState<
    TrackedWithdrawIntent[]
  >([])
  const { addDockItem, removeDockItem } = useActivityDock()
  const actorRefsRef = useRef<Map<string, TrackedWithdrawIntent["actorRef"]>>(
    new Map()
  )
  const trackedIdsRef = useRef<Set<string>>(new Set())

  // Keep trackedIdsRef in sync with state for stable hasActiveWithdraw callback
  useEffect(() => {
    trackedIdsRef.current = new Set(trackedWithdraws.map((w) => w.id))
  }, [trackedWithdraws])

  // Cleanup: stop all actors when provider unmounts
  useEffect(() => {
    const actorRefs = actorRefsRef.current
    return () => {
      for (const actorRef of actorRefs.values()) {
        actorRef.stop()
      }
      actorRefs.clear()
    }
  }, [])

  const registerWithdraw = useCallback(
    (params: RegisterWithdrawParams) => {
      const { intentHash, tokenIn, tokenOut, intentDescription, parentRef } =
        params

      if (intentDescription.type !== "withdraw") return

      const id = intentHash
      const withdrawDescription = intentDescription as Extract<
        IntentDescription,
        { type: "withdraw" }
      >

      const effectiveParentRef = parentRef ?? createNoopParentRef()

      const actorRef = createActor(intentStatusMachine, {
        input: {
          parentRef: effectiveParentRef,
          intentHash,
          tokenIn,
          tokenOut,
          intentDescription,
        },
      })

      actorRef.start()
      actorRefsRef.current.set(id, actorRef)

      const trackedWithdraw: TrackedWithdrawIntent = {
        id,
        intentHash,
        tokenIn,
        tokenOut,
        amountIn: {
          amount: withdrawDescription.amountWithdrawn.amount,
          decimals: withdrawDescription.amountWithdrawn.decimals,
        },
        amountOut: withdrawDescription.amountWithdrawn,
        recipient: withdrawDescription.recipient,
        createdAt: new Date(),
        actorRef,
      }

      setTrackedWithdraws((prev) => {
        if (prev.some((w) => w.id === id)) return prev
        return [trackedWithdraw, ...prev]
      })

      const formattedAmount = formatTokenValue(
        withdrawDescription.amountWithdrawn.amount,
        withdrawDescription.amountWithdrawn.decimals,
        { min: 0.0001, fractionDigits: 4 }
      )

      addDockItem({
        id: `withdraw-${id}`,
        title: `Withdraw ${formattedAmount} ${tokenOut.symbol}`,
        icon: (
          <AssetComboIcon
            sizeClassName="size-6"
            {...tokenOut}
            chainName={withdrawDescription.tokenOutDeployment.chainName}
          />
        ),
        rawIcon: true,
        keyValueRows: [],
        renderContent: () => (
          <WithdrawStatus variant="dock" withdraw={trackedWithdraw} />
        ),
      })
    },
    [addDockItem]
  )

  const dismissWithdraw = useCallback(
    (id: string) => {
      // Stop actor outside of setState to avoid side effects in updater
      const actorRef = actorRefsRef.current.get(id)
      if (actorRef) {
        actorRef.stop()
        actorRefsRef.current.delete(id)
      }

      setTrackedWithdraws((prev) => prev.filter((w) => w.id !== id))
      removeDockItem(`withdraw-${id}`)
    },
    [removeDockItem]
  )

  const hasActiveWithdraw = useCallback(
    (id: string) => trackedIdsRef.current.has(id),
    []
  )

  const value = useMemo(
    () => ({
      trackedWithdraws,
      registerWithdraw,
      dismissWithdraw,
      hasActiveWithdraw,
    }),
    [trackedWithdraws, registerWithdraw, dismissWithdraw, hasActiveWithdraw]
  )

  return (
    <WithdrawTrackerContext.Provider value={value}>
      {children}
    </WithdrawTrackerContext.Provider>
  )
}

export function useWithdrawTracker() {
  const context = useContext(WithdrawTrackerContext)

  if (!context) {
    throw new Error(
      "useWithdrawTracker must be used within a WithdrawTrackerProvider"
    )
  }

  return context
}
