import { type PropsWithChildren, useContext, useState } from "react"

import { ChevronRightIcon } from "@radix-ui/react-icons"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"

const Main = ({ children }: PropsWithChildren) => {
  const [showReadMore, setShowReadMore] = useState(false)
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  if (whitelabelTemplate === "turboswap") {
    return (
      <main className="flex-1 w-full max-w-[1280px] mx-auto md:pt-[10vh]">
        <div className="flex justify-center lg:justify-end lg:w-1/2">
          <div className="w-[480px] max-w-full">{children}</div>
        </div>
      </main>
    )
  }

  if (whitelabelTemplate === "trumpswap") {
    return (
      <main className="flex-1 w-full max-w-[1280px] mx-auto md:pt-[10vh]">
        <div className="flex justify-center lg:justify-end lg:w-1/2">
          <div className="w-[480px] max-w-full">{children}</div>
        </div>
      </main>
    )
  }

  return (
    <>
      <div className="widget-container mx-auto mt-12">
        <div className="rounded-3xl bg-gray-900 p-5 pt-4 dark:bg-gray-950 outline outline-white/5">
          <h2 className="text-white text-lg/5 font-semibold -tracking-[0.01em]">
            We’ve moved to near.com
          </h2>
          <p className="text-gray-400 text-sm font-medium mt-2">
            The NEAR Intents consumer website has moved to{" "}
            <a
              href="https://near.com"
              target="_blank"
              rel="noreferrer"
              className="text-white underline"
            >
              near.com
            </a>{" "}
            <br className="hidden sm:block" />— better app, same team, new home.
            {!showReadMore && (
              <button
                type="button"
                onClick={() => setShowReadMore(true)}
                className="text-white underline text-left inline-block ml-1"
              >
                Read more
              </button>
            )}
          </p>
          {showReadMore && (
            <p className="text-gray-400 text-sm font-medium mt-2">
              Head over to{" "}
              <a
                href="https://near.com"
                target="_blank"
                rel="noreferrer"
                className="text-white underline"
              >
                near.com
              </a>{" "}
              to get started. If you have an existing account here with funds,
              you can transfer them to your new account using NEAR Intents
              internal transfers (renamed near.com internal transfers).
            </p>
          )}
          <a
            href="https://near.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 mt-4 bg-white text-gray-900 px-4 rounded-xl py-3 -tracking-[0.01em]"
          >
            <span className="text-sm/4 font-semibold">Go to near.com</span>
            <ChevronRightIcon className="size-4 shrink-0" />
          </a>
        </div>
      </div>
      <main className="flex md:flex-1">{children}</main>
    </>
  )
}

export default Main
