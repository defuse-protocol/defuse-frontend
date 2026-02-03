export function GiftHistorySkeleton() {
  return (
    <section className="mt-6">
      <div className="rounded-2xl border border-gray-200 overflow-hidden px-4">
        <GiftHistorySkeletonItem />
        <GiftHistorySkeletonItem />
        <GiftHistorySkeletonItem />
      </div>
    </section>
  )
}

function GiftHistorySkeletonItem() {
  return (
    <div className="py-4 flex items-center justify-between gap-2.5 border-b border-gray-100 last:border-b-0">
      <div className="flex justify-between items-center gap-2.5 pr-2.5">
        <div className="flex items-center relative">
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="h-5 w-24 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-4 w-32 rounded-lg bg-gray-100 animate-pulse" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="w-20 h-6 rounded-full bg-gray-100 animate-pulse" />
      </div>
    </div>
  )
}
