import clsx from "clsx"

type DepositMethod = "active" | "passive"

interface DepositMethodSelectorProps {
  selectedDepositOption: DepositMethod
  onSelectDepositOption: (method: DepositMethod) => void
}

export function DepositMethodSelector({
  selectedDepositOption,
  onSelectDepositOption,
}: DepositMethodSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="font-bold text-label text-sm">Choose deposit method</div>

      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => onSelectDepositOption("passive")}
          className={clsx(
            "flex h-12 flex-1 items-center justify-center rounded-md font-bold text-sm",
            selectedDepositOption === "passive"
              ? "bg-accent-2 text-accent-a11 ring-2 ring-accent-a8 ring-inset dark:bg-accent-a2 dark:text-accent-10"
              : "bg-transparent text-gray-11 ring-1 ring-border"
          )}
        >
          Exchange
        </button>

        <button
          type="button"
          onClick={() => onSelectDepositOption("active")}
          className={clsx(
            "flex h-12 flex-1 items-center justify-center rounded-md font-bold text-sm",
            selectedDepositOption === "active"
              ? "bg-accent-2 text-accent-a11 ring-2 ring-accent-a8 ring-inset dark:bg-accent-a2 dark:text-accent-10"
              : "bg-transparent text-gray-11 ring-1 ring-border"
          )}
        >
          Wallet
        </button>
      </div>
    </div>
  )
}
