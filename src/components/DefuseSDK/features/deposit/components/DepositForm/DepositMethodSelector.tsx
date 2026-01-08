import { ArrowDownTrayIcon, WalletIcon } from "@heroicons/react/16/solid"
import Button from "@src/components/Button"

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
    <div className="bg-gray-100 rounded-2xl grid grid-cols-2 gap-1 border border-gray-200 p-1 mt-8">
      <Button
        variant={selectedDepositOption === "passive" ? "outline" : "secondary"}
        onClick={() => onSelectDepositOption("passive")}
        size="lg"
      >
        <ArrowDownTrayIcon className="size-4 shrink-0" />
        Deposit
      </Button>
      <Button
        variant={selectedDepositOption === "active" ? "outline" : "secondary"}
        onClick={() => onSelectDepositOption("active")}
        size="lg"
      >
        <WalletIcon className="size-4 shrink-0" />
        Wallet
      </Button>
    </div>
  )
}
