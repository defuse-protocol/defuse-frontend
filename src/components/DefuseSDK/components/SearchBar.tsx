"use client"

import { MagnifyingGlassIcon, XCircleIcon } from "@heroicons/react/20/solid"
import Spinner from "@src/components/Spinner"
import clsx from "clsx"
import {
  type ComponentProps,
  type ElementType,
  useEffect,
  useId,
  useRef,
} from "react"

type Props = ComponentProps<"input"> & {
  loading?: boolean
  onClear?: () => void
  icon?: ElementType
}

const SearchBar = ({
  placeholder = "Search tokens",
  className,
  onClear,
  autoFocus,
  loading,
  icon: Icon = MagnifyingGlassIcon,
  ...inputProps
}: Props) => {
  const id = useId()
  const ref = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!autoFocus) return

    const shouldAutofocus = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches

    if (shouldAutofocus) {
      ref.current?.focus({ preventScroll: true })
    }
  }, [autoFocus])

  const displayValue = inputProps.value ?? inputProps.defaultValue ?? ""
  const hasValue = String(displayValue).length > 0

  return (
    <div className={clsx("grid grid-cols-1", className)}>
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <input
        id={id}
        ref={ref}
        className="col-start-1 row-start-1 block w-full rounded-xl text-sm bg-white py-2.5 px-9 text-gray-900 outline-1 -outline-offset-1 outline-gray-200 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-gray-900 ring-0 border-0 font-medium"
        placeholder={placeholder}
        {...inputProps}
      />
      <Icon
        className="pointer-events-none col-start-1 row-start-1 ml-2 size-5 self-center text-gray-400"
        aria-hidden
      />
      {loading ? (
        <div className="pointer-events-none col-start-1 row-start-1 justify-self-end self-center mr-3">
          <Spinner size="sm" />
        </div>
      ) : hasValue && onClear ? (
        <button
          type="button"
          className="col-start-1 row-start-1 size-7 mr-1 self-center rounded-lg justify-self-end flex items-center justify-center text-gray-400 hover:text-gray-600"
          onClick={() => {
            if (ref.current) {
              ref.current.value = ""
            }
            onClear()
          }}
          aria-label="Clear search"
        >
          <XCircleIcon className="size-5" aria-hidden />
        </button>
      ) : null}
    </div>
  )
}

export default SearchBar
