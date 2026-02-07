import { MagnifyingGlassIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"

interface ModalNoResultsProps {
  handleSearchClear: () => void
  text?: string
}

const ModalNoResults = ({
  handleSearchClear,
  text = "No tokens found",
}: ModalNoResultsProps) => (
  <div className="flex justify-center items-center flex-col my-8">
    <div
      className="size-10 rounded-full bg-surface-active flex items-center justify-center text-fg-secondary"
      aria-hidden
    >
      <MagnifyingGlassIcon className="size-5" />
    </div>
    <h3 className="font-semibold text-base text-fg mt-4">{text}</h3>
    <Button size="md" onClick={handleSearchClear} className="mt-4">
      Clear search
    </Button>
  </div>
)

export default ModalNoResults
