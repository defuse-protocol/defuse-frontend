import { Eye, EyeSlash } from "@phosphor-icons/react"
import clsx from "clsx"
import { FormattedCurrency } from "./shared/FormattedCurrency"

const Balance = ({
  balance,
  hideBalances = false,
  onToggleHideBalances,
}: {
  balance: number | undefined
  hideBalances?: boolean
  onToggleHideBalances?: () => void
}) => (
  <section>
    <div className="flex items-center justify-between">
      <h2 className="text-base text-gray-500 font-medium">Account balance</h2>
      {onToggleHideBalances && (
        <button
          type="button"
          onClick={onToggleHideBalances}
          className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
          aria-label={hideBalances ? "Show balances" : "Hide balances"}
        >
          {hideBalances ? (
            <EyeSlash weight="bold" className="size-5" />
          ) : (
            <Eye weight="bold" className="size-5" />
          )}
        </button>
      )}
    </div>
    {hideBalances ? (
      <div
        className={clsx(
          "mt-2 font-bold text-5xl tracking-tight",
          "text-gray-900"
        )}
      >
        ••••••
      </div>
    ) : (
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
    )}
  </section>
)

export default Balance
