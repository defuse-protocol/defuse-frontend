import { BtcIcon, EthIcon, UsdcIcon, UsdtIcon } from "@src/icons"
import clsx from "clsx"

const DepositPromo = ({ className }: { className?: string }) => (
  <div className={clsx("flex items-center gap-2", className)}>
    <div className="flex -space-x-2">
      <BtcIcon className="size-10 shrink-0 ring-2 -ring-offset-2 ring-white rounded-full" />
      <EthIcon className="size-10 shrink-0 ring-2 -ring-offset-2 ring-white rounded-full" />
      <UsdtIcon className="size-10 shrink-0 ring-2 -ring-offset-2 ring-white rounded-full" />
      <UsdcIcon className="size-10 shrink-0 ring-2 -ring-offset-2 ring-white rounded-full" />
    </div>
    <p className="text-xs/4 text-gray-500 font-medium">
      Deposit 100+ coins
      <br /> across 30+ networks
    </p>
  </div>
)

export default DepositPromo
