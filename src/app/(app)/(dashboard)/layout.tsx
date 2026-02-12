import ActivityDock from "@src/components/ActivityDock"
import MobileTopBar from "@src/components/MobileTopBar"
import { NavbarDesktop } from "@src/components/Navbar/NavbarDesktop"
import { NavbarMobile } from "@src/components/Navbar/NavbarMobile"
import NetworkOutageNotification from "@src/components/NetworkOutageNotification"
import PreviewBanner from "@src/components/PreviewBanner"
import SystemStatus from "@src/components/SystemStatus"
import UserMenu from "@src/components/UserMenu"
import { NearIntentsLogoIcon, NearIntentsLogoSymbolIcon } from "@src/icons"
import Link from "next/link"
import type { ReactNode } from "react"

const DashboardLayout = ({ children }: { children: ReactNode }) => (
  <div className="relative isolate flex min-h-svh w-full bg-gray-800">
    {/* Sidebar on desktop */}
    <div className="fixed z-10 inset-y-0 left-0 w-74 max-lg:hidden py-5 px-4 flex flex-col">
      <div className="absolute size-64 -bottom-32 -left-32 rounded-full bg-green-500/50 blur-[150px] pointer-events-none" />

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

      <div className="relative mt-5 flex flex-col gap-3">
        <SystemStatus showOperationalStatus={false} />
        <UserMenu variant="desktop" />
      </div>
    </div>

    {/* Content */}
    <div className="relative flex flex-1 flex-col lg:min-w-0 lg:p-2 lg:pl-74">
      <div className="max-lg:pt-safe-offset-3 max-lg:px-4 max-lg:flex max-lg:flex-col max-lg:items-center max-lg:sticky max-lg:top-0 max-lg:z-20 max-lg:bg-gray-800">
        <div className="has-[>*]:pb-3 lg:has-[>*]:pb-2 space-y-2 max-lg:max-w-[464px] max-lg:mx-auto">
          <PreviewBanner />
          <NetworkOutageNotification />
        </div>

        <MobileTopBar />
      </div>

      <main className="relative grow px-4 py-6 sm:p-6 lg:rounded-3xl bg-gray-25 lg:p-10">
        <div className="mx-auto max-w-[464px]">{children}</div>
      </main>

      <NavbarMobile />
    </div>
  </div>
)

export default DashboardLayout
