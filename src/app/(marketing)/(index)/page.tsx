"use client"

import { ChevronDownIcon, CommandLineIcon } from "@heroicons/react/16/solid"
import {
  ArrowPathRoundedSquareIcon,
  ChartBarIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline"
import AnimatedTokenPath from "@src/components/AnimatedTokenPath"
import Button from "@src/components/Button"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { DiscordIcon, LogoIcon, NearLogoIcon, TwitterIcon } from "@src/icons"
import Link from "next/link"

const features = [
  {
    title: "Private deals",
    description: "Swap with someone else. No escrow or trust required.",
    longDescription:
      "Suspendisse maximus felis lacus, sit amet vehicula ante vehicula a. Suspendisse feugiat cursus massa.",
    icon: ArrowPathRoundedSquareIcon,
  },
  {
    title: "Earn",
    description: "Earn yield on idle assets.",
    longDescription:
      "Suspendisse maximus felis lacus, sit amet vehicula ante vehicula a. Suspendisse feugiat cursus massa.",
    icon: ChartBarIcon,
  },
  {
    title: "Shield",
    description: "Shield your activity",
    longDescription:
      "Suspendisse maximus felis lacus, sit amet vehicula ante vehicula a. Suspendisse feugiat cursus massa.",
    icon: ShieldCheckIcon,
  },
]

const socialLinks = [
  {
    name: "X.com",
    icon: TwitterIcon,
    link: "https://x.com/DefuseProtocol",
  },
  {
    name: "Discord",
    icon: DiscordIcon,
    link: "https://discord.gg/rdGAgDRs",
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

export default function Home() {
  return (
    <div className="p-1 flex flex-col bg-gray-800 min-h-screen">
      <header className="bg-white rounded-t-3xl flex justify-center items-center py-5">
        <div className="flex items-center justify-between w-full max-w-5xl px-4">
          <Link href="/" className="shrink-0">
            <span className="sr-only">Home</span>
            <LogoIcon className="h-4" />
          </Link>
          <Button href="/login">Log in</Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="flex flex-col items-center justify-center pt-16 pb-24 bg-white rounded-b-3xl overflow-hidden">
          <div className="flex flex-col items-center justify-center px-4 max-w-lg">
            <div className="text-[#FB4D01] text-sm/5 font-bold py-0.5 px-3 rounded-lg bg-[#FB4D01]/[0.07] text-center">
              Over $10 billion swapped
            </div>
            <h1 className="mt-6 text-5xl/none text-balance font-bold tracking-tight text-center">
              Swap nearly anything to anything.{" "}
              <span className="text-[#FB4D01]">And fast.</span>
            </h1>
          </div>

          <div className="relative z-10 mt-16 flex flex-col items-center justify-center px-4 max-w-md">
            <AnimatedTokenPath />
            <AnimatedTokenPath side="right" />

            <div className="relative z-10 bg-gray-100 rounded-[27px] p-2 border border-gray-200 flex flex-col gap-2">
              <div className="p-6 rounded-3xl bg-white border border-gray-200 flex flex-col gap-4">
                <label htmlFor="sell">Sell</label>
                <div className="flex items-center justify-between gap-4">
                  <input
                    id="sell"
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    autoComplete="off"
                    placeholder="0"
                    className="relative p-0 outline-hidden border-0 bg-transparent outline-none focus:ring-0 font-bold text-gray-900 text-4xl tracking-tight placeholder:text-gray-400 w-full"
                  />
                  <button
                    type="button"
                    className="rounded-full border border-gray-900/10 flex items-center gap-1.5 p-1 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-gray-900"
                  >
                    <AssetComboIcon
                      icon="https://s2.coinmarketcap.com/static/img/coins/128x128/1027.png"
                      sizeClassName="size-7"
                    />
                    <span className="flex items-center gap-1">
                      <span className="text-base text-gray-900 font-semibold leading-none">
                        ETH
                      </span>
                      <ChevronDownIcon className="size-4 text-gray-700" />
                    </span>
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-gray-200 flex flex-col gap-4">
                <label htmlFor="buy">Buy</label>
                <div className="flex items-center justify-between gap-4">
                  <input
                    id="buy"
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    autoComplete="off"
                    placeholder="0"
                    className="relative p-0 outline-hidden border-0 bg-transparent outline-none focus:ring-0 font-bold text-gray-900 text-4xl tracking-tight placeholder:text-gray-400 w-full"
                  />
                  <button
                    type="button"
                    className="rounded-full border border-gray-900/10 flex items-center gap-1.5 p-1 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-gray-900"
                  >
                    <AssetComboIcon
                      icon="https://s2.coinmarketcap.com/static/img/coins/128x128/3408.png"
                      sizeClassName="size-7"
                    />
                    <span className="flex items-center gap-1">
                      <span className="text-base text-gray-900 font-semibold leading-none">
                        ETH
                      </span>
                      <ChevronDownIcon className="size-4 text-gray-700" />
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <Button size="xl" fullWidth className="mt-4">
              Get started
            </Button>
          </div>
        </section>

        <section className="bg-gray-800 py-24 relative overflow-hidden">
          <div className="absolute size-128 rounded-full bg-[#FB4D01]/80 left-1/2 -translate-x-1/2 translate-y-1/4 blur-[150px]" />
          <p className="relative text-center text-3xl/9 font-bold tracking-tight text-white">
            Over 70 assets, <br />
            across 35 networks. <br />
            <span className="text-[#FB4D01]">Seamless & secure.</span>
          </p>
        </section>

        <section className="bg-white rounded-t-3xl py-24 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-8 max-w-5xl px-4 w-full">
            {features.map(
              ({ title, description, longDescription, icon: Icon }) => (
                <div key={title} className="flex flex-col items-start">
                  <div className="bg-[#FB4D01] rounded-xl size-9 flex items-center justify-center">
                    <Icon className="size-6 text-white" />
                  </div>
                  <h3 className="mt-6 text-[#FB4D01] text-sm/5 font-bold">
                    {title}
                  </h3>
                  <p className="mt-2 font-bold text-gray-900 text-xl/7 text-balance">
                    {description}
                  </p>
                  <p className="mt-4 text-sm/5 font-medium text-gray-500">
                    {longDescription}
                  </p>
                </div>
              )
            )}
          </div>
        </section>

        <div className="flex-1 bg-white" />
      </main>

      <footer className="bg-white pb-24 flex justify-center items-center rounded-b-3xl">
        <div className="flex w-full flex-col px-4 max-w-5xl">
          <div className="">
            <div className="pt-24">
              <div className="flex items-center justify-between pb-8">
                <LogoIcon className="h-4 shrink-0" />

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
        </div>
      </footer>
    </div>
  )
}
