import { useContext, useState } from "react"

import { ChevronRightIcon } from "@radix-ui/react-icons"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import NearBadge from "../../public/static/icons/near-badge.svg"

const NEAR_COM_LINK_PROPS = {
  href: "https://near.com/?utm_source=near-intents",
  target: "_blank",
  rel: "noopener noreferrer",
}

const NearComPromo = () => {
  const [showReadMore, setShowReadMore] = useState(false)
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  if (whitelabelTemplate !== "near-intents") return null

  return (
    <div className="widget-container mx-auto mt-5 md:mt-8 px-3 sm:px-0 md:-mb-4">
      <div className="rounded-3xl bg-gray-900 p-4 sm:p-5 pt-4 dark:bg-gray-950 outline outline-white/5">
        <div className="flex items-center gap-3">
          <NearBadge aria-hidden="true" className="size-6 shrink-0" />
          <h2 className="text-white text-lg/6 font-semibold -tracking-[0.01em]">
            We’ve moved to near.com
          </h2>
        </div>
        <p className="text-gray-400 text-sm font-medium mt-3">
          The NEAR Intents consumer app has a new home at{" "}
          <a {...NEAR_COM_LINK_PROPS} className="text-white underline">
            near.com
          </a>{" "}
          <br className="hidden sm:block" />— better app, same team. You can
          continue here, but we encourage you to make the switch.{" "}
          {!showReadMore && (
            <button
              type="button"
              onClick={() => setShowReadMore(true)}
              className="text-white underline text-left inline-block"
            >
              Read more
            </button>
          )}
        </p>
        {showReadMore && (
          <p className="text-gray-400 text-sm font-medium mt-2">
            Head over to{" "}
            <a {...NEAR_COM_LINK_PROPS} className="text-white underline">
              near.com
            </a>{" "}
            to get started. If you have funds here, you can transfer them to
            your new account using NEAR Intents internal transfers.
          </p>
        )}
        <a
          {...NEAR_COM_LINK_PROPS}
          className="inline-flex items-center gap-1 mt-4 bg-white text-gray-900 px-4 rounded-xl py-3 -tracking-[0.01em]"
        >
          <span className="text-sm/4 font-semibold">Go to near.com</span>
          <ChevronRightIcon className="size-4 shrink-0" />
        </a>
      </div>
    </div>
  )
}

export default NearComPromo
