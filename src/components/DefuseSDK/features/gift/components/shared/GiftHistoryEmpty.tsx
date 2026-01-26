import { Gift, Wallet } from "@phosphor-icons/react"

export function GiftHistoryEmpty() {
  return (
    <section className="mt-6 flex flex-col items-center justify-center pt-6">
      <div
        className="size-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
        aria-hidden
      >
        <Gift weight="bold" className="size-5" />
      </div>
      <h3 className="font-semibold text-base text-gray-900 mt-6">
        No gifts yet
      </h3>
      <p className="text-sm text-gray-500 mt-1">
        Create a gift and send it to your friends
      </p>
    </section>
  )
}

export function GiftHistoryNotLoggedIn() {
  return (
    <section className="mt-6 flex flex-col items-center justify-center pt-6">
      <div
        className="size-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
        aria-hidden
      >
        <Wallet weight="bold" className="size-5" />
      </div>
      <h3 className="font-semibold text-base text-gray-900 mt-6">
        Connect your wallet
      </h3>
      <p className="text-sm text-gray-500 mt-1 text-center">
        Connect your wallet to create and manage gift links
      </p>
    </section>
  )
}
