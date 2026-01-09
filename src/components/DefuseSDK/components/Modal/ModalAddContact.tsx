import type { BlockchainEnum } from "@defuse-protocol/internal-utils"
import { UserCircleIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"
import ErrorMessage from "@src/components/ErrorMessage"
import TokenIconPlaceholder from "@src/components/TokenIconPlaceholder"
import useSearchNetworks from "@src/hooks/useFilterNetworks"
import { WalletIcon } from "@src/icons"
import clsx from "clsx"
import { useRef, useState } from "react"
import { useForm } from "react-hook-form"
import {
  assetNetworkAdapter,
  reverseAssetNetworkAdapter,
} from "../../utils/adapters"
import { allAvailableChains } from "../../utils/blockchain"
import { NetworkList } from "../Network/NetworkList"
import SearchBar from "../SearchBar"
import { BaseModalDialog } from "./ModalDialog"

interface FormData {
  address: string
  name: string
  network: BlockchainEnum | null
}

const ModalAddContact = ({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) => {
  const [selectNetworkOpen, setSelectNetworkOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [isScrolled, setIsScrolled] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>()

  const availableNetworks = allAvailableChains()
  const filteredNetworks = useSearchNetworks({
    networks: availableNetworks,
    searchValue,
  })

  const network = watch("network")
  const selectedNetwork = network ? reverseAssetNetworkAdapter[network] : null
  const networkData = network ? availableNetworks[network] : null

  const onSubmit = async (_data: FormData) => {
    // TODO: Handle form submission

    await new Promise((resolve) => setTimeout(resolve, 2000))

    onClose()
    // TODO: Add success toast
  }

  const handleScroll = () => {
    if (!scrollContainerRef.current) return

    setIsScrolled(scrollContainerRef.current.scrollTop > 0)
  }

  return (
    <BaseModalDialog
      title={selectNetworkOpen ? "Select network" : "Create contact"}
      open={open}
      onClose={onClose}
      onCloseAnimationEnd={() => reset()}
    >
      {selectNetworkOpen ? (
        <div className="mt-3 max-h-[630px] flex flex-col">
          <div
            className={clsx(
              "pb-5 border-b -mx-5 px-5 transition-colors",
              isScrolled ? "border-gray-200" : "border-transparent"
            )}
          >
            <SearchBar
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onClear={() => setSearchValue("")}
              placeholder="Search networks"
              autoFocus
            />
          </div>

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="overflow-y-auto -mx-5 px-5 -mb-5 pb-5"
          >
            <NetworkList
              networkOptions={filteredNetworks}
              selectedNetwork={selectedNetwork}
              onChangeNetwork={(network) => {
                setValue("network", assetNetworkAdapter[network])
                setSelectNetworkOpen(false)
                setSearchValue("")
                setIsScrolled(false)
              }}
            />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-3">
          <div className="space-y-2">
            <div>
              <label
                className={clsx(
                  "flex items-center gap-3 rounded-3xl bg-white p-3 outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2",
                  errors.name
                    ? "outline-red-500 focus-within:outline-red-500"
                    : "outline-gray-200 focus-within:outline-gray-900"
                )}
              >
                <div className="bg-gray-100 rounded-full size-10 shrink-0 flex items-center justify-center">
                  <UserCircleIcon className="size-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <span className="sr-only">Name</span>
                  <input
                    id="name"
                    type="text"
                    placeholder="Enter name"
                    className="block w-full text-gray-900 font-semibold placeholder:text-gray-400 focus:outline-none text-base leading-none ring-0 border-none p-0"
                    {...register("name", {
                      required: "Enter the name of the contact.",
                    })}
                  />
                </div>
              </label>
              {errors.name && (
                <ErrorMessage className="mt-2 mb-5">
                  {errors.name.message}
                </ErrorMessage>
              )}
            </div>

            <div>
              <label
                className={clsx(
                  "flex items-center gap-3 rounded-3xl bg-white p-3 outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2",
                  errors.address
                    ? "outline-red-500 focus-within:outline-red-500"
                    : "outline-gray-200 focus-within:outline-gray-900"
                )}
              >
                <div className="bg-gray-100 rounded-full size-10 shrink-0 flex items-center justify-center">
                  <WalletIcon className="size-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <span className="sr-only">Address</span>
                  <input
                    id="address"
                    type="text"
                    placeholder="Enter address"
                    className="block w-full text-gray-900 font-semibold placeholder:text-gray-400 focus:outline-none text-base leading-none ring-0 border-none p-0"
                    {...register("address", {
                      required: "Enter the address of the contact.",
                    })}
                  />
                </div>
              </label>
              {errors.address && (
                <ErrorMessage className="mt-2 mb-5">
                  {errors.address.message}
                </ErrorMessage>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectNetworkOpen(true)}
              className="w-full rounded-3xl bg-white border border-gray-200 p-3 text-left flex items-center gap-3 hover:border-gray-700 hover:outline hover:outline-gray-700 focus-visible:border-gray-700 focus-visible:outline focus-visible:outline-gray-700"
            >
              <span className="flex items-center gap-3 flex-1">
                <div className="size-10 shrink-0">
                  {networkData?.icon ?? (
                    <TokenIconPlaceholder className="size-10" />
                  )}
                </div>
                <span className="flex flex-col items-start gap-1">
                  <span
                    className={clsx(
                      "text-base/none font-semibold",
                      networkData ? "text-gray-900" : "text-gray-400"
                    )}
                  >
                    {networkData?.label ?? "Select network"}
                  </span>
                </span>
              </span>
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            className="mt-5"
            loading={isSubmitting}
          >
            Save contact
          </Button>
        </form>
      )}
    </BaseModalDialog>
  )
}

export default ModalAddContact
