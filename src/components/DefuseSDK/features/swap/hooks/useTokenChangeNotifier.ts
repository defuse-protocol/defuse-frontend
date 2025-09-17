import { updateURLParamsSwap } from "@src/app/(home)/_utils/useDeterminePair"
import { useTokensStore } from "@src/components/DefuseSDK/providers/TokensStoreProvider"
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import type { SwappableToken } from "../../../types/swap"
import { DepositUIMachineContext } from "../../deposit/components/DepositUIMachineProvider"
import { SwapUIMachineContext } from "../components/SwapUIMachineProvider"

export function useSwapTokenChangeNotifier({
  router,
  prevTokensRef,
}: {
  router: AppRouterInstance
  prevTokensRef: React.RefObject<{
    tokenIn: SwappableToken | null
    tokenOut: SwappableToken | null
  }>
}) {
  const searchParams = useSearchParams()
  const tokens = useTokensStore((state) => state.tokens)

  const { tokenIn, tokenOut } = SwapUIMachineContext.useSelector(
    (snapshot) => ({
      tokenIn: snapshot.context.formValues.tokenIn,
      tokenOut: snapshot.context.formValues.tokenOut,
    })
  )

  useEffect(() => {
    const prev = prevTokensRef.current
    if (tokenIn !== prev.tokenIn || tokenOut !== prev.tokenOut) {
      updateURLParamsSwap({ tokenIn, tokenOut, tokens, router, searchParams })
      prevTokensRef.current = { tokenIn, tokenOut }
    }
  }, [tokenIn, tokenOut, prevTokensRef, tokens, router, searchParams])
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
