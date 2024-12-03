import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import Image from "next/image"
import { type PropsWithChildren, useContext } from "react"

const Main = ({ children }: PropsWithChildren) => {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  if (whitelabelTemplate === "turboswap") {
    return (
      <main className="flex md:flex-1 mx-auto">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-center lg:justify-between">
          <div className="w-full lg:w-1/2 space-y-4">{children}</div>
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end mt-8 lg:mt-0">
            <Image
              src="/static/templates/turboswap/coin-frog.png"
              alt="Turboswap Frog"
              loading="lazy"
              width={620}
              height={620}
              className="object-contain"
            />
          </div>
        </div>
      </main>
    )
  }

  return <main className="flex md:flex-1">{children}</main>
}

export default Main
