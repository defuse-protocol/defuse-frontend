import { useSelector } from "@xstate/react"
import { useEffect, useRef } from "react"
import { WithdrawUIMachineContext } from "../WithdrawUIMachineContext"

type OnFormChangeParams = {
  token: string | null
  network: string
  recipientChanged: boolean
}

export function useWithdrawFormChangeNotifier({
  onFormChange,
}: {
  onFormChange?: (params: OnFormChangeParams) => void
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
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (!onFormChange) return

    // Skip the first render to avoid triggering on initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false
      prevValuesRef.current = { tokenSymbol, blockchain, recipient }
      return
    }

    const prev = prevValuesRef.current
    const tokenChanged = tokenSymbol !== prev.tokenSymbol
    const networkChanged = blockchain !== prev.blockchain
    const recipientChanged =
      recipient !== prev.recipient && recipient !== "" && prev.recipient !== ""

    if (tokenChanged || networkChanged || recipientChanged) {
      onFormChange({
        token: tokenSymbol,
        network: blockchain,
        recipientChanged,
      })
      prevValuesRef.current = { tokenSymbol, blockchain, recipient }
    }
  }, [tokenSymbol, blockchain, recipient, onFormChange])
}
