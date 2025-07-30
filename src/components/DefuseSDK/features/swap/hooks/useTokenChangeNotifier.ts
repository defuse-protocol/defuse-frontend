import { useEffect } from "react"
import type { SwappableToken } from "../../../types/swap"
import { SwapUIMachineContext } from "../components/SwapUIMachineProvider"

export function useTokenChangeNotifier({
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
