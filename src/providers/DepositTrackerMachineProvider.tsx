"use client"

import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import type { DepositStage } from "@src/components/DefuseSDK/features/deposit/utils/depositStatusUtils"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { DepositStatus } from "@src/components/DepositStatus"
import {
  type RegisterDepositParams,
  type TrackedDepositRef,
  depositTrackerMachine,
} from "@src/machines/depositTrackerMachine"
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

export type TrackedDeposit = TrackedDepositRef

type DepositTrackerMachineContextType = {
  trackedDeposits: TrackedDeposit[]
  registerDeposit: (params: Omit<RegisterDepositParams, "id">) => string
  updateDepositStage: (id: string, stage: DepositStage, txHash?: string) => void
  dismissDeposit: (id: string) => void
  hasActiveDeposit: (id: string) => boolean
}

const DepositTrackerMachineContext = createContext<
  DepositTrackerMachineContextType | undefined
>(undefined)

export function DepositTrackerMachineProvider({
  children,
}: { children: ReactNode }) {
  const [actorRef] = useState(() => createActor(depositTrackerMachine).start())
  const { addDockItem, removeDockItem, settleDockItem } = useActivityDock()

  const trackedDeposits = useSelector(actorRef, (s) => s.context.deposits)

  const registerDeposit = useCallback(
    (params: Omit<RegisterDepositParams, "id">): string => {
      const id = crypto.randomUUID()

      actorRef.send({ type: "REGISTER_DEPOSIT", params: { ...params, id } })

      const formattedAmount = formatTokenValue(
        params.amount,
        params.tokenDeployment.decimals,
        { min: 0.0001, fractionDigits: 4 }
      )

      addDockItem({
        id: `deposit-${id}`,
        title: `Deposit ${formattedAmount} ${params.token.symbol}`,
        icon: (
          <AssetComboIcon
            sizeClassName="size-6"
            icon={params.token.icon}
            chainName={params.chainName}
          />
        ),
        rawIcon: true,
        keyValueRows: [],
        renderContent: () => <DepositStatus variant="dock" depositId={id} />,
      })

      return id
    },
    [actorRef, addDockItem]
  )

  const updateDepositStage = useCallback(
    (id: string, stage: DepositStage, txHash?: string) => {
      actorRef.send({ type: "UPDATE_STAGE", id, stage, txHash })
      if (stage === "complete" || stage === "error") {
        settleDockItem(`deposit-${id}`)
      }
    },
    [actorRef, settleDockItem]
  )

  const dismissDeposit = useCallback(
    (id: string) => {
      actorRef.send({ type: "DISMISS_DEPOSIT", id })
      removeDockItem(`deposit-${id}`)
    },
    [actorRef, removeDockItem]
  )

  const hasActiveDeposit = useCallback(
    (id: string) => trackedDeposits.some((d) => d.id === id),
    [trackedDeposits]
  )

  const value = useMemo(
    () => ({
      trackedDeposits,
      registerDeposit,
      updateDepositStage,
      dismissDeposit,
      hasActiveDeposit,
    }),
    [
      trackedDeposits,
      registerDeposit,
      updateDepositStage,
      dismissDeposit,
      hasActiveDeposit,
    ]
  )

  return (
    <DepositTrackerMachineContext.Provider value={value}>
      {children}
    </DepositTrackerMachineContext.Provider>
  )
}

export function useDepositTrackerMachine() {
  const context = useContext(DepositTrackerMachineContext)

  if (!context) {
    throw new Error(
      "useDepositTrackerMachine must be used within a DepositTrackerMachineProvider"
    )
  }

  return context
}

export type { DepositStage, RegisterDepositParams }
