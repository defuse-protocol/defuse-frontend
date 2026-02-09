"use client"

import { useIsActiveLink } from "@src/hooks/useIsActiveLink"
import { MoreMenuIcon } from "@src/icons"
import clsx from "clsx"
import Link from "next/link"
import { DropdownMenu } from "radix-ui"
import type { NavItemType } from "./NavbarDesktop"
import { useVisibleNavItems } from "./NavbarDesktop"

const NavItem = ({
  label,
  shortLabel,
  href,
  icon: Icon,
  isActive,
}: NavItemType & { isActive: boolean }) => {
  return (
    <Link
      href={href}
      className={clsx(
        "group flex flex-col items-center justify-center py-3.5 focus-visible:outline-hidden",
        isActive ? "text-brand" : "text-gray-400"
      )}
    >
      <Icon className="size-4.5 shrink-0" />
      <span className="text-xs/none font-semibold mt-1.5">
        {shortLabel ?? label}
      </span>
    </Link>
  )
}

export function NavbarMobile() {
  const { isActive } = useIsActiveLink()

  const visibleItems = useVisibleNavItems()
  const tabItems = visibleItems.filter((item) => item.showInTabs)
  const restItems = visibleItems.filter((item) => !item.showInTabs)

  const showMore = restItems.length > 0
  const itemsAmount = tabItems.length + (showMore ? 1 : 0)

  return (
    <nav className="flex items-center justify-center lg:hidden sticky bottom-0 z-20 px-4 sm:px-6 bg-white border-t border-gray-200 pb-safe">
      <div
        className="grid max-w-[464px] w-full"
        style={{
          gridTemplateColumns: `repeat(${itemsAmount}, minmax(0, 1fr))`,
        }}
      >
        {tabItems.map((item) => (
          <NavItem key={item.label} {...item} isActive={isActive(item.href)} />
        ))}

        {showMore && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="group flex flex-col items-center justify-center py-3.5 text-gray-400 focus-visible:outline-hidden data-[state=open]:text-brand">
              <MoreMenuIcon className="size-4.5 shrink-0" />
              <span className="text-xs/none font-semibold mt-1.5">More</span>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                side="top"
                align="end"
                sideOffset={2}
                className={clsx(
                  "bg-white rounded-2xl shadow-xl p-1.5 space-y-1 min-w-36 origin-bottom-right duration-100 ring-1 ring-gray-900/10",

                  "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2 fade-in data-[state=open]:ease-out data-[state=open]:zoom-in-97",

                  "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-2 fade-out data-[state=closed]:ease-in data-[state=closed]:zoom-out-97"
                )}
              >
                <DropdownMenu.Arrow className="mt-1 fill-white" />
                {restItems.map(({ label, href, icon: Icon }) => (
                  <DropdownMenu.Item key={label} asChild>
                    <Link
                      href={href}
                      className={clsx(
                        "group flex items-center gap-2.5 py-2.5 px-3 rounded-xl",
                        isActive(href)
                          ? "text-gray-600 bg-gray-100"
                          : "text-gray-500"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="text-sm font-semibold">{label}</span>
                    </Link>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>
    </nav>
  )
}
