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
      className="size-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
      aria-hidden
    >
      <MagnifyingGlassIcon className="size-5" />
    </div>
    <h3 className="font-semibold text-base text-gray-900 mt-4">{text}</h3>
    <Button size="md" onClick={handleSearchClear} className="mt-4">
      Clear search
    </Button>
  </div>
)

export default ModalNoResults
