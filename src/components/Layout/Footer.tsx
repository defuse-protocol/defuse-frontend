import Image from "next/image"
import { useContext } from "react"

import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import DogecoinLogo from "../../../public/static/logos/blockchain-strips/dogecoin.svg"
import NearLogo from "../../../public/static/logos/blockchain-strips/near.svg"
import SolanaLogo from "../../../public/static/logos/blockchain-strips/solana.svg"

const Footer = () => {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  if (whitelabelTemplate === "solswap") {
    return (
      <footer className="w-full flex justify-center items-center py-7">
        <div className="flex justify-center items-center text-sm font-medium text-white gap-1.5 bg-black/25 px-3 py-1.5 rounded-full">
          <span>Built by</span>
          <NearLogo />
          <span>with love for</span>
          <SolanaLogo />
        </div>
      </footer>
    )
  }

  if (whitelabelTemplate === "turboswap") {
    return null
  }

  if (whitelabelTemplate === "dogecoinswap") {
    return (
      <footer className="py-7">
        <div className=" flex justify-center items-center">
          <div className="flex justify-center items-center gap-1.5 text-sm font-medium bg-white dark:bg-black px-3 py-1.5 rounded-full">
            <span className="text-secondary">Built by</span>
            <NearLogo className="text-black dark:text-white" />
            <span className="text-secondary">with love for</span>
            <DogecoinLogo className="text-black dark:text-white" />
          </div>
        </div>

        <Image
          src="/static/templates/dogecoinswap/doge-bottom.png"
          alt=""
          loading="lazy"
          width={750}
          height={528}
          className="object-contain md:hidden"
        />
      </footer>
    )
  }

  return (
    <footer className="w-full flex justify-center items-center py-7">
      <div className="flex justify-center items-center gap-1.5 text-sm font-medium bg-white dark:bg-black px-3 py-1.5 rounded-full">
        <span className="text-secondary">Powered by</span>
        <NearLogo className="text-black dark:text-white" />
      </div>
    </footer>
  )
}

export default Footer
