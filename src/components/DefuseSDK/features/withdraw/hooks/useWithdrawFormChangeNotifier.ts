import { useSelector } from "@xstate/react"
import { useEffect, useRef } from "react"
import { WithdrawUIMachineContext } from "../WithdrawUIMachineContext"

type OnFormChangeParams = {
  token: string | null
  network: string
  recipient: string
  recipientChanged: boolean
  networkChanged: boolean
}

type PresetValues = {
  network: string | undefined
  recipient: string | undefined
}

export function useWithdrawFormChangeNotifier({
  onFormChange,
  presetValues,
}: {
  onFormChange?: (params: OnFormChangeParams) => void
  presetValues?: PresetValues
}) {
  const withdrawUIActorRef = WithdrawUIMachineContext.useActorRef()
  const withdrawFormRef = useSelector(
    withdrawUIActorRef,
    (state) => state.context.withdrawFormRef
  )

  const { tokenSymbol, blockchain, recipient } = useSelector(
    withdrawFormRef,
    (state) => ({
      tokenSymbol: state.context.tokenIn?.symbol ?? null,
      blockchain: state.context.blockchain,
      recipient: state.context.recipient,
    })
  )

  const prevValuesRef = useRef({ tokenSymbol, blockchain, recipient })
  const hasReachedPresetRef = useRef(false)

  useEffect(() => {
    if (!onFormChange) return

    const prev = prevValuesRef.current

    if (!hasReachedPresetRef.current) {
      const networkMatchesPreset =
        !presetValues?.network || blockchain === presetValues.network
      const recipientMatchesPreset =
        !presetValues?.recipient || recipient === presetValues.recipient

      if (networkMatchesPreset && recipientMatchesPreset) {
        hasReachedPresetRef.current = true
      }

      prevValuesRef.current = { tokenSymbol, blockchain, recipient }
      return
    }

    const tokenChanged = tokenSymbol !== prev.tokenSymbol
    const networkChanged = blockchain !== prev.blockchain
    const recipientChanged =
      recipient !== prev.recipient && recipient !== "" && prev.recipient !== ""

    if (tokenChanged || networkChanged || recipientChanged) {
      onFormChange({
        token: tokenSymbol,
        network: blockchain,
        recipient,
        recipientChanged,
        networkChanged,
      })
      prevValuesRef.current = { tokenSymbol, blockchain, recipient }
    }
  }, [tokenSymbol, blockchain, recipient, onFormChange, presetValues])
}
