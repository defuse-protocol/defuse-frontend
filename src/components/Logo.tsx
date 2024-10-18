import Image from "next/image"
import Link from "next/link"

import { Navigation } from "@src/constants/routes"

const Logo = () => {
  return (
    <Link href={Navigation.HOME}>
      <Image
        src="/static/icons/Logo_Near_Intent.svg"
        alt="Near Intent Logo"
        width={175}
        height={32}
        className="hidden dark:block"
      />
      <Image
        src="/static/icons/Logo_Near_Intent_dark.svg"
        alt="Near Intent Logo"
        width={175}
        height={32}
        className="dark:hidden"
      />
    </Link>
  )
}

export default Logo
