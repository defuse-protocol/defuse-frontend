import { XIcon } from "@phosphor-icons/react"
import * as RadioGroup from "@radix-ui/react-radio-group"
import { Text } from "@radix-ui/themes"
import { useEffect, useState } from "react"
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

const DEFAULT_SLIPPAGE = 10000 // 1%

export type ModalSlippageSettingsPayload = {
  modalType?: ModalType.MODAL_SLIPPAGE_SETTINGS
  actorRef: Actor<typeof swapUIMachine>
  currentSlippage: number
}

export function ModalSlippageSettings() {
  const { onCloseModal, payload } = useModalStore((state) => state)
  const modalPayload = payload as ModalSlippageSettingsPayload | undefined

  const actorRef = modalPayload?.actorRef
  const currentSlippage = modalPayload?.currentSlippage ?? DEFAULT_SLIPPAGE

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

  const handleValueChange = (value: string) => {
    if (value === "custom") {
      setIsCustomSelected(true)
      setSelectedValue("custom")
    } else {
      setIsCustomSelected(false)
      setSelectedValue(value)
      setCustomValue("")
    }
  }

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Only allow positive numbers and decimal point
    if (inputValue === "" || /^\d*\.?\d*$/.test(inputValue)) {
      setCustomValue(inputValue)
    }
  }

  const handleSave = () => {
    if (!actorRef) {
      return
    }

    let slippageBasisPoints: number

    if (isCustomSelected) {
      const customPercent = Number.parseFloat(customValue)
      if (Number.isNaN(customPercent) || customPercent <= 0) {
        return // Don't save invalid values
      }
      slippageBasisPoints = Math.round(customPercent * 10_000)
    } else {
      slippageBasisPoints = Number.parseInt(selectedValue, 10)
    }

    actorRef.send({
      type: "SET_SLIPPAGE",
      params: { slippageBasisPoints },
    })

    onCloseModal()
  }

  const getSlippageBasisPoints = (): number | null => {
    if (isCustomSelected) {
      const customPercent = Number.parseFloat(customValue)
      if (Number.isNaN(customPercent) || customPercent <= 0) {
        return null
      }
      return Math.round(customPercent * 10_000)
    }
    return Number.parseInt(selectedValue, 10) || null
  }

  const isValid = getSlippageBasisPoints() !== null

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
            Allowable difference between the expected and executed prices of a
            trade. Your transaction will revert if price changes unfavorably by
            more than this percentage.
          </Text>

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
                  className="w-full h-10 px-3 pr-8 rounded-md border bg-gray-1 border-gray-6 focus:outline-none focus:ring-2 focus:ring-gray-6 text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-11">
                  %
                </span>
              </div>
              {customValue && !isValid && (
                <Text size="1" className="text-red-9">
                  Please enter a valid positive number
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
