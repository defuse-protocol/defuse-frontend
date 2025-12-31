import {} from "@heroicons/react/16/solid"
import { NavbarDesktop } from "@src/components/Navbar/NavbarDesktop"
import UserMenu from "@src/components/UserMenu"
import ConnectWallet from "@src/components/Wallet"
import type { ReactNode } from "react"

const DashboardLayout = ({ children }: { children: ReactNode }) => (
  <div className="relative isolate flex min-h-svh w-full bg-gray-25 lg:bg-gray-800">
    {/* Sidebar on desktop */}
    <div className="fixed inset-y-0 left-0 w-72 max-lg:hidden py-6 px-4">
      <UserMenu />

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
