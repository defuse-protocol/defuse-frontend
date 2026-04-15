import { useContext, useEffect, useState } from "react"

import { ChevronRightIcon } from "@radix-ui/react-icons"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import NearBadge from "../../public/static/icons/near-badge.svg"

const MIGRATION_ARTICLE_ID = "69de575cfe9deda3e8da017c"
const MIGRATION_ARTICLE_URL =
  "https://near-intents-app.helpscoutdocs.com/article/257-migration-from-near-intents-to-nearcom"

const NEAR_COM_URL = "https://near.com/?utm_source=near-intents"

type NearComPromoVariant = "wallet" | "passkey" | "anonymous"

function getNearComPromoVariant(
  chainType: ChainType | undefined
): NearComPromoVariant {
  if (chainType === undefined) return "anonymous"
  if (chainType === ChainType.WebAuthn) return "passkey"
  return "wallet"
}

const NearComLink = () => (
  <a
    href={NEAR_COM_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="text-white underline"
  >
    near.com
  </a>
)

const NearComPromo = () => {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  if (whitelabelTemplate !== "near-intents") return null

  return <NearComPromoContent />
}

const NearComPromoContent = () => {
  const { state } = useConnectWallet()
  const [isHydrated, setIsHydrated] = useState(false)
  useEffect(() => setIsHydrated(true), [])

  const variant = isHydrated
    ? getNearComPromoVariant(state.chainType)
    : "anonymous"

  const openMigrationGuide = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window === "undefined") return
    const beacon = window.Beacon
    if (typeof beacon !== "function") return

    // HelpScout installs a queueing stub (see Helpscout.tsx) before the
    // real SDK finishes loading. The stub is a function with `readyQueue`
    // as an array; the loaded SDK replaces the stub entirely and does not
    // expose `readyQueue`. If we still see the stub here, the real SDK
    // isn't ready (still loading, blocked by an extension, or failed),
    // so skip preventDefault and let the <a href> navigate as a fallback.
    const stubQueue = (beacon as unknown as { readyQueue?: unknown[] })
      .readyQueue
    if (Array.isArray(stubQueue)) return

    e.preventDefault()
    beacon("article", MIGRATION_ARTICLE_ID, { type: "sidebar" })
  }

  const body =
    variant === "wallet" ? (
      <>
        Your wallet works at <NearComLink /> — just reconnect there. Nothing to
        move, nothing to migrate. This site will soon be retired.
      </>
    ) : variant === "passkey" ? (
      <>
        Because you signed up with a passkey, you’ll need a new account at{" "}
        <NearComLink /> and we’ll help you move your funds. This site will soon
        be retired.
      </>
    ) : (
      <>
        The NEAR Intents consumer app has a new home at <NearComLink />. Most
        users just need to reconnect their wallet there — nothing to migrate.
        This site will soon be retired.
      </>
    )

  const cta =
    variant === "passkey" ? (
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
    ) : (
      <a
        href={NEAR_COM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 mt-4 bg-white text-gray-900 px-4 rounded-xl py-3 -tracking-[0.01em]"
      >
        <span className="text-sm/4 font-semibold">Open near.com</span>
        <ChevronRightIcon className="size-4 shrink-0" />
      </a>
    )

  const secondary =
    variant === "anonymous" ? (
      <p className="text-gray-500 text-xs font-medium mt-3">
        Signed up with a passkey?{" "}
        <a
          href={MIGRATION_ARTICLE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={openMigrationGuide}
          className="text-gray-300 underline"
        >
          Read the migration guide
        </a>
        .
      </p>
    ) : null

  return (
    <div className="widget-container mx-auto mt-5 md:mt-8 px-3 sm:px-0 md:-mb-4">
      <div className="rounded-3xl bg-gray-900 p-4 sm:p-5 pt-4 dark:bg-gray-950 outline outline-white/5">
        <div className="flex items-center gap-3">
          <NearBadge aria-hidden="true" className="size-6 shrink-0" />
          <h2 className="text-white text-lg/6 font-semibold -tracking-[0.01em]">
            We’ve moved to near.com
          </h2>
        </div>
        <p className="text-gray-400 text-sm font-medium mt-3">{body}</p>
        {cta}
        {secondary}
      </div>
    </div>
  )
}

export default NearComPromo
