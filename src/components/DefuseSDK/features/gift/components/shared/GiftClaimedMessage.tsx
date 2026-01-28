export function GiftClaimedMessage() {
  return (
    <div className="bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl mt-4">
      <div className="text-sm flex items-center justify-center gap-2 text-amber-800">
        <span className="font-semibold">Your gift is being claimed.</span>
        <span className="text-amber-600">Please wait a moment.</span>
      </div>
    </div>
  )
}
