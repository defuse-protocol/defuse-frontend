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
        "group flex flex-col gap-1.5 items-center justify-center py-3 focus-visible:outline-hidden",
        isActive ? "text-brand" : "text-fg-tertiary"
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span className="text-xs/none font-semibold">{shortLabel ?? label}</span>
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
    <nav className="flex items-center justify-center lg:hidden sticky bottom-0 z-20 px-4 sm:px-6 bg-surface-card border-t border-border pb-safe">
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
            <DropdownMenu.Trigger className="group flex flex-col gap-1.5 items-center justify-center py-3 text-fg-tertiary focus-visible:outline-hidden data-[state=open]:text-brand">
              <MoreMenuIcon className="size-5 shrink-0" />
              <span className="text-xs/none font-semibold">More</span>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                side="top"
                align="end"
                sideOffset={2}
                className={clsx(
                  "bg-surface-overlay rounded-2xl shadow-xl p-1.5 space-y-1 min-w-36 origin-bottom-right duration-100 ring-1 ring-fg/10",

                  "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2 fade-in data-[state=open]:ease-out data-[state=open]:zoom-in-97",

                  "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-2 fade-out data-[state=closed]:ease-in data-[state=closed]:zoom-out-97"
                )}
              >
                <DropdownMenu.Arrow className="mt-1 fill-surface-overlay" />
                {restItems.map(({ label, href, icon: Icon }) => (
                  <DropdownMenu.Item key={label} asChild>
                    <Link
                      href={href}
                      className={clsx(
                        "group flex items-center gap-2.5 py-2.5 px-3 rounded-xl",
                        isActive(href)
                          ? "text-fg bg-surface-active"
                          : "text-fg-secondary"
                      )}
                    >
                      <Icon className="size-5 shrink-0" />
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
