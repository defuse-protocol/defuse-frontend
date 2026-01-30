import { cn } from "@src/utils/cn"

const TokenIconPlaceholder = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "relative overflow-hidden size-full flex justify-center items-center bg-gray-100 rounded-full outline-1 outline-gray-900/10 -outline-offset-1",
      className
    )}
  >
    <div className="size-1/2 rounded-full border-2 border-gray-500 border-dashed" />
  </div>
)

export default TokenIconPlaceholder
