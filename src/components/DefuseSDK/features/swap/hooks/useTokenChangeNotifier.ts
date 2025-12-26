import { updateURLParamsSwap } from "@src/app/(app)/swap/_utils/useDeterminePair"
import { useTokensStore } from "@src/components/DefuseSDK/providers/TokensStoreProvider"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"
import { DepositUIMachineContext } from "../../deposit/components/DepositUIMachineProvider"
import { SwapUIMachineContext } from "../components/SwapUIMachineProvider"

export function useSwapTokenChangeNotifier(tokenInAndOut: {
  tokenIn: TokenInfo | null
  tokenOut: TokenInfo | null
}) {
  const router = useRouter()
  const prevTokensRef = useRef(tokenInAndOut)
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
  }, [tokenIn, tokenOut, tokens, router, searchParams])
}

export function useDepositTokenChangeNotifier({
  onTokenChange,
  ...tokenFromProps
}: {
  onTokenChange?: (params: {
    token: TokenInfo | null
  }) => void
  token: TokenInfo | null
}) {
  const prevTokenRef = useRef(tokenFromProps)
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
  }, [token, onTokenChange])
}
