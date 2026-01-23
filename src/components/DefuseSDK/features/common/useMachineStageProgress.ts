"use client"

import { useSelector } from "@xstate/react"
import { useEffect, useState } from "react"
import type { AnyActorRef } from "xstate"
import { type StatusActorSnapshot, extractStateValue } from "./statusUtils"

type UseMachineStageProgressParams<TStage extends string> = {
  actorRef: AnyActorRef
  stages: readonly TStage[]
  getStageFromState: (stateValue: string) => TStage
}

type UseMachineStageProgressResult<TStage extends string> = {
  displayStage: TStage
  displayIndex: number
  canRetry: boolean
  txHash: string | null | undefined
  stateValue: string
  /** The raw context.status from the XState machine (used for 1cs swap detection) */
  contextStatus: string | null | undefined
}

/**
 * Hook for tracking XState machine progress with display stage synchronization.
 * Used by SwapStatus and WithdrawStatus to manage progress indicator state.
 *
 * Features:
 * - Extracts state from XState actor
 * - Maps machine state to display stage
 * - Prevents backwards stage transitions (only moves forward)
 * - Returns raw state values so components can compute error/success as needed
 */
export function useMachineStageProgress<TStage extends string>({
  actorRef,
  stages,
  getStageFromState,
}: UseMachineStageProgressParams<TStage>): UseMachineStageProgressResult<TStage> {
  const state = useSelector(
    actorRef,
    (s): StatusActorSnapshot => s as StatusActorSnapshot
  )

  const stateValue = extractStateValue(state.value)
  const machineStage = getStageFromState(stateValue)

  const [displayStage, setDisplayStage] = useState<TStage>(machineStage)

  useEffect(() => {
    const machineIndex = stages.indexOf(machineStage)
    const currentIndex = stages.indexOf(displayStage)

    // Only move forward, never backward
    if (machineIndex > currentIndex) {
      setDisplayStage(machineStage)
    }
  }, [machineStage, displayStage, stages])

  const displayIndex = stages.indexOf(displayStage)
  const canRetry = state.can({ type: "RETRY" })
  const txHash = state.context.txHash
  const contextStatus = state.context.status

  return {
    displayStage,
    displayIndex,
    canRetry,
    txHash,
    stateValue,
    contextStatus,
  }
}
