"use client"

import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import type { IntentDescription } from "@src/components/DefuseSDK/features/machines/swapIntentMachine"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { WithdrawStatus } from "@src/components/WithdrawStatus"
import {
  type RegisterWithdrawParams,
  type TrackedWithdrawRef,
  withdrawTrackerMachine,
} from "@src/machines/withdrawTrackerMachine"
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

export type TrackedWithdrawIntent = TrackedWithdrawRef

type WithdrawTrackerMachineContextType = {
  trackedWithdraws: TrackedWithdrawIntent[]
  registerWithdraw: (params: RegisterWithdrawParams) => void
  dismissWithdraw: (id: string) => void
  hasActiveWithdraw: (id: string) => boolean
}

const WithdrawTrackerMachineContext = createContext<
  WithdrawTrackerMachineContextType | undefined
>(undefined)

export function WithdrawTrackerMachineProvider({
  children,
}: { children: ReactNode }) {
  const [actorRef] = useState(() => createActor(withdrawTrackerMachine).start())
  const { addDockItem, removeDockItem } = useActivityDock()

  const trackedWithdraws = useSelector(actorRef, (s) => s.context.withdrawRefs)

  const registerWithdraw = useCallback(
    (params: RegisterWithdrawParams) => {
      if (params.intentDescription.type !== "withdraw") return

      const id = params.intentHash

      actorRef.send({ type: "REGISTER_WITHDRAW", params })

      const withdraw = actorRef
        .getSnapshot()
        .context.withdrawRefs.find((w) => w.id === id)
      if (!withdraw) return

      const withdrawDescription = params.intentDescription as Extract<
        IntentDescription,
        { type: "withdraw" }
      >
      const formattedAmount = formatTokenValue(
        withdrawDescription.amountWithdrawn.amount,
        withdrawDescription.amountWithdrawn.decimals,
        { min: 0.0001, fractionDigits: 4 }
      )

      addDockItem({
        id: `withdraw-${id}`,
        title: `Withdraw ${formattedAmount} ${params.tokenOut.symbol}`,
        icon: (
          <AssetComboIcon
            sizeClassName="size-6"
            {...params.tokenOut}
            chainName={withdrawDescription.tokenOutDeployment.chainName}
          />
        ),
        rawIcon: true,
        keyValueRows: [],
        renderContent: () => (
          <WithdrawStatus variant="dock" withdraw={withdraw} />
        ),
      })
    },
    [actorRef, addDockItem]
  )

  const dismissWithdraw = useCallback(
    (id: string) => {
      actorRef.send({ type: "DISMISS_WITHDRAW", id })
      removeDockItem(`withdraw-${id}`)
    },
    [actorRef, removeDockItem]
  )

  const hasActiveWithdraw = useCallback(
    (id: string) => trackedWithdraws.some((w) => w.id === id),
    [trackedWithdraws]
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
    <WithdrawTrackerMachineContext.Provider value={value}>
      {children}
    </WithdrawTrackerMachineContext.Provider>
  )
}

export function useWithdrawTrackerMachine() {
  const context = useContext(WithdrawTrackerMachineContext)

  if (!context) {
    throw new Error(
      "useWithdrawTrackerMachine must be used within a WithdrawTrackerMachineProvider"
    )
  }

  return context
}

export type { RegisterWithdrawParams } from "@src/machines/withdrawTrackerMachine"
