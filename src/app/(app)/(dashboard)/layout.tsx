import ActivityDock from "@src/components/ActivityDock"
import { AuthGuard } from "@src/components/AuthGuard"
import { NavbarDesktop } from "@src/components/Navbar/NavbarDesktop"
import NetworkOutageNotification from "@src/components/NetworkOutageNotification"
import SystemStatus from "@src/components/SystemStatus"
import UserMenu from "@src/components/UserMenu"
import { NearIntentsLogoIcon, NearIntentsLogoSymbolIcon } from "@src/icons"
import Link from "next/link"
import type { ReactNode } from "react"

const DashboardLayout = ({ children }: { children: ReactNode }) => (
  <AuthGuard>
    <div className="relative isolate flex min-h-svh w-full bg-gray-25 lg:bg-gray-800">
      {/* Sidebar on desktop */}
      <div className="fixed inset-y-0 left-0 w-74 max-lg:hidden py-5 px-4 flex flex-col">
        <div className="absolute size-64 -bottom-32 -left-32 rounded-full bg-brand/80 blur-[150px] pointer-events-none" />

        <Link
          href="/"
          className="relative group flex items-center gap-4 rounded-2xl px-3.5 py-3.5 bg-gray-900 hover:bg-gray-950"
        >
          <NearIntentsLogoSymbolIcon className="h-6 shrink-0" />
          <NearIntentsLogoIcon className="h-3 shrink-0 text-white" />
        </Link>

        <div className="my-5 -mx-4 border-t border-white/10" />

        <NavbarDesktop />

        <ActivityDock />

        <UserMenu />
      </div>

      {/* Content */}
      <main className="flex flex-1 flex-col pb-2 lg:min-w-0 lg:pt-2 lg:pr-2 lg:pl-74 gap-2">
        <SystemStatus showOperationalStatus={false} />
        <NetworkOutageNotification />

        <div className="relative grow p-6 lg:rounded-3xl lg:bg-gray-25 lg:p-10">
          <div className="mx-auto max-w-[464px]">{children}</div>
        </div>
      </main>
    </div>
  </AuthGuard>
)

export default DashboardLayout
