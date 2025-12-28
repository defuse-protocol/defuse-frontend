import { MagnifyingGlassIcon, XCircleIcon } from "@heroicons/react/20/solid"
import { useEffect, useRef } from "react"

type Props = {
  query: string
  setQuery: (value: string) => void
  placeholder?: string
}

const SearchBar = ({
  query,
  setQuery,
  placeholder = "Search tokens",
}: Props) => {
  const ref = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const shouldAutofocus = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches

    if (shouldAutofocus) {
      ref.current?.focus({ preventScroll: true })
    }
  }, [])

  return (
    <div className="grid grid-cols-1">
      <input
        ref={ref}
        className="col-start-1 row-start-1 block w-full rounded-xl text-sm bg-white py-2.5 px-9 text-gray-900 outline-1 -outline-offset-1 outline-gray-200 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-gray-900 ring-0 border-0 font-medium"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <MagnifyingGlassIcon
        className="pointer-events-none col-start-1 row-start-1 ml-2 size-5 self-center text-gray-400"
        aria-hidden
      />
      {query.length > 0 && (
        <button
          type="button"
          className="col-start-1 row-start-1 size-7 mr-1 self-center rounded-lg justify-self-end flex items-center justify-center text-gray-400 hover:text-gray-600"
          onClick={() => setQuery("")}
          aria-label="Clear search"
        >
          <XCircleIcon className="size-5" aria-hidden />
        </button>
      )}
    </div>
  )
}

export default SearchBar
