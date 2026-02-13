import { DiscordIcon, DocsIcon, NearIcon, TwitterIcon } from "@src/icons"
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
    icon: DocsIcon,
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
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="max-w-[1064px] px-5 mx-auto w-full py-10">
        <NearIcon className="size-11 shrink-0 text-black rounded-lg" />
      </header>
      <main className="flex-1 flex flex-col">
        {children}
        <div className="grow bg-white" />
      </main>
      <footer className="bg-black px-10 py-24">
        <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            {socialLinks.map(({ name, icon: Icon, link }) => (
              <Link
                key={name}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="size-11 shrink-0 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-300"
              >
                <Icon className="size-5 shrink-0" />
                <span className="sr-only">{name}</span>
              </Link>
            ))}
          </div>
          <NearIcon className="size-11 shrink-0 text-black rounded-lg" />
          <div className="flex items-center gap-3">
            {additionalLinks.map(({ name, link }) => (
              <Link
                key={name}
                href={link}
                className="text-sm/5 font-semibold text-gray-400 hover:underline hover:text-gray-300"
              >
                {name}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default MarketingRootLayout
