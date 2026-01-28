import ActivityDock from "@src/components/ActivityDock"
import { NavbarDesktop } from "@src/components/Navbar/NavbarDesktop"
import NetworkOutageNotification from "@src/components/NetworkOutageNotification"
import SystemStatus from "@src/components/SystemStatus"
import UserMenu from "@src/components/UserMenu"
import { NearIntentsLogoIcon, NearIntentsLogoSymbolIcon } from "@src/icons"
import Link from "next/link"
import type { ReactNode } from "react"

const Divider = () => <div className="my-5 -mx-4 border-t border-gray-700" />

const DashboardLayout = ({ children }: { children: ReactNode }) => (
  <div className="relative isolate flex min-h-svh w-full bg-gray-25 lg:bg-gray-800">
    {/* Sidebar on desktop */}
    <div className="fixed inset-y-0 left-0 w-74 max-lg:hidden py-5 px-4 flex flex-col">
      <Link
        href="/"
        className="relative group flex items-center gap-4 rounded-2xl px-3.5 py-3 hover:bg-gray-700"
      >
        <NearIntentsLogoSymbolIcon className="h-5 shrink-0" />
        <NearIntentsLogoIcon className="h-3.5 shrink-0 text-white" />
      </Link>

      <Divider />

      <NavbarDesktop />

      <ActivityDock />

      <Divider />

      <UserMenu />
    </div>

    {/* Content */}
    <main className="flex flex-1 flex-col pb-2 lg:min-w-0 lg:pt-2 lg:pr-2 lg:pl-74 gap-2">
      <SystemStatus showOperationalStatus={false} />
      <NetworkOutageNotification />

      <div className="grow p-6 lg:rounded-3xl lg:bg-gray-25 lg:p-10">
        <div className="mx-auto max-w-[464px]">{children}</div>
      </div>
    </main>
  </div>
)

export default DashboardLayout
