import { PlusIcon } from "@heroicons/react/20/solid"
import { Gift, Wallet } from "@phosphor-icons/react"
import Button from "@src/components/Button"
import ListItemsSkeleton from "@src/components/ListItemsSkeleton"

export function GiftHistoryEmpty() {
  return (
    <section className="mt-6">
      <ListItemsSkeleton count={3} className="mt-2" />
      <div className="max-w-72 mx-auto -mt-5 relative flex flex-col items-center">
        <div
          className="size-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"
          aria-hidden
        >
          <Gift weight="bold" className="size-6" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 text-center tracking-tight mt-3">
          No gifts yet
        </h3>
        <p className="text-base text-gray-500 mt-1 font-medium text-center text-balance">
          Create a gift and send it to your friends
        </p>
        <Button href="/gift-card/new" size="xl" className="mt-4">
          <PlusIcon className="size-5 shrink-0" />
          Create a gift
        </Button>
      </div>
    </section>
  )
}

export function GiftHistoryNotLoggedIn() {
  return (
    <section className="mt-6">
      <ListItemsSkeleton count={3} className="mt-2" />
      <div className="max-w-72 mx-auto -mt-5 relative flex flex-col items-center">
        <div
          className="size-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"
          aria-hidden
        >
          <Wallet weight="bold" className="size-6" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 text-center tracking-tight mt-3">
          Connect your wallet
        </h3>
        <p className="text-base text-gray-500 mt-1 font-medium text-center text-balance">
          Connect your wallet to create and manage gift links
        </p>
      </div>
    </section>
  )
}
