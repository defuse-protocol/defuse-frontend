import { cn } from "@src/utils/cn"

const TokenIconPlaceholder = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "relative overflow-hidden size-full flex justify-center items-center bg-surface-active rounded-full outline-1 outline-fg/10 -outline-offset-1",
      className
    )}
  >
    <div className="size-1/2 rounded-full border-2 border-gray-500 border-dashed" />
  </div>
)

export default TokenIconPlaceholder
