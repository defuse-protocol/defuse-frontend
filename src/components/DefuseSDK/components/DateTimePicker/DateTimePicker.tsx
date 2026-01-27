import {
  CaretLeft as ChevronLeftIcon,
  CaretRight as ChevronRightIcon,
} from "@phosphor-icons/react"
import clsx from "clsx"
import { format, setHours, setMinutes } from "date-fns"
import { useCallback, useEffect, useMemo, useState } from "react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"

type DateTimePickerProps = {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  minDate?: Date
  disabled?: boolean
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

export function DateTimePicker({
  value,
  onChange,
  minDate,
  disabled,
}: DateTimePickerProps) {
  const [displayMonth, setDisplayMonth] = useState<Date>(value ?? new Date())
  const [selectedHour, setSelectedHour] = useState(12)
  const [selectedMinute, setSelectedMinute] = useState(0)
  const defaultClassNames = getDefaultClassNames()

  useEffect(() => {
    if (value) {
      setSelectedHour(value.getHours())
      setSelectedMinute(value.getMinutes())
      setDisplayMonth(value)
    }
  }, [value])

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 10 }, (_, i) => currentYear + i)
  }, [])

  const handleMonthChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newMonth = Number.parseInt(e.target.value, 10)
      const newDate = new Date(displayMonth)
      newDate.setMonth(newMonth)
      setDisplayMonth(newDate)
    },
    [displayMonth]
  )

  const handleYearChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newYear = Number.parseInt(e.target.value, 10)
      const newDate = new Date(displayMonth)
      newDate.setFullYear(newYear)
      setDisplayMonth(newDate)
    },
    [displayMonth]
  )

  const handleHourChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const hour = Number.parseInt(e.target.value, 10)
      setSelectedHour(hour)
      if (value) {
        const newDate = setHours(value, hour)
        onChange(newDate)
      }
    },
    [value, onChange]
  )

  const handleMinuteChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const minute = Number.parseInt(e.target.value, 10)
      setSelectedMinute(minute)
      if (value) {
        const newDate = setMinutes(value, minute)
        onChange(newDate)
      }
    },
    [value, onChange]
  )

  const handleDaySelect = useCallback(
    (date: Date | undefined) => {
      if (!date) {
        onChange(undefined)
        return
      }

      const newDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        selectedHour,
        selectedMinute
      )
      onChange(newDate)
    },
    [selectedHour, selectedMinute, onChange]
  )

  const handlePrevMonth = useCallback(() => {
    const newDate = new Date(displayMonth)
    newDate.setMonth(newDate.getMonth() - 1)
    setDisplayMonth(newDate)
  }, [displayMonth])

  const handleNextMonth = useCallback(() => {
    const newDate = new Date(displayMonth)
    newDate.setMonth(newDate.getMonth() + 1)
    setDisplayMonth(newDate)
  }, [displayMonth])

  const selectClassName = clsx(
    "appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2",
    "text-sm font-medium text-gray-900 cursor-pointer",
    "hover:border-gray-400 hover:bg-gray-50 transition-colors",
    "focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900",
    "disabled:opacity-50 disabled:cursor-not-allowed"
  )

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="size-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ChevronLeftIcon weight="bold" className="size-4 text-gray-600" />
          </button>

          <div className="flex items-center gap-2">
            <select
              value={displayMonth.getMonth()}
              onChange={handleMonthChange}
              className={clsx(selectClassName, "pr-8")}
              disabled={disabled}
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>

            <select
              value={displayMonth.getFullYear()}
              onChange={handleYearChange}
              className={clsx(selectClassName, "pr-8")}
              disabled={disabled}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="size-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ChevronRightIcon weight="bold" className="size-4 text-gray-600" />
          </button>
        </div>

        <DayPicker
          mode="single"
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          selected={value}
          onSelect={handleDaySelect}
          disabled={[
            { before: minDate ?? new Date() },
            ...(disabled ? [true] : []),
          ]}
          showOutsideDays
          hideNavigation
          classNames={{
            root: `${defaultClassNames.root} w-full`,
            months: "flex flex-col",
            month: "space-y-2",
            month_caption: "hidden",
            weekdays: "flex",
            weekday:
              "text-gray-500 w-9 h-9 flex items-center justify-center text-xs font-medium",
            week: "flex",
            day: "p-0",
            day_button: clsx(
              "size-9 flex items-center justify-center rounded-full text-sm font-medium",
              "hover:bg-gray-200 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1",
              "disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            ),
            selected:
              "bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900",
            today: "font-bold text-gray-900 ring-1 ring-gray-300",
            outside: "text-gray-400",
            hidden: "invisible",
          }}
        />
      </div>

      <div className="w-px bg-gray-200" />

      <div className="flex flex-col gap-3 min-w-[100px]">
        <span className="text-sm font-semibold text-gray-900">Time</span>

        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="datetime-hour" className="text-xs text-gray-500">
              Hour
            </label>
            <select
              id="datetime-hour"
              value={selectedHour}
              onChange={handleHourChange}
              disabled={disabled || !value}
              className={selectClassName}
            >
              {HOURS.map((hour) => (
                <option key={hour} value={hour}>
                  {hour.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="datetime-minute" className="text-xs text-gray-500">
              Minute
            </label>
            <select
              id="datetime-minute"
              value={selectedMinute}
              onChange={handleMinuteChange}
              disabled={disabled || !value}
              className={selectClassName}
            >
              {MINUTES.map((minute) => (
                <option key={minute} value={minute}>
                  {minute.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {value && (
          <div className="mt-auto pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-500">Selected</span>
            <div className="text-sm font-semibold text-gray-900">
              {format(value, "MMM d, yyyy")}
            </div>
            <div className="text-sm font-medium text-gray-600">
              {format(value, "HH:mm")}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
