import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { XIcon } from "@phosphor-icons/react"
import * as RadioGroup from "@radix-ui/react-radio-group"
import { Text } from "@radix-ui/themes"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import type { TokenValue } from "@src/components/DefuseSDK/types/base"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import {
  accountSlippageExactIn,
  accountSlippageExactOut,
  computeTotalDeltaDifferentDecimals,
  getAnyBaseTokenInfo,
} from "@src/components/DefuseSDK/utils/tokenUtils"
import {
  DEFAULT_SLIPPAGE_PERCENT,
  MAX_SLIPPAGE_PERCENT,
  useSlippageStore,
} from "@src/stores/useSlippageStore"
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
}

export function ModalSlippageSettings() {
  const { onCloseModal, payload } = useModalStore((state) => state)
  const modalPayload = payload as ModalSlippageSettingsPayload | undefined

  const actorRef = modalPayload?.actorRef
  const currentSlippage = modalPayload?.currentSlippage ?? DEFAULT_SLIPPAGE
  const tokenDeltas = modalPayload?.tokenDeltas ?? null
  const tokenOut = modalPayload?.tokenOut
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
  const [isCustomSelected, setIsCustomSelected] = useState(false)

  useEffect(() => {
    const matchingOption = SLIPPAGE_OPTIONS.find(
      (opt) => opt.value === currentSlippage
    )
    if (matchingOption) {
      setSelectedValue(String(matchingOption.value))
      setIsCustomSelected(false)
      setCustomValue("")
    } else {
      setSelectedValue("custom")
      setIsCustomSelected(true)
      setCustomValue(String(currentSlippage / 10_000))
    }
  }, [currentSlippage])

  const handleValueChange = useCallback((value: string) => {
    if (value === "custom") {
      setIsCustomSelected(true)
      setSelectedValue("custom")
    } else {
      setIsCustomSelected(false)
      setSelectedValue(value)
      setCustomValue("")
    }
  }, [])

  const handleCustomInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      // Only allow positive numbers and decimal point
      if (inputValue === "" || /^\d*\.?\d*$/.test(inputValue)) {
        setCustomValue(inputValue)
      }
    },
    []
  )

  const setSlippagePercent = useSlippageStore(
    (state) => state.setSlippagePercent
  )

  const slippageBasisPoints = useMemo((): number | null => {
    if (isCustomSelected) {
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
  }, [isCustomSelected, customValue, selectedValue])

  const validationError = useMemo((): string | null => {
    if (!isCustomSelected || !customValue) {
      return null
    }
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
  }, [isCustomSelected, customValue])

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
    if (!actorRef || slippageBasisPoints === null) {
      return
    }

    let slippagePercent: number

    if (isCustomSelected) {
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

    actorRef.send({
      type: "SET_SLIPPAGE",
      params: { slippageBasisPoints },
    })

    onCloseModal()
  }, [
    actorRef,
    slippageBasisPoints,
    isCustomSelected,
    customValue,
    setSlippagePercent,
    onCloseModal,
  ])

  return (
    <ModalDialog>
      <div className="flex flex-col gap-6">
        <div className="flex flex-row justify-between items-center">
          <Text size="5" weight="bold">
            Slippage tolerance
          </Text>
          <button type="button" onClick={onCloseModal} className="p-3">
            <XIcon width={18} height={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <Text size="2" className="text-gray-11">
            Slippage is the maximum difference you allow between the quoted
            price and the final execution price. If the execution price moves
            against you by more than this %, the transaction will revert.{" "}
            {isExactOut
              ? "Below is the maximum amount you will pay."
              : "Below is the minimum amount you are guaranteed to receive."}
          </Text>

          {calculatedSlippageAmount != null &&
            ((isExactOut && tokenIn) || (!isExactOut && tokenOut)) && (
              <div className="flex flex-col gap-2 p-2 rounded-md bg-gray-3 text-gray-11">
                <div className="flex justify-between items-center">
                  <Text size="2" className="text-gray-11">
                    {isExactOut ? "Pay at most" : "Receive at least"}
                  </Text>
                  <Text size="2" className="text-gray-12 font-medium">
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
                  </Text>
                </div>
              </div>
            )}

          <RadioGroup.Root
            value={selectedValue}
            onValueChange={handleValueChange}
            className="flex flex-col gap-3"
          >
            <div className="grid grid-cols-3 gap-2">
              {SLIPPAGE_OPTIONS.map((option) => (
                <RadioGroup.Item
                  key={option.value}
                  value={String(option.value)}
                  className="flex items-center justify-center h-10 rounded-md border transition-colors hover:bg-gray-3 data-[state=checked]:bg-gray-3 data-[state=checked]:border-gray-6 border-gray-6 bg-gray-1"
                >
                  <Text size="2" weight="medium">
                    {option.label}
                  </Text>
                </RadioGroup.Item>
              ))}
              <RadioGroup.Item
                value="custom"
                className="flex items-center justify-center h-10 rounded-md border transition-colors hover:bg-gray-3 data-[state=checked]:bg-gray-3 data-[state=checked]:border-gray-6 border-gray-6 bg-gray-1"
              >
                <Text size="2" weight="medium">
                  Custom
                </Text>
              </RadioGroup.Item>
            </div>
          </RadioGroup.Root>

          {isCustomSelected && (
            <div className="flex flex-col gap-2">
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={customValue}
                  onChange={handleCustomInputChange}
                  placeholder="1.0"
                  className="w-full h-10 px-3 pr-8 rounded-md border bg-gray-1 border-gray-6 focus:outline-hidden focus:ring-2 focus:ring-gray-6 text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-11">
                  %
                </span>
              </div>
              {validationError && (
                <Text size="1" className="text-red-9">
                  {validationError}
                </Text>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCloseModal}
            className="flex-1 h-10 rounded-md border border-gray-6 hover:bg-gray-3 transition-colors flex items-center justify-center"
          >
            <Text size="2" weight="medium">
              Cancel
            </Text>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className="flex-1 h-10 rounded-md bg-gray-12 text-gray-1 hover:bg-gray-11 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Text size="2" weight="medium">
              Save
            </Text>
          </button>
        </div>
      </div>
    </ModalDialog>
  )
}
