"use client"

import ActivityDock from "@src/components/ActivityDock"
import { NavbarDesktop } from "@src/components/Navbar/NavbarDesktop"
import UserMenu from "@src/components/UserMenu"
import ConnectWallet from "@src/components/Wallet"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { state } = useConnectWallet()
  const authIdentifier = state.address ?? null
  const authMethod = state.chainType ?? null

  const tagsQuery = useQuery({
    queryKey: ["tags", authIdentifier, authMethod],
    queryFn: async () => {
      if (!authIdentifier || !authMethod) {
        return { tags: [] }
      }
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_identifier: authIdentifier,
          auth_method: authMethod,
        }),
      })
      if (!response.ok) {
        throw new Error("Failed to fetch tags")
      }
      return response.json() as Promise<{ tags: string[] }>
    },
    enabled: authIdentifier != null && authMethod != null,
  })

  const username = tagsQuery.data?.tags?.[0] ?? "@default"

  return (
    <div
      id="dashboard-layout"
      className="relative isolate flex min-h-svh w-full bg-gray-25 lg:bg-gray-800"
    >
      {/* Sidebar on desktop */}
      <div className="fixed inset-y-0 left-0 w-72 max-lg:hidden py-6 px-4 flex flex-col">
        <UserMenu username={username} />

        <div className="my-6 border-t border-gray-700" />

        <NavbarDesktop />
        <ConnectWallet />

        <ActivityDock />
      </div>

      {/* Content */}
      <main className="flex flex-1 flex-col pb-2 lg:min-w-0 lg:pt-2 lg:pr-2 lg:pl-72">
        <div className="grow p-6 lg:rounded-3xl lg:bg-gray-25 lg:p-10">
          <div className="mx-auto max-w-[464px]">{children}</div>
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
