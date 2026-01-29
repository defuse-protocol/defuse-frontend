import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import * as RadioGroup from "@radix-ui/react-radio-group"
import Button from "@src/components/Button"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import type { TokenValue } from "@src/components/DefuseSDK/types/base"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import {
  accountSlippageExactIn,
  accountSlippageExactOut,
  computeTotalDeltaDifferentDecimals,
  getAnyBaseTokenInfo,
} from "@src/components/DefuseSDK/utils/tokenUtils"
import ErrorMessage from "@src/components/ErrorMessage"
import {
  DEFAULT_SLIPPAGE_PERCENT,
  MAX_SLIPPAGE_PERCENT,
  useSlippageStore,
} from "@src/stores/useSlippageStore"
import clsx from "clsx"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { Actor } from "xstate"
import type { swapUIMachine } from "../../features/machines/swapUIMachine"
import { useModalStore } from "../../providers/ModalStoreProvider"
import type { ModalType } from "../../stores/modalStore"
import { ModalDialog } from "./ModalDialog"

const SLIPPAGE_OPTIONS = [
  { label: "0.1%", value: 1000 }, // 0.1% * 10_000
  { label: "0.25%", value: 2500 }, // 0.25% * 10_000
  { label: "0.5%", value: 5000 }, // 0.5% * 10_000
  { label: "1%", value: 10000 }, // 1% * 10_000
  { label: "3%", value: 30000 }, // 3% * 10_000
] as const

const DEFAULT_SLIPPAGE = DEFAULT_SLIPPAGE_PERCENT * 10000 // 1%

export type ModalSlippageSettingsPayload = {
  modalType?: ModalType.MODAL_SLIPPAGE_SETTINGS
  actorRef: Actor<typeof swapUIMachine>
  currentSlippage: number
  tokenDeltas?: [string, bigint][] | null
  tokenOut?: TokenInfo
  tokenIn?: TokenInfo
  swapType?: QuoteRequest.swapType
  /** If true, only update localStorage without triggering a re-quote */
  skipRequote?: boolean
}

export function ModalSlippageSettings() {
  const { onCloseModal, payload } = useModalStore((state) => state)
  const modalPayload = payload as ModalSlippageSettingsPayload | undefined

  const actorRef = modalPayload?.actorRef
  const currentSlippage = modalPayload?.currentSlippage ?? DEFAULT_SLIPPAGE
  const tokenDeltas = modalPayload?.tokenDeltas ?? null
  const tokenOut = modalPayload?.tokenOut
  const skipRequote = modalPayload?.skipRequote ?? false
  const tokenIn = modalPayload?.tokenIn
  const swapType = modalPayload?.swapType ?? QuoteRequest.swapType.EXACT_INPUT

  const isExactOut = swapType === QuoteRequest.swapType.EXACT_OUTPUT

  const tokenOutBase = useMemo(() => {
    if (!tokenOut) return null
    return getAnyBaseTokenInfo(tokenOut)
  }, [tokenOut])

  const tokenInBase = useMemo(() => {
    if (!tokenIn) return null
    return getAnyBaseTokenInfo(tokenIn)
  }, [tokenIn])

  const [selectedValue, setSelectedValue] = useState<string>("")
  const [customValue, setCustomValue] = useState<string>("")

  useEffect(() => {
    const matchingOption = SLIPPAGE_OPTIONS.find(
      (opt) => opt.value === currentSlippage
    )
    if (matchingOption) {
      setSelectedValue(String(matchingOption.value))
      setCustomValue("")
    } else {
      setSelectedValue("custom")
      setCustomValue(String(currentSlippage / 10_000))
    }
  }, [currentSlippage])

  const handleValueChange = useCallback((value: string) => {
    setSelectedValue(value)
    setCustomValue("")
  }, [])

  const handleCustomInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value

      if (inputValue === "") {
        setCustomValue("")
        setSelectedValue(String(DEFAULT_SLIPPAGE))
        return
      }

      // Only allow positive numbers and decimal point
      if (/^\d*\.?\d*$/.test(inputValue)) {
        setSelectedValue("custom")
        setCustomValue(inputValue)
      }
    },
    []
  )

  const setSlippagePercent = useSlippageStore(
    (state) => state.setSlippagePercent
  )

  const slippageBasisPoints = useMemo((): number | null => {
    if (customValue) {
      const customPercent = Number.parseFloat(customValue)
      if (
        Number.isNaN(customPercent) ||
        customPercent <= 0 ||
        customPercent > MAX_SLIPPAGE_PERCENT
      ) {
        return null
      }
      return Math.round(customPercent * 10_000)
    }
    const basisPoints = Number.parseInt(selectedValue, 10)
    if (!basisPoints) {
      return null
    }
    const percent = basisPoints / 10_000
    if (percent > MAX_SLIPPAGE_PERCENT) {
      return null
    }
    return basisPoints
  }, [customValue, selectedValue])

  const validationError = useMemo((): string | null => {
    if (!customValue) return null

    const customPercent = Number.parseFloat(customValue)

    if (Number.isNaN(customPercent)) {
      return "Please enter a valid number"
    }
    if (customPercent <= 0) {
      return "Please enter a valid positive number"
    }
    if (customPercent > MAX_SLIPPAGE_PERCENT) {
      return `Max allowed slippage is ${MAX_SLIPPAGE_PERCENT}%`
    }
    return null
  }, [customValue])

  const isValid = useMemo(
    () => slippageBasisPoints !== null,
    [slippageBasisPoints]
  )

  const calculatedSlippageAmount = useMemo((): TokenValue | null => {
    if (!tokenDeltas || slippageBasisPoints === null) {
      return null
    }

    try {
      if (isExactOut) {
        // For exact out, calculate max input amount (pay at most)
        if (!tokenInBase) return null
        const deltasWithSlippage = accountSlippageExactOut(
          tokenDeltas,
          slippageBasisPoints
        )
        const maxAmount = computeTotalDeltaDifferentDecimals(
          [tokenInBase],
          deltasWithSlippage
        )
        // Return absolute value since deltas are negative
        return { amount: -maxAmount.amount, decimals: maxAmount.decimals }
      }
      // For exact in, calculate min output amount (receive at least)
      if (!tokenOutBase) return null
      const deltasWithSlippage = accountSlippageExactIn(
        tokenDeltas,
        slippageBasisPoints
      )
      const minAmount = computeTotalDeltaDifferentDecimals(
        [tokenOutBase],
        deltasWithSlippage
      )
      return minAmount
    } catch {
      return null
    }
  }, [tokenDeltas, tokenOutBase, tokenInBase, slippageBasisPoints, isExactOut])

  const handleSave = useCallback(() => {
    if (slippageBasisPoints === null) {
      return
    }

    let slippagePercent: number

    if (customValue) {
      const customPercent = Number.parseFloat(customValue)
      if (
        Number.isNaN(customPercent) ||
        customPercent <= 0 ||
        customPercent > MAX_SLIPPAGE_PERCENT
      ) {
        return // Don't save invalid values
      }
      slippagePercent = customPercent
    } else {
      slippagePercent = slippageBasisPoints / 10_000
      // Validate preset options (should already be valid, but double-check)
      if (slippagePercent > MAX_SLIPPAGE_PERCENT) {
        return
      }
    }

    // Save to localStorage
    setSlippagePercent(slippagePercent)

    // Only trigger re-quote if not skipping (e.g., when opened from review modal)
    if (!skipRequote && actorRef) {
      actorRef.send({
        type: "SET_SLIPPAGE",
        params: { slippageBasisPoints },
      })
    }

    onCloseModal()
  }, [
    actorRef,
    slippageBasisPoints,
    customValue,
    setSlippagePercent,
    onCloseModal,
    skipRequote,
  ])

  return (
    <ModalDialog title="Slippage">
      <p className="text-sm text-gray-500 font-medium mt-1">
        Slippage is a safety mechanism to protect you from getting a final price
        that is very different than the quoted price. If the specified slippage
        would be exceeded, your swap will be cancelled.{" "}
        {calculatedSlippageAmount != null
          ? isExactOut
            ? "Below is the maximum amount you will pay."
            : "Below is the minimum amount you are guaranteed to receive."
          : ""}
      </p>

      {calculatedSlippageAmount != null &&
        ((isExactOut && tokenIn) || (!isExactOut && tokenOut)) && (
          <dl className="flex items-center justify-between gap-2 px-3 py-3.5 rounded-2xl border border-gray-200 mt-4">
            <dt className="text-gray-500 text-sm font-semibold">
              {isExactOut ? "Pay at most" : "Receive at least"}
            </dt>
            <dd className="text-sm font-semibold text-gray-900">
              {formatTokenValue(
                calculatedSlippageAmount.amount,
                calculatedSlippageAmount.decimals,
                { fractionDigits: 5 }
              )}{" "}
              {isExactOut && tokenIn
                ? tokenIn.symbol
                : !isExactOut && tokenOut
                  ? tokenOut.symbol
                  : ""}
            </dd>
          </dl>
        )}

      <RadioGroup.Root
        value={selectedValue}
        onValueChange={handleValueChange}
        className="mt-6"
      >
        <div className="grid grid-cols-3 gap-1">
          {SLIPPAGE_OPTIONS.map((option) => {
            const value = String(option.value)
            const selected = selectedValue === value

            return (
              <RadioGroup.Item key={option.value} value={value} asChild>
                <Button variant={selected ? "primary" : "secondary"} size="sm">
                  {option.label}
                </Button>
              </RadioGroup.Item>
            )
          })}
          <div
            className={clsx(
              "flex items-center rounded-lg pl-2 pr-2 overflow-hidden focus-within:bg-white focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-gray-900",
              customValue ? "bg-gray-900" : "bg-gray-100"
            )}
          >
            <input
              type="text"
              inputMode="decimal"
              value={customValue}
              onChange={handleCustomInputChange}
              placeholder="Custom"
              className={clsx(
                "block min-w-0 grow h-8 pr-2 pl-0 peer focus:text-gray-900 bg-transparent text-sm leading-none font-semibold focus:ring-0 border-0 placeholder:text-gray-400",
                customValue ? "text-white" : "text-gray-500"
              )}
            />
            <div
              className={clsx(
                "shrink-0 text-sm font-semibold select-none leading-none",
                customValue
                  ? "text-white peer-focus:text-gray-500"
                  : "text-gray-500"
              )}
            >
              %
            </div>
          </div>
        </div>
      </RadioGroup.Root>

      {validationError && (
        <ErrorMessage className="mt-2 text-center">
          {validationError}
        </ErrorMessage>
      )}

      <div className="grid grid-cols-2 gap-1 mt-6">
        <Button
          type="button"
          variant="secondary"
          size="xl"
          onClick={onCloseModal}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="xl"
          onClick={handleSave}
          disabled={!isValid}
        >
          Save
        </Button>
      </div>
    </ModalDialog>
  )
}
