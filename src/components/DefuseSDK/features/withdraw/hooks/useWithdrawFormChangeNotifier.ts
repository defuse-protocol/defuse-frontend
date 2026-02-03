import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { getTokenUrlSymbol } from "@src/components/DefuseSDK/utils/tokenUrlSymbol"
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
  tokenList,
}: {
  onFormChange?: (params: OnFormChangeParams) => void
  presetValues?: PresetValues
  tokenList: TokenInfo[]
}) {
  const withdrawUIActorRef = WithdrawUIMachineContext.useActorRef()
  const withdrawFormRef = useSelector(
    withdrawUIActorRef,
    (state) => state.context.withdrawFormRef
  )

  const { tokenIn, blockchain, recipient } = useSelector(
    withdrawFormRef,
    (state) => ({
      tokenIn: state.context.tokenIn,
      blockchain: state.context.blockchain,
      recipient: state.context.recipient,
    })
  )

  const tokenUrlSymbol =
    tokenIn != null ? getTokenUrlSymbol(tokenIn, tokenList) : null

  const prevValuesRef = useRef({
    tokenUrlSymbol,
    blockchain,
    recipient,
  })
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

      prevValuesRef.current = { tokenUrlSymbol, blockchain, recipient }
      return
    }

    const tokenChanged = tokenUrlSymbol !== prev.tokenUrlSymbol
    const networkChanged = blockchain !== prev.blockchain
    const recipientChanged =
      recipient !== prev.recipient && recipient !== "" && prev.recipient !== ""

    if (tokenChanged || networkChanged || recipientChanged) {
      onFormChange({
        token: tokenUrlSymbol,
        network: blockchain,
        recipient,
        recipientChanged,
        networkChanged,
      })
      prevValuesRef.current = { tokenUrlSymbol, blockchain, recipient }
    }
  }, [tokenUrlSymbol, blockchain, recipient, onFormChange, presetValues])
}
