import { useContext } from "react"

import { ChevronRightIcon } from "@radix-ui/react-icons"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import NearBadge from "../../public/static/icons/near-badge.svg"

const MIGRATION_ARTICLE_ID = "69de575cfe9deda3e8da017c"
const MIGRATION_ARTICLE_URL =
  "https://near-intents-app.helpscoutdocs.com/article/257-migration-from-near-intents-to-nearcom"

const NEAR_COM_LINK_PROPS = {
  href: "https://near.com/?utm_source=near-intents",
  target: "_blank",
  rel: "noopener noreferrer",
}

const NearComPromo = () => {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  if (whitelabelTemplate !== "near-intents") return null

  const openMigrationGuide = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== "undefined" && typeof window.Beacon === "function") {
      e.preventDefault()
      window.Beacon("article", MIGRATION_ARTICLE_ID, { type: "sidebar" })
    }
    // else: let the browser follow the href (opens article in a new tab)
  }

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
          — better app, same team. This site still works for now, but will be
          phased out. We encourage you to migrate soon.
        </p>
        <a
          href={MIGRATION_ARTICLE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={openMigrationGuide}
          className="inline-flex items-center gap-1 mt-4 bg-white text-gray-900 px-4 rounded-xl py-3 -tracking-[0.01em]"
        >
          <span className="text-sm/4 font-semibold">Learn how to migrate</span>
          <ChevronRightIcon className="size-4 shrink-0" />
        </a>
      </div>
    </div>
  )
}

export default NearComPromo
