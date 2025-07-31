import { Skeleton } from "@radix-ui/themes"

export function GiftHistorySkeleton() {
  return (
    <div className="w-full flex flex-col gap-2">
      <Skeleton className="w-20 h-5 text-sm font-bold text-gray-12 pb-1.5">
        Your gifts
      </Skeleton>
      <GiftHistorySkeletonItem />
      <GiftHistorySkeletonItem />
      <GiftHistorySkeletonItem />
    </div>
  )
}

function GiftHistorySkeletonItem() {
  return (
    <div className="py-2.5 flex items-center justify-between gap-2.5">
      <div className="flex justify-between items-center gap-2.5 pr-2.5">
        <div className="flex items-center relative">
          <Skeleton className="w-7 h-7 rounded-full">Icon</Skeleton>
        </div>
        <div className="flex flex-col gap-1">
          <Skeleton className="h-5 w-20 rounded-lg">100 USDC</Skeleton>
          <Skeleton className="h-4 w-28 rounded-lg">
            Apr 02, 2025, 00:41
          </Skeleton>
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="w-8 h-8 rounded-lg">Copy</Skeleton>
        <Skeleton className="w-8 h-8 rounded-lg">Cancel</Skeleton>
      </div>
    </div>
  )
}
