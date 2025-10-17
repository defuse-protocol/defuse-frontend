import { XCircleIcon } from "@phosphor-icons/react"
import { MagnifyingGlassIcon } from "@radix-ui/react-icons"
import { useIsDesktop } from "@src/hooks/useIsDesktop"

type Props = {
  query: string
  setQuery: (value: string) => void
  placeholder?: string
}

export const SearchBar = ({
  query,
  setQuery,
  placeholder = "Search coin",
}: Props) => {
  const isDesktop = useIsDesktop()

  return (
    <div className="flex justify-between items-center gap-2.5 py-2.5 px-4 bg-gray-3 rounded-lg">
      <div>
        <MagnifyingGlassIcon width={22} height={22} />
      </div>
      <input
        ref={(el) => {
          if (el && isDesktop) {
            el.focus()
          }
        }}
        className="flex-1 border-transparent p-0 focus:border-transparent focus:ring-0 bg-gray-3 outline-none"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query.length > 0 && (
        <button type="button" className="p-1" onClick={() => setQuery("")}>
          <XCircleIcon width={16} height={16} weight="fill" />
        </button>
      )}
    </div>
  )
}
