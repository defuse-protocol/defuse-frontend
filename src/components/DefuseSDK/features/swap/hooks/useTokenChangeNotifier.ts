import { useEffect } from "react"
import type { SwappableToken } from "../../../types/swap"
import { DepositUIMachineContext } from "../../deposit/components/DepositUIMachineProvider"
import { SwapUIMachineContext } from "../components/SwapUIMachineProvider"

export function useSwapTokenChangeNotifier({
  onTokenChange,
  prevTokensRef,
}: {
  onTokenChange?: (params: {
    tokenIn: SwappableToken | null
    tokenOut: SwappableToken | null
  }) => void
  prevTokensRef: React.MutableRefObject<{
    tokenIn: SwappableToken | null
    tokenOut: SwappableToken | null
  }>
}) {
  const { tokenIn, tokenOut } = SwapUIMachineContext.useSelector(
    (snapshot) => ({
      tokenIn: snapshot.context.formValues.tokenIn,
      tokenOut: snapshot.context.formValues.tokenOut,
    })
  )

  useEffect(() => {
    if (!onTokenChange) return

    const prev = prevTokensRef.current
    if (tokenIn !== prev.tokenIn || tokenOut !== prev.tokenOut) {
      onTokenChange({ tokenIn, tokenOut })
      prevTokensRef.current = { tokenIn, tokenOut }
    }
  }, [tokenIn, tokenOut, onTokenChange, prevTokensRef])
}

export function useDepositTokenChangeNotifier({
  onTokenChange,
  prevTokenRef,
}: {
  onTokenChange?: (params: {
    token: SwappableToken | null
  }) => void
  prevTokenRef: React.MutableRefObject<{
    token: SwappableToken | null
  }>
}) {
  const { token } = DepositUIMachineContext.useSelector((snapshot) => ({
    token: snapshot.context.depositFormRef.getSnapshot().context.token,
  }))

  useEffect(() => {
    if (!onTokenChange) return

    const prev = prevTokenRef.current
    if (token !== prev.token) {
      onTokenChange({ token })
      prevTokenRef.current = { token }
    }
  }, [token, onTokenChange, prevTokenRef])
}
