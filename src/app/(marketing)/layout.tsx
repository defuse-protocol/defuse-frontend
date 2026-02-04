import { CommandLineIcon } from "@heroicons/react/16/solid"
import { getCachedSystemStatus } from "@src/actions/systemStatus"
import Button from "@src/components/Button"
import PreviewBanner from "@src/components/PreviewBanner"
import SystemStatus from "@src/components/SystemStatus"
import {
  DiscordIcon,
  NearIntentsLogoIcon,
  NearLogoIcon,
  TwitterIcon,
} from "@src/icons"
import { SystemStatusProvider } from "@src/providers/SystemStatusProvider"
import Link from "next/link"
import type { ReactNode } from "react"

const socialLinks = [
  {
    name: "X.com",
    icon: TwitterIcon,
    link: "https://x.com/near_intents",
  },
  {
    name: "Discord",
    icon: DiscordIcon,
    link: "https://discord.gg/nearprotocol",
  },
  {
    name: "Docs",
    icon: CommandLineIcon,
    link: "https://docs.near-intents.org",
  },
]

const additionalLinks = [
  {
    name: "Terms",
    link: "/terms",
  },
  {
    name: "Privacy",
    link: "/privacy",
  },
]

const MarketingRootLayout = async ({
  children,
}: Readonly<{
  children?: ReactNode
}>) => {
  const systemStatus = await getCachedSystemStatus()

  return (
    <SystemStatusProvider systemStatus={systemStatus}>
      <div className="p-2 flex flex-col bg-gray-800 min-h-screen">
        <PreviewBanner className="mb-2" />
        <SystemStatus className="mb-2" showOperationalStatus={false} />

        <header className="bg-white rounded-t-3xl flex justify-center items-center py-5">
          <div className="flex items-center justify-between w-full max-w-5xl px-4">
            <Link href="/" className="shrink-0">
              <span className="sr-only">Home</span>
              <NearIntentsLogoIcon className="h-4 text-black" />
            </Link>
            <Button href="/login">Sign up or Sign in</Button>
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          {children}
          <div className="grow bg-white" />
        </main>

        <footer className="bg-white pb-12 md:pb-16 flex justify-center items-center rounded-b-3xl">
          <div className="flex w-full flex-col px-4 max-w-5xl">
            <div className="pt-12 md:pt-16">
              <div className="flex flex-col md:flex-row items-center justify-between pb-8 gap-x-4 gap-y-6">
                <NearIntentsLogoIcon className="h-4 shrink-0 text-black" />

                <div className="flex items-center justify-end gap-2">
                  {socialLinks.map(({ name, icon: Icon, link }) => (
                    <Button
                      key={name}
                      variant="secondary"
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon className="size-4 shrink-0" />
                      {name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-8">
                <div className="flex items-center justify-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1.5 border border-gray-200">
                  <span className="text-gray-900 text-xs/none font-semibold">
                    Powered by
                  </span>
                  <span className="sr-only">Near</span>
                  <NearLogoIcon className="h-3 shrink-0" aria-hidden />
                </div>
                <div className="flex items-center justify-end gap-4">
                  {additionalLinks.map(({ name, link }) => (
                    <Link
                      key={name}
                      href={link}
                      className="text-sm/5 font-medium text-gray-500 hover:underline hover:text-gray-900"
                    >
                      {name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </SystemStatusProvider>
  )
}

export default MarketingRootLayout
