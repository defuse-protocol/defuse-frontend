import { useMemo, useState } from "react"
import type { GiftInfo } from "../utils/parseGiftInfos"

type UseGiftPaginationReturn = {
  visibleGiftItems: GiftInfo[] | undefined
  hasMore: boolean
  showMore: () => void
}

const ITEMS_TO_SHOW = 4

export function useGiftPagination(
  giftInfos: GiftInfo[] | null,
  itemsToShow: number = ITEMS_TO_SHOW
): UseGiftPaginationReturn {
  const [itemsToShowState, setItemsToShowState] = useState(itemsToShow)

  const visibleGiftItems = useMemo(
    () => giftInfos?.slice(0, itemsToShowState),
    [giftInfos, itemsToShowState]
  )

  const hasMore = giftInfos ? itemsToShowState < giftInfos.length : false

  const showMore = () => {
    setItemsToShowState((prev) => prev + itemsToShow)
  }

  return {
    visibleGiftItems,
    hasMore,
    showMore,
  }
}
