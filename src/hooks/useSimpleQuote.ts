"use client"

import { getSimpleQuote } from "@src/actions/getSimpleQuote"
import type { BaseTokenInfo } from "@src/components/DefuseSDK/types/base"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { parseUnits } from "@src/components/DefuseSDK/utils/parse"
import { useCallback, useEffect, useRef, useState } from "react"

interface UseSimpleQuoteParams {
  tokenIn: BaseTokenInfo | null
  tokenOut: BaseTokenInfo | null
  amountIn: string
}

interface UseSimpleQuoteResult {
  amountOut: string
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useSimpleQuote({
  tokenIn,
  tokenOut,
  amountIn,
}: UseSimpleQuoteParams): UseSimpleQuoteResult {
  const [amountOut, setAmountOut] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchQuote = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (!tokenIn || !tokenOut || !amountIn) {
      setAmountOut("")
      setError(null)
      setLoading(false)
      return
    }

    let parsedAmount: bigint
    try {
      parsedAmount = parseUnits(amountIn, tokenIn.decimals)
    } catch {
      setAmountOut("")
      setError(null)
      setLoading(false)
      return
    }

    if (parsedAmount === 0n) {
      setAmountOut("")
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const result = await getSimpleQuote({
        tokenInId: tokenIn.defuseAssetId,
        tokenOutId: tokenOut.defuseAssetId,
        amountIn: parsedAmount.toString(),
      })

      // Check if request was aborted
      if (controller.signal.aborted) return

      if (result.ok) {
        setAmountOut(formatTokenValue(result.amountOut, tokenOut.decimals))
        setError(null)
      } else {
        setAmountOut("")
        setError(result.error)
      }
    } catch (err) {
      if (controller.signal.aborted) return
      setAmountOut("")
      setError(err instanceof Error ? err.message : "Quote failed")
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [tokenIn, tokenOut, amountIn])

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (tokenIn && tokenOut && amountIn && Number(amountIn) > 0) {
      setLoading(true)
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchQuote()
    }, 500)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [fetchQuote, tokenIn, tokenOut, amountIn])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    amountOut,
    loading,
    error,
    refresh: fetchQuote,
  }
}
