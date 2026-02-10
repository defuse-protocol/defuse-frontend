import type {
  AuthMethod,
  BlockchainEnum,
} from "@defuse-protocol/internal-utils"
import { UserCircleIcon } from "@heroicons/react/20/solid"
import {
  type Contact,
  createContact,
  updateContact,
} from "@src/app/(app)/(auth)/contacts/actions"
import Button from "@src/components/Button"
import ErrorMessage from "@src/components/ErrorMessage"
import TokenIconPlaceholder from "@src/components/TokenIconPlaceholder"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import useSearchNetworks from "@src/hooks/useFilterNetworks"
import { WalletIcon } from "@src/icons"
import clsx from "clsx"
import { useCallback, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import type { SupportedChainName } from "../../types/base"
import {
  assetNetworkAdapter,
  reverseAssetNetworkAdapter,
} from "../../utils/adapters"
import { allAvailableChains } from "../../utils/blockchain"
import { NetworkList } from "../Network/NetworkList"
import SearchBar from "../SearchBar"
import { BaseModalDialog } from "./ModalDialog"
import ModalNoResults from "./ModalNoResults"

type FormData = {
  address: string
  name: string
  blockchain: BlockchainEnum | null
}

type ModalContactProps = {
  open: boolean
  contact?: Contact | null
  defaultValues?: Partial<FormData>
  onSuccess?: (contact: {
    name: string
    address: string
    blockchain: BlockchainEnum
  }) => void
  onClose: () => void
  onCloseAnimationEnd?: () => void
}

const ModalAddEditContact = ({
  open,
  onClose,
  onCloseAnimationEnd,
  contact,
  defaultValues: defaultValuesProp,
  onSuccess,
}: ModalContactProps) => {
  const [selectNetworkOpen, setSelectNetworkOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [isScrolled, setIsScrolled] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { state } = useConnectWallet()
  const userAddress = state.address
  // ChainType enum values match AuthMethod values, so we can safely cast
  const chainType = state.chainType as AuthMethod | undefined

  const isEditing = Boolean(contact)

  const defaultValues = useMemo<FormData>(
    () => ({
      name: defaultValuesProp?.name ?? "",
      address: defaultValuesProp?.address ?? "",
      blockchain: defaultValuesProp?.blockchain ?? null,
    }),
    [defaultValuesProp]
  )

  const formValues = useMemo<FormData | undefined>(
    () =>
      open
        ? contact
          ? {
              name: contact.name,
              address: contact.address,
              blockchain: contact.blockchain,
            }
          : {
              name: defaultValuesProp?.name ?? "",
              address: defaultValuesProp?.address ?? "",
              blockchain: defaultValuesProp?.blockchain ?? null,
            }
        : undefined,
    [contact, open, defaultValuesProp]
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues,
    values: formValues,
    resetOptions: {
      keepErrors: true,
      keepIsSubmitted: false,
    },
  })

  register("blockchain", {
    validate: (value) => value !== null || "Select a network for this contact.",
  })

  const availableNetworks = useMemo(() => allAvailableChains(), [])
  const filteredNetworks = useSearchNetworks({
    networks: availableNetworks,
    searchValue,
  })

  const blockchain = watch("blockchain")
  const selectedNetwork = useMemo(
    () => (blockchain ? reverseAssetNetworkAdapter[blockchain] : null),
    [blockchain]
  )
  const networkData = useMemo(
    () => (blockchain ? availableNetworks[blockchain] : null),
    [blockchain, availableNetworks]
  )

  const onSubmit = async (data: FormData) => {
    if (!data.blockchain) {
      return
    }

    setSubmitError(null)

    try {
      if (isEditing && contact) {
        if (!contact.contactId) {
          setSubmitError("Contact ID is missing. Please try again.")
          return
        }

        const result = await updateContact({
          contactId: contact.contactId,
          name: data.name,
          address: data.address,
          blockchain: data.blockchain,
          userAddress,
          chainType,
        })

        if (!result.ok) {
          setSubmitError(result.error)
          return
        }
      } else {
        const result = await createContact({
          name: data.name,
          address: data.address,
          blockchain: data.blockchain,
          userAddress,
          chainType,
        })

        if (!result.ok) {
          setSubmitError(result.error)
          return
        }
      }

      onSuccess?.({
        name: data.name,
        address: data.address,
        blockchain: data.blockchain,
      })
      onClose()
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."
      )
    }
  }

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return

    setIsScrolled(scrollContainerRef.current.scrollTop > 0)
  }, [])

  const getModalTitle = useMemo(() => {
    if (selectNetworkOpen) return "Select network"
    return isEditing ? "Edit contact" : "Create contact"
  }, [selectNetworkOpen, isEditing])

  const onChangeNetwork = useCallback(
    (network: SupportedChainName) => {
      setValue("blockchain", assetNetworkAdapter[network] as BlockchainEnum, {
        shouldValidate: true,
      })
      setSelectNetworkOpen(false)
      setSearchValue("")
      setIsScrolled(false)
    },
    [setValue]
  )

  return (
    <BaseModalDialog
      title={getModalTitle}
      open={open}
      onClose={selectNetworkOpen ? () => setSelectNetworkOpen(false) : onClose}
      onCloseAnimationEnd={() => {
        onCloseAnimationEnd?.()
        reset()
        setSelectNetworkOpen(false)
      }}
      back={selectNetworkOpen ? () => setSelectNetworkOpen(false) : undefined}
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
            {Object.keys(filteredNetworks).length === 0 ? (
              <ModalNoResults
                text="No networks found"
                handleSearchClear={() => setSearchValue("")}
              />
            ) : (
              <NetworkList
                networkOptions={filteredNetworks}
                selectedNetwork={selectedNetwork}
                onChangeNetwork={onChangeNetwork}
              />
            )}
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-3"
          autoComplete="off"
        >
          <div className="space-y-2">
            <div>
              <label
                className={clsx(
                  "flex items-center gap-3 rounded-3xl bg-white p-3 cursor-text outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2",
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
                    id="contact-name"
                    type="text"
                    placeholder="Enter name"
                    autoComplete="off"
                    data-form-type="other"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    className="block w-full text-gray-900 font-semibold placeholder:text-gray-400 focus:outline-none text-base leading-none ring-0 border-none p-0"
                    {...register("name", {
                      required: "Enter the name of the contact.",
                    })}
                  />
                </div>
              </label>
              {errors.name && (
                <ErrorMessage className="mt-1 mb-4">
                  {errors.name.message}
                </ErrorMessage>
              )}
            </div>

            <div>
              <label
                className={clsx(
                  "flex items-center gap-3 rounded-3xl bg-white p-3 cursor-text outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2",
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
                    id="contact-address"
                    type="text"
                    placeholder="Enter address"
                    autoComplete="off"
                    data-form-type="other"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    className="block w-full text-gray-900 font-semibold placeholder:text-gray-400 focus:outline-none text-base leading-none ring-0 border-none p-0"
                    {...register("address", {
                      required: "Enter the address of the contact.",
                    })}
                  />
                </div>
              </label>
              {errors.address && (
                <ErrorMessage className="mt-1 mb-4">
                  {errors.address.message}
                </ErrorMessage>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setSelectNetworkOpen(true)}
                className={clsx(
                  "w-full rounded-3xl bg-white border p-3 text-left flex items-center gap-3 focus-visible:outline focus-visible:outline-gray-700",
                  errors.blockchain
                    ? "border-red-500 focus-visible:border-red-500"
                    : "border-gray-200 hover:border-gray-700 hover:outline hover:outline-gray-700 focus-visible:border-gray-700"
                )}
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
              {errors.blockchain && (
                <ErrorMessage className="mt-1 mb-4">
                  {errors.blockchain.message}
                </ErrorMessage>
              )}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            className="mt-5"
            loading={isSubmitting}
          >
            {isEditing ? "Update contact" : "Save contact"}
          </Button>

          {submitError && (
            <ErrorMessage className="mt-3 text-center text-balance">
              {submitError}
            </ErrorMessage>
          )}
        </form>
      )}
    </BaseModalDialog>
  )
}

export default ModalAddEditContact
