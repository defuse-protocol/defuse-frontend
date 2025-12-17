import clsx from "clsx"
import { FormattedCurrency } from "./shared/FormattedCurrency"

const Balance = ({ balance }: { balance: number | undefined }) => (
  <section>
    <h2 className="text-base text-gray-400">Account balance</h2>
    <FormattedCurrency
      value={balance ?? 0}
      formatOptions={{ currency: "USD" }}
      className={clsx(
        "mt-2 font-bold text-5xl tracking-tight",
        balance === undefined ? "text-gray-400 animate-pulse" : "text-gray-900"
      )}
      centsClassName="text-3xl"
    />
  </section>
)

export default Balance
