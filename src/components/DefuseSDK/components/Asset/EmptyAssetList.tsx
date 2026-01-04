import { MagnifyingGlassIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"

const EmptyAssetList = () => (
  <div className="flex justify-center items-center flex-col mt-12">
    <div
      className="size-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
      aria-hidden
    >
      <MagnifyingGlassIcon className="size-5" />
    </div>
    <h3 className="font-semibold text-base text-gray-900 mt-4">
      No tokens found
    </h3>
    <p className="text-sm text-gray-500 mt-1 font-medium">
      Try depositing to your wallet
    </p>
    <Button href="/deposit" className="mt-4">
      Deposit
    </Button>
  </div>
)

export default EmptyAssetList
