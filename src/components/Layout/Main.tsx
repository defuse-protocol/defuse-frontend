import { type PropsWithChildren, useContext } from "react"

import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"

const Main = ({ children }: PropsWithChildren) => {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  if (whitelabelTemplate === "turboswap") {
    return (
      <main className="flex-1 w-full max-w-[1280px] mx-auto md:p-12">
        <div className="flex justify-center lg:justify-end lg:w-1/2">
          <div className="w-[480px] max-w-full">{children}</div>
        </div>
      </main>
    )
  }

  return <main className="flex md:flex-1">{children}</main>
}

export default Main
