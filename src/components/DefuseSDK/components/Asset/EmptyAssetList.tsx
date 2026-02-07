import { MagnifyingGlassIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"

const EmptyAssetList = () => (
  <div className="flex justify-center items-center flex-col mt-12">
    <div
      className="size-10 rounded-full bg-surface-active flex items-center justify-center text-fg-secondary"
      aria-hidden
    >
      <MagnifyingGlassIcon className="size-5" />
    </div>
    <h3 className="font-semibold text-base text-fg mt-4">No tokens found</h3>
    <p className="text-sm text-fg-secondary mt-1 font-medium">
      Try depositing to your wallet
    </p>
    <Button href="/deposit" className="mt-4">
      Deposit
    </Button>
  </div>
)

export default EmptyAssetList
