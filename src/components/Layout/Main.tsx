import { type PropsWithChildren, useContext } from "react"

import { LegacyBtcNotice } from "@src/components/LegacyBtcNotice"
import { NearComRetirementCard } from "@src/components/NearComPromo"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import NearComPromo from "../NearComPromo"
import { useNearComPromoState } from "../useNearComPromoState"

const Main = ({ children }: PropsWithChildren) => {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)
  const { variant } = useNearComPromoState()

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

  if (whitelabelTemplate === "near-intents" && variant === "anonymous") {
    return (
      <main className="flex md:flex-1 items-start justify-center px-4 py-16 md:py-24">
        <NearComRetirementCard />
      </main>
    )
  }

  return (
    <>
      <NearComPromo />
      <LegacyBtcNotice />
      <main className="flex md:flex-1">{children}</main>
    </>
  )
}

export default Main
