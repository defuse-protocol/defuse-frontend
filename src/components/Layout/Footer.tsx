import Image from "next/image"
import { useContext } from "react"

import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"

const Footer = () => {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  if (whitelabelTemplate === "solswap") {
    return (
      <footer className="w-full flex justify-center items-center py-7">
        <div className="flex justify-center items-center text-sm text-secondary gap-1.5 bg-white px-3 py-1.5 rounded-full dark:bg-gray-700 dark:text-white">
          <span>Built by</span>
          <Image
            src="/static/logos/blockchain-strips/near.svg"
            width={60}
            height={20}
            alt="Near logo"
          />
          <span>with love for</span>
          <Image
            src="/static/logos/blockchain-strips/solana.svg"
            width={68}
            height={20}
            alt="Solana logo"
          />
        </div>
      </footer>
    )
  }

  if (whitelabelTemplate === "turboswap") {
    return null
  }

  if (whitelabelTemplate === "dogecoinswap") {
    return (
      <footer className="w-full flex justify-center items-center py-7">
        <div className="flex justify-center items-center text-sm text-secondary gap-1.5 bg-white px-3 py-1.5 rounded-full dark:bg-gray-700 dark:text-white">
          <span>Built by</span>
          <Image
            src="/static/logos/blockchain-strips/near.svg"
            width={60}
            height={20}
            alt="Near logo"
          />
          <span>with love for</span>
          <Image
            src="/static/logos/blockchain-strips/dogecoin.svg"
            width={86}
            height={20}
            alt="Dogecoin logo"
          />
        </div>
      </footer>
    )
  }

  return (
    <footer className="w-full flex justify-center items-center py-7">
      <div className="flex justify-center items-center text-sm text-secondary gap-1.5 bg-white px-3 py-1.5 rounded-full dark:bg-gray-700 dark:text-white">
        <span>Powered by</span>
        <Image
          src="/static/logos/blockchain-strips/near.svg"
          width={60}
          height={20}
          alt="Near logo"
        />
      </div>
    </footer>
  )
}

export default Footer
