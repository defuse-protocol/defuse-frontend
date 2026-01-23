"use client"

import { useIsActiveLink } from "@src/hooks/useIsActiveLink"
import {
  AccountIcon,
  ActivityIcon,
  ContactsIcon,
  DealsIcon,
  EarnIcon,
  SwapIcon,
} from "@src/icons"
import { cn } from "@src/utils/cn"
import Link from "next/link"
import type { ComponentType } from "react"

const navItems = [
  {
    label: "Account",
    href: "/account",
    icon: AccountIcon,
  },
  {
    label: "Swap",
    href: "/swap",
    icon: SwapIcon,
  },
  {
    label: "Earn",
    href: "/earn",
    icon: EarnIcon,
  },
  {
    label: "Private trades",
    href: "/deals",
    icon: DealsIcon,
  },
  {
    label: "Activity",
    href: "/activity",
    icon: ActivityIcon,
  },
  {
    label: "Contacts",
    href: "/contacts",
    icon: ContactsIcon,
  },
]

export function NavbarDesktop() {
  return (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <NavItem key={item.label} {...item} />
      ))}
    </nav>
  )
}

function NavItem({
  label,
  href,
  dataTestId,
  icon: Icon,
}: {
  label: string
  href: string
  dataTestId?: string
  icon: ComponentType<React.SVGProps<SVGSVGElement>>
}) {
  const { isActive } = useIsActiveLink()

  return (
    <Link
      href={href}
      key={label}
      data-testid={dataTestId}
      className={cn(
        "flex items-center gap-4 py-4 px-3.5 rounded-2xl",
        isActive(href)
          ? "text-white bg-gray-700"
          : "text-gray-400 hover:text-white hover:bg-gray-700"
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span className="text-base/5 font-semibold">{label}</span>
    </Link>
  )
}
