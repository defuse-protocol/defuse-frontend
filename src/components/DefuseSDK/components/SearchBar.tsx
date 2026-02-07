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
        type="text"
        className="col-start-1 row-start-1 block w-full rounded-xl text-sm bg-surface-card py-2.5 px-9 text-fg outline-1 -outline-offset-1 outline-border placeholder:text-fg-tertiary focus:outline-2 focus:-outline-offset-2 focus:outline-fg ring-0 border-0 font-medium"
        placeholder={placeholder}
        {...inputProps}
      />
      <Icon
        className="pointer-events-none col-start-1 row-start-1 ml-2 size-5 self-center text-fg-tertiary"
        aria-hidden
      />
      {loading ? (
        <div className="pointer-events-none col-start-1 row-start-1 justify-self-end self-center mr-3">
          <Spinner size="sm" />
        </div>
      ) : hasValue && onClear ? (
        <button
          type="button"
          className="col-start-1 row-start-1 size-7 mr-1 self-center rounded-lg justify-self-end flex items-center justify-center text-fg-tertiary hover:text-fg-secondary"
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
