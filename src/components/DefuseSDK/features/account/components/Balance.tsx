import { GiftIcon } from "@heroicons/react/20/solid"
import clsx from "clsx"
import Link from "next/link"
import { FormattedCurrency } from "./shared/FormattedCurrency"

const Balance = ({ balance }: { balance: number | undefined }) => (
  <section className="flex justify-between items-start">
    <div>
      <h2 className="text-base text-gray-500 font-medium">Account balance</h2>
      <FormattedCurrency
        value={balance ?? 0}
        formatOptions={{ currency: "USD" }}
        className={clsx(
          "mt-2 font-bold text-5xl tracking-tight",
          balance === undefined
            ? "text-gray-400 animate-pulse"
            : "text-gray-900"
        )}
        centsClassName="text-3xl"
      />
    </div>

    <Link
      href="/gifts"
      className="shrink-0 size-9 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-700 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 focus-visible:bg-gray-100 focus-visible:text-gray-900"
    >
      <span className="sr-only">Gifts</span>
      <GiftIcon className="size-5" />
    </Link>
  </section>
)

export default Balance
