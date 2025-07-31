import { cn } from "@src/components/DefuseSDK/utils/cn"
import type { HostAppRoute, RenderHostAppLink } from "../types/hostAppLink"

type TradeNavigationLinksProps = {
  currentRoute: HostAppRoute
  renderHostAppLink: RenderHostAppLink
}

export function TradeNavigationLinks({
  currentRoute,
  renderHostAppLink,
}: TradeNavigationLinksProps) {
  return (
    <div className="flex flex-row items-center border-b rounded-t-2xl border-gray-4 overflow-hidden -mx-5 -mt-5">
      {renderHostAppLink(
        "swap",
        <div
          className={cn(
            "flex flex-1 justify-center items-center w-full h-[68px] hover:bg-gray-3 border-b-[3px] box-border text-2xl font-black leading-7",
            currentRoute === "swap"
              ? "border-gray-12"
              : "border-transparent text-gray-10"
          )}
        >
          Swap
        </div>,
        { className: "flex-1" }
      )}

      {renderHostAppLink(
        "otc",
        <div
          className={cn(
            "flex flex-1 justify-center items-center w-full h-[68px] hover:bg-gray-3 border-b-[3px] box-border text-2xl font-black leading-7",
            currentRoute === "otc"
              ? "border-gray-12"
              : "border-transparent text-gray-10"
          )}
        >
          OTC
        </div>,
        { className: "flex-1" }
      )}
    </div>
  )
}
