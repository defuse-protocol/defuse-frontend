import {
  CalendarBlankIcon,
  CheckIcon,
  ClockIcon,
  PencilSimpleIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react"
import clsx from "clsx"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DateTimePicker } from "../../../components/DateTimePicker"

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

function getTimezoneAbbreviation(): string {
  const date = new Date()
  const parts = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")
  return parts?.value ?? Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function GiftExpirationInput({
  value,
  onChange,
  disabled,
}: GiftExpirationInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const prevValueRef = useRef(value)
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isExpanded && prevValueRef.current !== value) {
      setShowSaved(true)
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current)
      }
      savedTimeoutRef.current = setTimeout(() => {
        setShowSaved(false)
      }, 2000)
    }
    prevValueRef.current = value
  }, [value, isExpanded])

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current)
      }
    }
  }, [])

  const handleExpand = useCallback(() => {
    if (disabled) return
    setIsExpanded(true)
    setShowSaved(false)
  }, [disabled])

  const handleCollapse = useCallback(() => {
    setIsExpanded(false)
    setShowCalendar(false)
    setShowSaved(false)
  }, [])

  const handleClear = useCallback(() => {
    onChange(null)
    setShowCalendar(false)
  }, [onChange])

  const handlePreset = useCallback(
    (days: number) => {
      const date = new Date()
      date.setDate(date.getDate() + days)
      date.setHours(12, 0, 0, 0)
      onChange(date.getTime())
      setShowCalendar(false)
    },
    [onChange]
  )

  const handleDateTimeChange = useCallback(
    (date: Date | undefined) => {
      if (date && date.getTime() > Date.now()) {
        onChange(date.getTime())
      }
    },
    [onChange]
  )

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

  const selectedDate = useMemo(
    () => (value !== null ? new Date(value) : undefined),
    [value]
  )

  const minDate = useMemo(() => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    return now
  }, [])

  const hasValue = value !== null
  const isCustomDate =
    hasValue && !PRESETS.some((preset) => isPresetActive(preset.days))

  if (!isExpanded) {
    return (
      <div
        className={clsx(
          "flex items-center gap-3 rounded-2xl bg-white p-3 border transition-all duration-200",
          hasValue
            ? "border-gray-900 outline outline-1 outline-gray-900"
            : "border-gray-200 hover:border-gray-300",
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
                Expires {formatExpirationDisplay(value)}{" "}
                <span className="text-sm font-normal text-gray-400">
                  {getTimezoneAbbreviation()}
                </span>
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
              <PencilSimpleIcon
                weight="bold"
                className="size-4 text-gray-500"
              />
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
    <div className="rounded-2xl bg-white border border-gray-400 outline outline-1 outline-gray-400 p-4 transition-all duration-200">
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
        <div className="flex items-center gap-2">
          {showSaved && (
            <div className="flex items-center gap-1 text-green-600 animate-in fade-in slide-in-from-right-2 duration-200">
              <CheckIcon weight="bold" className="size-4" />
              <span className="text-sm font-medium">Saved</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleCollapse}
            className="size-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <XIcon weight="bold" className="size-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
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
        <button
          type="button"
          onClick={() => setShowCalendar(!showCalendar)}
          disabled={disabled}
          className={clsx(
            "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150",
            "hover:scale-105 active:scale-95 flex items-center gap-2",
            showCalendar || isCustomDate
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-700 border border-gray-200 hover:border-gray-400",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          )}
        >
          {showCalendar ? (
            <XIcon weight="bold" className="size-4" />
          ) : (
            <CalendarBlankIcon weight="bold" className="size-4" />
          )}
          Custom
        </button>
      </div>

      {showCalendar && (
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <DateTimePicker
            value={selectedDate}
            onChange={handleDateTimeChange}
            minDate={minDate}
            disabled={disabled}
          />
        </div>
      )}

      {hasValue && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarBlankIcon weight="bold" className="size-4" />
            <span className="font-medium">
              {formatExpirationDisplay(value)}
            </span>
            <span className="text-xs text-gray-400">
              {getTimezoneAbbreviation()}
            </span>
            {!showCalendar && (
              <button
                type="button"
                onClick={() => setShowCalendar(true)}
                disabled={disabled}
                className="size-6 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors disabled:cursor-not-allowed"
              >
                <PencilSimpleIcon
                  weight="bold"
                  className="size-3.5 text-gray-500"
                />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
              "bg-red-50 text-red-600 hover:bg-red-100 transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            <TrashIcon weight="bold" className="size-3.5" />
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
