"use client"

import { useIsActiveLink } from "@src/hooks/useIsActiveLink"
import {
  AccountIcon,
  ContactsIcon,
  DealsIcon,
  EarnIcon,
  HistoryIcon,
  SwapIcon,
} from "@src/icons"
import { cn } from "@src/utils/cn"
import Link from "next/link"
import type { ComponentType } from "react"

export type NavItemType = {
  label: string
  href: string
  showInTabs?: boolean
  icon: ComponentType<React.SVGProps<SVGSVGElement>>
  shortLabel?: string
}

export const navItems: NavItemType[] = [
  {
    label: "Account",
    href: "/account",
    icon: AccountIcon,
    showInTabs: true,
  },
  {
    label: "Swap",
    href: "/swap",
    icon: SwapIcon,
    showInTabs: true,
  },
  {
    label: "Earn",
    href: "/earn",
    icon: EarnIcon,
  },
  {
    label: "Private deals",
    shortLabel: "Deals",
    href: "/deals",
    icon: DealsIcon,
    showInTabs: true,
  },
  {
    label: "History",
    href: "/history",
    icon: HistoryIcon,
    showInTabs: true,
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

function NavItem({ label, href, icon: Icon }: NavItemType) {
  const { isActive } = useIsActiveLink()

  return (
    <Link
      href={href}
      key={label}
      className={cn(
        "flex items-center gap-4 py-4 px-3.5 rounded-2xl",
        isActive(href)
          ? "text-sidebar-fg bg-sidebar-active"
          : "text-sidebar-muted hover:text-sidebar-fg hover:bg-sidebar-hover"
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span className="text-base/5 font-semibold">{label}</span>
    </Link>
  )
}
