import { Text } from "@radix-ui/themes"
import type { FC } from "react"

interface ModalNoResultsProps {
  handleSearchClear: () => void
  text?: string
}

export const ModalNoResults: FC<ModalNoResultsProps> = ({
  handleSearchClear,
  text = "No assets found",
}) => {
  return (
    <div className="flex justify-center items-center flex-col gap-2.5">
      <Text as="p" size="2" weight="medium" className="pt-[30%] text-gray-11">
        {text}
      </Text>
      <button
        type="button"
        onClick={handleSearchClear}
        className="my-2.5 px-3 py-1.5 bg-gray-a3 rounded-full"
      >
        <Text size="2" weight="medium" className="text-gray-12">
          Clear results
        </Text>
      </button>
    </div>
  )
}
