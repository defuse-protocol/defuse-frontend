import Image from "next/image"
import Link from "next/link"

import { Navigation } from "@src/constants/routes"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import { useContext } from "react"

const Logo = () => {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  if (whitelabelTemplate === "solswap") {
    return (
      <Link href={Navigation.HOME}>
        <Image
          src="/static/icons/solswap.svg"
          alt="Solswap Logo"
          width={175}
          height={32}
          className="hidden dark:block"
        />
        <Image
          src="/static/icons/solswap.svg"
          alt="Solswap Logo"
          width={175}
          height={32}
          className="dark:hidden"
        />
      </Link>
    )
  }

  if (whitelabelTemplate === "dogecoinswap") {
    return (
      <Link href={Navigation.HOME}>
        <Image
          src="/static/templates/dogecoinswap/logo.svg"
          alt="Dogecoinswap Logo"
          width={175}
          height={32}
          className="hidden dark:block"
        />
        <Image
          src="/static/templates/dogecoinswap/logo.svg"
          alt="Dogecoinswap Logo"
          width={175}
          height={32}
          className="dark:hidden"
        />
      </Link>
    )
  }

  return (
    <Link href={Navigation.HOME}>
      <Image
        src="/static/icons/NearIntentsLOGO.svg"
        alt="Near Intent Logo"
        width={175}
        height={32}
        className="hidden dark:block"
      />
      <Image
        src="/static/icons/NearIntentsLOGO.svg"
        alt="Near Intent Logo"
        width={175}
        height={32}
        className="dark:hidden"
      />
    </Link>
  )
}

export default Logo
