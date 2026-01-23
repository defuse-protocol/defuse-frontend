"use client"

import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import type { DepositStage } from "@src/components/DefuseSDK/features/deposit/utils/depositStatusUtils"
import type {
  BaseTokenInfo,
  SupportedChainName,
  TokenDeployment,
} from "@src/components/DefuseSDK/types/base"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { DepositStatus } from "@src/components/DepositStatus"
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
import { useActivityDock } from "./ActivityDockProvider"

export type { DepositStage }

export type TrackedDeposit = {
  id: string
  token: BaseTokenInfo
  tokenDeployment: TokenDeployment
  amount: bigint
  chainName: SupportedChainName
  userAddress: string
  stage: DepositStage
  txHash?: string
  createdAt: Date
}

export type RegisterDepositParams = {
  token: BaseTokenInfo
  tokenDeployment: TokenDeployment
  amount: bigint
  chainName: SupportedChainName
  userAddress: string
}

type DepositTrackerContextType = {
  trackedDeposits: TrackedDeposit[]
  registerDeposit: (params: RegisterDepositParams) => string
  updateDepositStage: (id: string, stage: DepositStage, txHash?: string) => void
  dismissDeposit: (id: string) => void
  hasActiveDeposit: (id: string) => boolean
  getDepositById: (id: string) => TrackedDeposit | undefined
}

const DepositTrackerContext = createContext<
  DepositTrackerContextType | undefined
>(undefined)

export function DepositTrackerProvider({ children }: { children: ReactNode }) {
  const [trackedDeposits, setTrackedDeposits] = useState<TrackedDeposit[]>([])
  const { addDockItem, removeDockItem } = useActivityDock()
  const depositIdCounterRef = useRef(0)
  const trackedIdsRef = useRef<Set<string>>(new Set())

  // Keep trackedIdsRef in sync with state for stable hasActiveDeposit callback
  useEffect(() => {
    trackedIdsRef.current = new Set(trackedDeposits.map((d) => d.id))
  }, [trackedDeposits])

  const registerDeposit = useCallback(
    (params: RegisterDepositParams): string => {
      const { token, tokenDeployment, amount, chainName, userAddress } = params

      const id = `deposit-${Date.now()}-${++depositIdCounterRef.current}`

      const trackedDeposit: TrackedDeposit = {
        id,
        token,
        tokenDeployment,
        amount,
        chainName,
        userAddress,
        stage: "submitting",
        createdAt: new Date(),
      }

      setTrackedDeposits((prev) => [trackedDeposit, ...prev])

      const formattedAmount = formatTokenValue(
        amount,
        tokenDeployment.decimals,
        {
          min: 0.0001,
          fractionDigits: 4,
        }
      )

      addDockItem({
        id: `deposit-${id}`,
        title: `Deposit ${formattedAmount} ${token.symbol}`,
        icon: (
          <AssetComboIcon
            sizeClassName="size-6"
            icon={token.icon}
            chainName={chainName}
          />
        ),
        rawIcon: true,
        keyValueRows: [],
        renderContent: () => <DepositStatus variant="dock" depositId={id} />,
      })

      return id
    },
    [addDockItem]
  )

  const updateDepositStage = useCallback(
    (id: string, stage: DepositStage, txHash?: string) => {
      setTrackedDeposits((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, stage, txHash: txHash ?? d.txHash } : d
        )
      )
    },
    []
  )

  const dismissDeposit = useCallback(
    (id: string) => {
      setTrackedDeposits((prev) => prev.filter((d) => d.id !== id))
      removeDockItem(`deposit-${id}`)
    },
    [removeDockItem]
  )

  const hasActiveDeposit = useCallback(
    (id: string) => trackedIdsRef.current.has(id),
    []
  )

  const getDepositById = useCallback(
    (id: string) => trackedDeposits.find((d) => d.id === id),
    [trackedDeposits]
  )

  const value = useMemo(
    () => ({
      trackedDeposits,
      registerDeposit,
      updateDepositStage,
      dismissDeposit,
      hasActiveDeposit,
      getDepositById,
    }),
    [
      trackedDeposits,
      registerDeposit,
      updateDepositStage,
      dismissDeposit,
      hasActiveDeposit,
      getDepositById,
    ]
  )

  return (
    <DepositTrackerContext.Provider value={value}>
      {children}
    </DepositTrackerContext.Provider>
  )
}

export function useDepositTracker() {
  const context = useContext(DepositTrackerContext)

  if (!context) {
    throw new Error(
      "useDepositTracker must be used within a DepositTrackerProvider"
    )
  }

  return context
}
