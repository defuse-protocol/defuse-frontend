import Image from "next/image"
import Link from "next/link"

import { navigation } from "@src/constants/routes"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import { useContext } from "react"

const Logo = () => {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  if (whitelabelTemplate === "solswap") {
    return (
      <Link href={navigation.home}>
        <Image
          src="/static/templates/solswap/logo.svg"
          alt="Solswap Logo"
          width={100}
          height={32}
          className="hidden dark:block"
        />
        <Image
          src="/static/templates/solswap/logo.svg"
          alt="Solswap Logo"
          width={100}
          height={32}
          className="dark:hidden"
        />
      </Link>
    )
  }

  if (whitelabelTemplate === "turboswap") {
    return (
      <Link href={navigation.home}>
        <Image
          src="/static/templates/turboswap/logo.svg"
          alt="Turboswap Logo"
          width={120}
          height={32}
          className="hidden dark:block"
        />
        <Image
          src="/static/templates/turboswap/logo.svg"
          alt="Turboswap Logo"
          width={120}
          height={32}
          className="dark:hidden"
        />
      </Link>
    )
  }

  if (whitelabelTemplate === "dogecoinswap") {
    return (
      <Link href={navigation.home}>
        <Image
          src="/static/templates/dogecoinswap/logo.svg"
          alt="Dogecoinswap Logo"
          width={118}
          height={32}
          className="hidden dark:block"
        />
        <Image
          src="/static/templates/dogecoinswap/logo.svg"
          alt="Dogecoinswap Logo"
          width={118}
          height={32}
          className="dark:hidden"
        />
      </Link>
    )
  }

  if (whitelabelTemplate === "trumpswap") {
    return (
      <Link href={navigation.home}>
        <Image
          src="/static/templates/trumpswap/logo.svg"
          alt="TrumpSwap Logo"
          width={126}
          height={32}
          className="hidden dark:block"
        />
        <Image
          src="/static/templates/trumpswap/logo.svg"
          alt="TrumpSwap Logo"
          width={126}
          height={32}
          className="dark:hidden"
        />
      </Link>
    )
  }

  return (
    <Link href={navigation.home}>
      <Image
        src="/static/templates/near-intents/logo.svg"
        alt="Near Intent Logo"
        width={125}
        height={32}
        className="hidden dark:block"
      />
      <Image
        src="/static/templates/near-intents/logo.svg"
        alt="Near Intent Logo"
        width={125}
        height={32}
        className="dark:hidden"
      />
    </Link>
  )
}

export default Logo
