"use client"

import { PlusIcon, XMarkIcon } from "@heroicons/react/20/solid"
import {
  ArrowPathRoundedSquareIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline"
import AnimatedTokenPath from "@src/components/AnimatedTokenPath"
import { HomeSwapWidget } from "@src/components/HomeSwapWidget"
import { SignedInRedirect } from "@src/components/SignedInRedirect"
import { Collapsible } from "radix-ui"

const features = [
  {
    title: "Swap",
    description:
      "One account, no borders. Swap fast, earn anywhere, trade privately.",
    longDescription:
      "Trade assets across 35+ networks with market makers competing to give you the best possible price. One click, best rate, done.",
    icon: ArrowPathRoundedSquareIcon,
  },
  {
    title: "Trade",
    description: "Trade peer-to-peer. Set your terms, share a link, done.",
    longDescription:
      "Fully trustless—the exchange is all-or-nothing, enforced by smart contracts. No escrow, no middleman.",
    icon: ArrowsRightLeftIcon,
  },
  {
    title: "Earn",
    description: "Put idle assets to work. Earn yield, withdraw anytime.",
    longDescription:
      "Turn idle balances into passive income. No lockups, no commitments. Withdraw whenever you want.",
    icon: ChartBarIcon,
  },
  {
    title: "Shield",
    description: "Go private. Shield your activity from everyone but you.",
    longDescription:
      "Coming soon—keep your on-chain activity private. Shield deposits, withdrawals, and trades so they aren't visible to anyone but you.",
    icon: ShieldCheckIcon,
  },
]

const faqItems = [
  {
    question: "What is Near Intents?",
    answer:
      "Near Intents is an on-chain trading technology that lets you swap assets across 35+ networks, earn yield on deposits, and create private peer-to-peer trades—all without giving up custody of your funds.",
  },
  {
    question: "How do I create an account?",
    answer:
      "Just pick a wallet or passkey and you're in. There's no signup form, email verification, or KYC. Your account is created instantly the first time you connect.",
  },
  {
    question: "What wallets are supported?",
    answer:
      "We support passkeys (recommended), plus wallets for NEAR, Solana, Ethereum and other EVM chains, TON, Stellar, and Tron. You can connect whichever you prefer.",
  },
  {
    question: "How do swaps work?",
    answer:
      "When you swap, market makers compete to fill your order at the best price. Trades settle within your Near Intents account in seconds—as fast as a centralized exchange.",
  },
  {
    question: "What are Private trades?",
    answer:
      "Trade directly with a friend, business partner, or even someone you just met. Create a deal, set your terms, and share the link. They accept, and both sides get exactly what was agreed—guaranteed by smart contracts, no middlemen.",
  },
  {
    question: "Can my business use Near Intents?",
    answer:
      "Yes! We've already helped Ledger, SwapKit, and many more to process over $10B in swaps. Interested? Reach out!",
  },
  {
    question: "What if I need help?",
    answer:
      "Just click the support icon in the lower right. We're here to assist!",
  },
]

export default function IndexPage() {
  return (
    <SignedInRedirect>
      <section className="flex flex-col items-center justify-center pt-16 pb-24 bg-white rounded-b-3xl overflow-hidden">
        <div className="flex flex-col items-center justify-center px-4 max-w-lg">
          <div className="text-brand text-sm/5 font-bold py-0.5 px-3 rounded-lg bg-brand/[0.07] text-center">
            Over $10 billion swapped
          </div>
          <h1 className="mt-6 text-5xl/none text-balance font-bold tracking-tight text-center">
            One account, no borders.
            <br />
            <span className="text-brand">Endless possibilities.</span>
          </h1>
        </div>

        <div className="relative mt-16 flex flex-col items-center justify-center px-4 max-w-md">
          <AnimatedTokenPath />
          <AnimatedTokenPath side="right" />

          <HomeSwapWidget />
        </div>
      </section>

      <section className="bg-gray-800 py-24 relative overflow-hidden">
        <div className="absolute size-128 rounded-full bg-brand/80 left-1/2 -translate-x-1/2 translate-y-1/4 blur-[150px]" />
        <p className="relative text-center text-4xl/10 font-bold tracking-tight text-white">
          Over 70 assets, <br />
          across 35 networks. <br />
          <span className="text-brand">Think Binance, but permissionless.</span>
        </p>
      </section>

      <section className="bg-white rounded-t-3xl pt-24 pb-16 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-y-16 gap-x-12 max-w-5xl px-4 w-full">
          {features.map(
            ({ title, description, longDescription, icon: Icon }) => (
              <div key={title} className="flex flex-col items-start">
                <div className="bg-brand rounded-xl size-9 flex items-center justify-center">
                  <Icon className="size-6 text-white" />
                </div>
                <h3 className="mt-6 text-brand text-sm/5 font-bold">{title}</h3>
                <p className="mt-2 font-bold text-gray-900 text-xl/7 text-balance">
                  {description}
                </p>
                <p className="mt-4 text-sm/6 font-medium text-gray-500 text-balance">
                  {longDescription}
                </p>
              </div>
            )
          )}
        </div>
      </section>

      <section className="bg-white py-16 flex items-center justify-center">
        <div className="max-w-5xl w-full px-4 grid grid-cols-2 gap-x-2 gap-y-8">
          <div>
            <h2 className="text-4xl/10 font-bold tracking-tight text-gray-900">
              Questions &amp; Answers
            </h2>
          </div>

          <div className="divide-y divide-gray-200 border-y border-gray-200">
            {faqItems.map(({ question, answer }) => (
              <Collapsible.Root key={question}>
                <Collapsible.Trigger className="group flex w-full items-center justify-between gap-6 py-4 text-left text-base/7 text-gray-900">
                  <h3 className="text-base font-semibold text-gray-900">
                    {question}
                  </h3>
                  <PlusIcon className="size-5 text-gray-500 transition-transform group-data-[state=open]:hidden block" />
                  <XMarkIcon className="size-5 text-gray-500 transition-transform group-data-[state=open]:block hidden" />
                </Collapsible.Trigger>
                <Collapsible.Content className="-mt-2 flex flex-col gap-2 pr-12 pb-4 text-sm/6 font-medium text-gray-500">
                  {answer}
                </Collapsible.Content>
              </Collapsible.Root>
            ))}
          </div>
        </div>
      </section>
    </SignedInRedirect>
  )
}
