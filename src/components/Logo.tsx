import Image from "next/image"
import Link from "next/link"

import { Navigation } from "@src/constants/routes"

const Logo = () => {
  return (
    <Link href={Navigation.HOME}>
      <Image
        src="/static/icons/solswap.svg"
        alt="Near Intent Logo"
        width={175}
        height={32}
        className="hidden dark:block"
      />
      <Image
        src="/static/icons/solswap.svg"
        alt="Near Intent Logo"
        width={175}
        height={32}
        className="dark:hidden"
      />
    </Link>
  )
}

export default Logo
