import {
  Clock as ClockIcon,
  PencilSimple as PencilIcon,
  X as XIcon,
} from "@phosphor-icons/react"
import clsx from "clsx"
import { useCallback, useMemo, useState } from "react"

type GiftExpirationInputProps = {
  value: number | null
  onChange: (value: number | null) => void
  disabled?: boolean
}

const PRESETS = [
  { label: "1 day", days: 1 },
  { label: "1 week", days: 7 },
  { label: "1 month", days: 30 },
] as const

function toLocalDateTimeString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function getMinDateTime(): string {
  const now = new Date()
  now.setHours(now.getHours() + 1)
  return toLocalDateTimeString(now)
}

function timestampToDateTimeLocal(timestamp: number): string {
  return toLocalDateTimeString(new Date(timestamp))
}

function dateTimeLocalToTimestamp(value: string): number {
  return new Date(value).getTime()
}

function formatExpirationDisplay(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function GiftExpirationInput({
  value,
  onChange,
  disabled,
}: GiftExpirationInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleExpand = useCallback(() => {
    if (disabled) return
    setIsExpanded(true)
  }, [disabled])

  const handleCollapse = useCallback(() => {
    setIsExpanded(false)
  }, [])

  const handleClear = useCallback(() => {
    onChange(null)
  }, [onChange])

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const timestamp = dateTimeLocalToTimestamp(e.target.value)
      if (timestamp > Date.now()) {
        onChange(timestamp)
      }
    },
    [onChange]
  )

  const handlePreset = useCallback(
    (days: number) => {
      const date = new Date()
      date.setDate(date.getDate() + days)
      onChange(date.getTime())
    },
    [onChange]
  )

  const dateTimeValue = useMemo(() => {
    if (value === null) return ""
    return timestampToDateTimeLocal(value)
  }, [value])

  const isPresetActive = useCallback(
    (days: number) => {
      if (value === null) return false
      const presetDate = new Date()
      presetDate.setDate(presetDate.getDate() + days)
      presetDate.setHours(0, 0, 0, 0)
      const valueDate = new Date(value)
      valueDate.setHours(0, 0, 0, 0)
      return presetDate.getTime() === valueDate.getTime()
    },
    [value]
  )

  const hasValue = value !== null

  if (!isExpanded) {
    return (
      <div
        className={clsx(
          "flex items-center gap-3 rounded-2xl bg-white p-3 border transition-all duration-200",
          hasValue
            ? "border-gray-900 outline outline-1 outline-gray-900"
            : "border-gray-200 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <button
          type="button"
          onClick={handleExpand}
          disabled={disabled}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <div
            className={clsx(
              "size-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
              hasValue ? "bg-gray-900" : "bg-gray-100"
            )}
          >
            <ClockIcon
              weight="bold"
              className={clsx(
                "size-5",
                hasValue ? "text-white" : "text-gray-500"
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            {hasValue ? (
              <span className="text-base font-semibold text-gray-900">
                Expires {formatExpirationDisplay(value)}
              </span>
            ) : (
              <span className="text-base font-semibold text-gray-400">
                Set expiration (optional)
              </span>
            )}
          </div>
        </button>

        {hasValue && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleExpand}
              disabled={disabled}
              className="size-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:cursor-not-allowed"
            >
              <PencilIcon weight="bold" className="size-4 text-gray-500" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="size-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:cursor-not-allowed"
            >
              <XIcon weight="bold" className="size-4 text-gray-500" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-900 outline outline-1 outline-gray-900 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              "size-10 rounded-full flex items-center justify-center shrink-0",
              hasValue ? "bg-gray-900" : "bg-gray-100"
            )}
          >
            <ClockIcon
              weight="bold"
              className={clsx(
                "size-5",
                hasValue ? "text-white" : "text-gray-500"
              )}
            />
          </div>
          <span className="font-semibold text-gray-900">Set expiration</span>
        </div>
        <button
          type="button"
          onClick={handleCollapse}
          className="text-sm font-semibold text-gray-900 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Done
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handlePreset(preset.days)}
            disabled={disabled}
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150",
              "hover:scale-105 active:scale-95",
              isPresetActive(preset.days)
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:border-gray-400",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <input
          type="datetime-local"
          value={dateTimeValue}
          onChange={handleDateChange}
          min={getMinDateTime()}
          disabled={disabled}
          className={clsx(
            "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-all cursor-pointer",
            "font-medium text-sm text-gray-900",
            "hover:border-gray-400 hover:bg-gray-100",
            "focus:border-gray-900 focus:outline focus:outline-1 focus:outline-gray-900",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "[&::-webkit-calendar-picker-indicator]:cursor-pointer"
          )}
        />
      </div>

      {hasValue && (
        <button
          type="button"
          onClick={handleClear}
          className="mt-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          Clear expiration
        </button>
      )}
    </div>
  )
}
