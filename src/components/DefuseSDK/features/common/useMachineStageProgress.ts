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
  contextStatus: string | null | undefined
}

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
    const isAtTerminal = currentIndex === stages.length - 1

    if (
      machineIndex > currentIndex ||
      (isAtTerminal && machineIndex < currentIndex)
    ) {
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
