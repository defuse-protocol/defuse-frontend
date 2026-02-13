"use client"

import { PlusIcon, XMarkIcon } from "@heroicons/react/20/solid"
import {} from "@heroicons/react/24/outline"
import Button from "@src/components/Button"
import Image from "next/image"
import { Collapsible } from "radix-ui"

const faqItems = [
  {
    question: "What is NEAR.com?",
    answer:
      "A financial platform where you can swap assets, earn yield, trade privately, and access new products as they launch — all from a single account, across 35+ networks.",
  },
  {
    question: "How do I create an account?",
    answer:
      "Pick a wallet or passkey and you’re in. No signup, no email, no KYC. Your account is created instantly.",
  },
  {
    question: "What wallets are supported?",
    answer:
      "Passkeys (recommended), plus wallets for NEAR, Ethereum, Solana, Base, Arbitrum, TON, Stellar, Tron, and more.",
  },
  {
    question: "How do swaps work?",
    answer:
      "Market makers compete to fill your order at the best price. Trades settle in seconds within your account.",
  },
  {
    question: "What are Private Deals?",
    answer:
      "Peer-to-peer trades with custom terms. Share a link, they accept, and both sides get exactly what was agreed — guaranteed by smart contracts.",
  },
  {
    question: "What’s coming next?",
    answer:
      "Earn (yield on idle assets), Confidential (private transactions), AI portfolio management, tokenized real-world assets, virtual bank accounts, and debit cards.",
  },
  {
    question: "Can my business integrate?",
    answer:
      "Yes — we’ve helped Ledger, SwapKit, and others process over $10B in swaps. Reach out!",
  },
  {
    question: "Need help?",
    answer:
      "Click the support icon anytime. We usually respond within 24 hours.",
  },
]

export default function IndexPage() {
  return (
    <>
      <section>
        <div className="mt-20 max-w-[1064px] mx-auto w-full flex justify-between items-end px-5">
          <h1 className="text-6xl font-semibold tracking-tight text-gray-900">
            One account. No borders.
            <br />
            Your financial life, on-chain.
          </h1>
          <Button size="xl" className="mb-2" href="/login">
            Sign up or Sign in
          </Button>
        </div>

        <div className="overflow-hidden max-w-7xl px-5 mx-auto w-full bg-black rounded-4xl mt-10 pt-11 border-2 border-black">
          <div className="max-w-5xl mx-auto w-full">
            <p className="text-white text-2xl/8 font-semibold max-w-xl text-balance">
              Swap, earn, and go confidential — across 35+ networks, from a
              single NEAR.com account. Powered by NEAR, and growing with it.
            </p>

            <div className="flex justify-end items-end">
              <Image
                src="/static/images/landing-app-swap.png"
                alt=""
                width={864}
                height={460}
                className="w-108 rounded-tl-xl border-green-500 box-content border-t-4 border-l-4 object-contain -mr-1 z-10 relative"
              />
              <Image
                src="/static/images/landing-app-account.png"
                alt=""
                width={1000}
                height={620}
                className="w-125 rounded-2xl border-4 border-b-0 border-green-500 box-content object-contain rounded-b-none shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1064px] mx-auto w-full px-5 mt-32 space-y-24">
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col items-start justify-center">
            <span className="text-green-600 text-base/4 font-bold tracking-tight">
              Swap
            </span>
            <h2 className="mt-4 text-3xl/9 text-gray-900 font-semibold -tracking-[0.01em]">
              The best price, every time.
            </h2>
            <p className="mt-2 text-lg/6 font-medium text-gray-500 text-balance max-w-96">
              Market makers compete to fill your order across 35+ networks. You
              get the best rate in seconds — as fast as any centralized
              exchange, without giving up custody.
            </p>
          </div>

          <div className="bg-green-500 rounded-3xl flex items-center justify-center aspect-[1.44]">
            <Image
              src="/static/images/landing-swaps.png"
              alt=""
              width={624}
              height={509}
              className="w-78 object-contain"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="relative bg-green-500 rounded-3xl p-9 pb-60 overflow-hidden">
            <div className="inline-flex items-center justify-between bg-black rounded-lg py-1 px-3">
              <span className="text-white text-sm/5 font-bold">Earn</span>
            </div>
            <h2 className="mt-4 text-2xl/8 text-black font-semibold -tracking-[0.01em]">
              Idle assets? Put them to work.
            </h2>
            <p className="mt-2 text-lg/6 font-medium text-black/70 text-balance">
              Deposit and earn yield with no lockups and no commitments.
              Withdraw whenever you want.
            </p>

            <Image
              src="/static/images/landing-chart.png"
              alt=""
              width={1004}
              height={488}
              className="absolute inset-x-0 bottom-0 object-contain"
            />
          </div>

          <div className="relative bg-black rounded-3xl p-9 pb-60 overflow-hidden">
            <div className="inline-flex items-center justify-between bg-green-950 rounded-lg py-1 px-3">
              <span className="text-green-500 text-sm/5 font-bold">
                Confidential
              </span>
            </div>
            <h2 className="mt-4 text-2xl/8 text-white font-semibold -tracking-[0.01em]">
              Your activity. Your business.
            </h2>
            <p className="mt-2 text-lg/6 font-medium text-gray-300 text-balance">
              Deposits, transfers, and swaps stay confidential — visible only to
              you and whoever you choose.
            </p>

            <Image
              src="/static/images/landing-confidential.png"
              alt=""
              width={1004}
              height={348}
              className="absolute inset-x-0 bottom-0 object-contain"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col items-start justify-center">
            <span className="text-green-600 text-base/4 font-bold tracking-tight">
              Private deals
            </span>
            <h2 className="mt-4 text-3xl/9 text-gray-900 font-semibold -tracking-[0.01em]">
              Trade peer-to-peer, trustlessly.
            </h2>
            <p className="mt-2 text-lg/6 font-medium text-gray-500 text-balance max-w-96">
              Create a deal, set your terms, share a link. Both sides get
              exactly what was agreed — enforced by smart contracts. No escrow,
              no middleman.
            </p>
          </div>
          <div className="bg-gray-100 rounded-3xl flex items-center justify-center aspect-[1.44]">
            <Image
              src="/static/images/landing-private-deal.png"
              alt=""
              width={624}
              height={485}
              className="w-78 object-contain"
            />
          </div>
        </div>
      </section>

      <section className="mt-32 max-w-[1064px] mx-auto w-full px-5">
        <div className="max-w-2xl">
          <h2 className="text-3xl/9 text-gray-900 font-semibold -tracking-[0.01em]">
            This is just the beginning.
          </h2>
          <p className="mt-2 text-lg/6 font-medium text-gray-500 text-balance">
            Your NEAR.com account is built on NEAR — an ecosystem shipping new
            financial infrastructure at speed. As it grows, so does what you can
            do here.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mt-8">
          <div className="overflow-hidden relative p-6 rounded-2xl bg-black pb-43">
            <h3 className="text-2xl/8 -tracking-[0.01em] font-semibold text-white">
              AI Portfolio Management
            </h3>
            <p className="text-base/5 font-medium mt-1.5 text-balance text-gray-300">
              Intelligent agents that help you allocate, rebalance, and optimize
              your holdings.
            </p>

            <Image
              src="/static/images/landing-ai.png"
              alt=""
              width={668}
              height={272}
              className="absolute inset-x-0 bottom-0 object-contain"
            />
          </div>

          <div className="overflow-hidden relative p-6 rounded-2xl bg-green-500">
            <h3 className="text-2xl/8 -tracking-[0.01em] font-semibold text-black">
              Real-World Assets
            </h3>
            <p className="text-base/5 font-medium mt-1.5 text-balance text-black/70">
              Tokenized equities, bonds, and more — accessible from anywhere.
            </p>

            <Image
              src="/static/images/landing-tickers.png"
              alt=""
              width={668}
              height={264}
              className="absolute inset-x-0 bottom-2 object-contain"
            />
          </div>

          <div className="overflow-hidden relative p-6 rounded-2xl bg-gray-100">
            <h3 className="text-2xl/8 -tracking-[0.01em] font-semibold text-black">
              Virtual Bank Accounts
            </h3>
            <p className="text-base/5 font-medium mt-1.5 text-balance text-gray-600">
              Convert between fiat and stablecoins. On-ramp and off-ramp,
              instantly.
            </p>

            <Image
              src="/static/images/landing-currencies.png"
              alt=""
              width={336}
              height={246}
              className="absolute w-42 bottom-1 left-6 object-contain"
            />
          </div>

          <div className="overflow-hidden relative p-6 rounded-2xl bg-black col-span-2 pb-32">
            <h3 className="text-2xl/8 -tracking-[0.01em] font-semibold text-white">
              Debit Cards
            </h3>
            <p className="text-base/5 font-medium mt-1.5 text-gray-300 max-w-56">
              Spend your balance anywhere cards are accepted.
            </p>

            <Image
              src="/static/images/landing-card-2.png"
              alt=""
              width={464}
              height={280}
              className="absolute w-58 -bottom-11 right-72 object-contain"
            />

            <Image
              src="/static/images/landing-card-1.png"
              alt=""
              width={552}
              height={333}
              className="absolute w-69 -bottom-4 right-7 object-contain rounded-[17px] shadow-2xl"
            />
          </div>

          <div className="overflow-hidden p-6 rounded-2xl bg-green-500 flex flex-col items-start">
            <div className="flex flex-col flex-1">
              <h3 className="text-2xl/8 -tracking-[0.01em] font-semibold text-black">
                And more
              </h3>
              <p className="text-base/5 font-medium mt-1.5 text-balance text-black/70">
                New capabilities are shipping fast. Your account is ready for
                all of them.
              </p>
            </div>

            <Button size="lg" href="/login">
              Get started
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-32 max-w-[1064px] mx-auto w-full px-5 grid grid-cols-3 gap-10">
        <div className="py-2.5">
          <h2 className="text-3xl/9 text-gray-900 font-semibold -tracking-[0.01em] text-balance">
            Trusted by builders and institutions.
          </h2>
          <p className="mt-2 text-lg/6 font-medium text-gray-500 text-balance">
            Ledger, SwapKit, and many more already process billions through NEAR
            Intents.
          </p>
        </div>

        <div className="col-span-2 grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-gray-100 text-center flex flex-col items-center justify-center">
            <span className="text-4xl/9 font-bold tracking-tight text-gray-900">
              $13B+
            </span>
            <span className="text-xl/6 text-gray-600 font-semibold">
              volume
            </span>
          </div>

          <div className="rounded-2xl bg-gray-100 text-center flex flex-col items-center justify-center">
            <span className="text-4xl/9 font-bold tracking-tight text-gray-900">
              70+
            </span>
            <span className="text-xl/6 text-gray-600 font-semibold">
              assets
            </span>
          </div>

          <div className="rounded-2xl bg-gray-100 text-center flex flex-col items-center justify-center">
            <span className="text-4xl/9 font-bold tracking-tight text-gray-900">
              35+
            </span>
            <span className="text-xl/6 text-gray-600 font-semibold">
              networks
            </span>
          </div>
        </div>
      </section>

      <section className="mt-32 max-w-[1064px] mx-auto w-full px-5 grid grid-cols-3 gap-10 pb-32">
        <div className="py-2.5">
          <h2 className="text-3xl/9 text-gray-900 font-semibold -tracking-[0.01em] text-balance">
            Common questions
          </h2>
          <p className="mt-2 text-lg/6 font-medium text-gray-500 text-balance">
            Can’t find your answer? Send us a note. We reply as fast as we can.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-4"
            onClick={() => {
              if (typeof window !== "undefined" && window.Beacon) {
                window.Beacon("open")
              }
            }}
          >
            Contact support
          </Button>
        </div>

        <div className="col-span-2 border-y border-gray-200 divide-y divide-gray-200">
          {faqItems.map(({ question, answer }) => (
            <Collapsible.Root key={question}>
              <Collapsible.Trigger className="group flex w-full items-center justify-between gap-6 py-4 text-left">
                <h3 className="text-xl/7 -tracking-[0.01em] font-semibold text-gray-900">
                  {question}
                </h3>
                <PlusIcon className="size-5 text-gray-500 group-data-[state=open]:hidden block" />
                <XMarkIcon className="size-5 text-gray-500 group-data-[state=open]:block hidden" />
              </Collapsible.Trigger>
              <Collapsible.Content className="-mt-2 text-base/6 font-medium text-gray-500 pb-4 pr-12">
                {answer}
              </Collapsible.Content>
            </Collapsible.Root>
          ))}
        </div>
      </section>
    </>
  )
}
