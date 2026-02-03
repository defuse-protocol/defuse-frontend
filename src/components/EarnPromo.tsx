import { BtcIcon, EthIcon, NearIcon, UsdcIcon } from "@src/icons"
import clsx from "clsx"

const PLACEHOLDER_VAULTS = [
  { token: "USDC", icon: UsdcIcon, apr: "8.2%" },
  { token: "ETH", icon: EthIcon, apr: "4.5%" },
  { token: "BTC", icon: BtcIcon, apr: "2.1%" },
  { token: "NEAR", icon: NearIcon, apr: "6.8%" },
]

const EarnPromo = () => {
  return (
    <div className="relative bg-gray-800 rounded-3xl grid grid-cols-3 gap-4 group overflow-hidden">
      <div className="col-span-2 relative p-5 z-20">
        <div className="bg-brand/20 text-brand text-xs rounded-lg px-2 py-1 inline-block uppercase font-bold">
          Coming soon
        </div>
        <div className="mt-4 mb-1">
          <h3 className="text-xl font-bold text-white tracking-tight">Earn</h3>
        </div>
        <p className="text-gray-400 text-sm text-balance font-medium">
          Put your idle assets to work. No lockups. Withdraw anytime.
        </p>
      </div>

      <div className="relative" aria-hidden="true">
        <div className="absolute size-32 -bottom-16 -right-16 rounded-full bg-brand/80 blur-[75px] pointer-events-none" />

        {PLACEHOLDER_VAULTS.map(({ token, icon: Icon, apr }, index) => (
          <div
            key={token}
            className={clsx(
              "absolute flex items-center gap-1 bg-white p-0.5 pr-2 rounded-full w-fit",
              {
                "top-6 right-29": index === 0,
                "top-12 right-7": index === 1,
                "bottom-14 right-27": index === 2,
                "bottom-6 right-10": index === 3,
              }
            )}
          >
            <div className="rounded-full overflow-hidden size-5 shrink-0">
              <Icon className="size-full" />
            </div>
            <div className="text-xs text-gray-700 font-bold">{apr}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EarnPromo
