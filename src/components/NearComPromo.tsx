import { useContext } from "react"

import { Key, Wallet } from "@phosphor-icons/react"
import { ChevronRightIcon } from "@radix-ui/react-icons"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import NearBadge from "../../public/static/icons/near-badge.svg"
import { useNearComPromoState } from "./useNearComPromoState"

const MIGRATION_ARTICLE_ID = "69de575cfe9deda3e8da017c"
const MIGRATION_ARTICLE_URL =
  "https://near-intents-app.helpscoutdocs.com/article/257-migration-from-near-intents-to-nearcom"

const NEAR_COM_URL = "https://near.com/?utm_source=near-intents"
const BEACON_CONTACT_ROUTE = "/ask/message/"

const NearComLink = () => (
  <a
    href={NEAR_COM_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="text-inherit underline"
  >
    near.com
  </a>
)

const isBeaconLoadingStub = (beacon: Window["Beacon"]) => {
  const stubQueue = (beacon as unknown as { readyQueue?: unknown[] }).readyQueue
  return Array.isArray(stubQueue)
}

const openBeaconContactForm = () => {
  if (typeof window === "undefined") return
  const beacon = window.Beacon
  if (typeof beacon !== "function") return
  if (isBeaconLoadingStub(beacon)) return

  beacon("open")
  beacon("navigate", BEACON_CONTACT_ROUTE)
}

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
  if (isBeaconLoadingStub(beacon)) return

  e.preventDefault()
  beacon("article", MIGRATION_ARTICLE_ID, { type: "sidebar" })
}

export const NearComRetirementCard = () => {
  const intro = (
    <>
      NEAR Intents has moved to <NearComLink />. Same technology by the same
      team, now in a better app, including confidential swaps.
    </>
  )

  return (
    <section className="w-full max-w-[560px] rounded-[32px] border border-gray-a4 bg-white p-6 shadow-lg sm:p-8 dark:border-gray-a5 dark:bg-black-950">
      <div className="flex items-center gap-3">
        <NearBadge aria-hidden="true" className="size-7 shrink-0" />
        <h2
          id="near-com-retirement-title"
          className="text-gray-12 text-2xl/8 font-bold"
        >
          NEAR Intents has moved
        </h2>
      </div>
      <p className="mt-5 text-gray-11 text-base/7 font-medium">{intro}</p>

      <p className="mt-4 text-gray-11 text-base/7 font-medium">
        <strong className="font-bold">
          This website will be decommissioned on June 1, 2026
        </strong>
        . Please move or migrate before then.
      </p>
      <div className="mt-6">
        <h3 className="text-gray-12 text-lg/6 font-bold">How do I switch?</h3>
        <div className="mt-4 grid gap-4">
          <div className="rounded-2xl bg-gray-2 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-gray-12">
                <Wallet className="size-5" weight="bold" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-gray-12 text-sm/5 font-bold">
                  Using a wallet?
                </h4>
                <p className="mt-1 text-gray-11 text-sm/6 font-medium">
                  There is nothing to move or migrate. Connect the same wallet
                  at near.com to keep swapping with NEAR Intents.
                </p>
              </div>
            </div>
            <a
              href={NEAR_COM_URL}
              className="mt-3 flex items-center justify-end gap-1 text-right text-gray-12 text-sm/6 font-semibold underline-offset-2 hover:underline"
            >
              <span>Open near.com</span>
              <ChevronRightIcon className="size-4 shrink-0" />
            </a>
          </div>
          <div className="rounded-2xl bg-gray-2 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-gray-12">
                <Key className="size-5" weight="bold" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-gray-12 text-sm/5 font-bold">
                  Using a passkey?
                </h4>
                <p className="mt-1 text-gray-11 text-sm/6 font-medium">
                  Passkey accounts need to migrate because passkeys are
                  domain-specific.
                </p>
              </div>
            </div>
            <a
              href={MIGRATION_ARTICLE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={openMigrationGuide}
              className="mt-3 flex items-center justify-end gap-1 text-right text-gray-12 text-sm/6 font-semibold underline-offset-2 hover:underline"
            >
              <span>Read the migration guide</span>
              <ChevronRightIcon className="size-4 shrink-0" />
            </a>
          </div>
        </div>
      </div>
      <p className="mt-5 text-gray-10 text-xs/5 font-medium">
        Questions?{" "}
        <button
          type="button"
          onClick={openBeaconContactForm}
          className="text-gray-11 underline"
        >
          Click here to contact support
        </button>
        .
      </p>
    </section>
  )
}

const NearComPromo = () => {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)
  const { variant } = useNearComPromoState()

  if (whitelabelTemplate !== "near-intents") {
    return null
  }

  const body =
    variant === "passkey" ? (
      <>
        Because you signed up with a passkey, you’ll need a new account at{" "}
        <NearComLink /> and we’ll help you move your funds. This website will be
        decommissioned on June 1, 2026.
      </>
    ) : variant === "wallet" ? (
      <>
        This website will be decommissioned on June 1, 2026. Your wallet already
        works at <NearComLink /> — there is nothing to move or migrate. Connect
        the same wallet there when you’re ready.
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
