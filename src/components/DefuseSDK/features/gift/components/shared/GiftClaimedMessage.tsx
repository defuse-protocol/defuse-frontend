export function GiftClaimedMessage() {
  return (
    <div className="bg-warning px-3 py-2 text-warning-foreground mt-2.5">
      <div className="text-xs flex items-center justify-center">
        <span className="font-bold">Your gift is being claimed.</span>
        <span className="ml-2">This may take 5-10 seconds more.</span>
      </div>
    </div>
  )
}
