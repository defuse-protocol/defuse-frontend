import { Cog8ToothIcon } from "@heroicons/react/16/solid"
import { UserIcon } from "@heroicons/react/24/solid"
import { NavbarDesktop } from "@src/components/Navbar/NavbarDesktop"
import ConnectWallet from "@src/components/Wallet"
import clsx from "clsx"
import Link from "next/link"
import { DropdownMenu } from "radix-ui"
import type { ReactNode } from "react"

const DashboardLayout = ({ children }: { children: ReactNode }) => (
  <div className="relative isolate flex min-h-svh w-full bg-gray-25 lg:bg-gray-800">
    {/* Sidebar on desktop */}
    <div className="fixed inset-y-0 left-0 w-72 max-lg:hidden py-6 px-4">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="bg-gray-900 rounded-2xl p-2 flex items-center gap-3 w-full">
          <div className="size-8 flex items-center justify-center bg-orange-500 rounded-lg">
            <UserIcon className="text-orange-100 size-5" />
          </div>

          <div className="text-gray-400 text-sm font-medium">@username123</div>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={8}
            className={clsx(
              "min-w-64 flex flex-col rounded-2xl p-2 isolate bg-white outline outline-transparent focus:outline-hidden shadow-lg ring-1 ring-gray-900/10",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:duration-100 data-[state=closed]:ease-in"
            )}
          >
            <DropdownMenu.Item asChild>
              <Link
                href="/settings"
                className="group rounded-xl focus:outline-hidden focus:bg-gray-100 focus:text-gray-900 px-3 py-2.5 text-left text-sm text-gray-700 flex items-center gap-2 hover:bg-gray-100 hover:text-gray-900 font-medium"
              >
                <Cog8ToothIcon className="size-4 text-gray-500 group-hover:text-gray-600 group-focus:text-gray-600" />
                Settings
              </Link>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <div className="my-6 border-t border-gray-700" />

      <NavbarDesktop />
      <ConnectWallet />
    </div>

    {/* Content */}
    <main className="flex flex-1 flex-col pb-2 lg:min-w-0 lg:pt-2 lg:pr-2 lg:pl-72">
      <div className="grow p-6 lg:rounded-3xl lg:bg-gray-25 lg:p-10">
        <div className="mx-auto max-w-[464px]">{children}</div>
      </div>
    </main>
  </div>
)

export default DashboardLayout
