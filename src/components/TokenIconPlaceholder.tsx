import { cn } from "@src/utils/cn"

const TokenIconPlaceholder = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "relative overflow-hidden size-full flex justify-center items-center bg-gray-100 rounded-full",
      className
    )}
  >
    <div className="size-1/2 rounded-full border-2 border-gray-500 border-dashed" />
  </div>
)

export default TokenIconPlaceholder
