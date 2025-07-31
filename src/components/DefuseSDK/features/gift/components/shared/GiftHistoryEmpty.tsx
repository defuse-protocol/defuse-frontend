import { Gift } from "@phosphor-icons/react"

export function GiftHistoryEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Gift weight="bold" className="size-8 mb-2.5 text-gray-11" />
      <div className="text-sm font-bold mb-1">No gifts here yet</div>
      <div className="text-xs font-medium text-gray-11">
        Create a gift and send it to your friends
      </div>
    </div>
  )
}
