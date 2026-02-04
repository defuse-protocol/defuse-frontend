import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { assert } from "@defuse-protocol/internal-utils"
import { UserCircleIcon, UserPlusIcon } from "@heroicons/react/20/solid"
import { getContacts } from "@src/app/(app)/(auth)/contacts/actions"
import ErrorMessage from "@src/components/ErrorMessage"
import ListItem from "@src/components/ListItem"
import { ContactsIcon, WalletIcon } from "@src/icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import clsx from "clsx"
import { useEffect, useMemo, useRef, useState } from "react"
import { useFormContext } from "react-hook-form"
import { chainIcons } from "../../constants/blockchains"
import type { WithdrawFormNearValues } from "../../features/withdraw/components/WithdrawForm"
import {
  type ValidateRecipientAddressErrorType,
  validationRecipientAddress,
} from "../../features/withdraw/components/WithdrawForm/components/RecipientSubForm/validationRecipientAddress"
import {
  chainNameToNetworkName,
  midTruncate,
} from "../../features/withdraw/components/WithdrawForm/utils"
import type { NetworkOptions } from "../../hooks/useNetworkLists"
import {
  assetNetworkAdapter,
  reverseAssetNetworkAdapter,
} from "../../utils/adapters"
import { stringToColor } from "../../utils/stringToColor"
import { NetworkIcon } from "../Network/NetworkIcon"
import SearchBar from "../SearchBar"
import TooltipNew from "../TooltipNew"
import ModalAddEditContact from "./ModalAddEditContact"
import { BaseModalDialog } from "./ModalDialog"

type ModalSelectRecipientProps = {
  open: boolean
  onClose: () => void
  chainType: AuthMethod | undefined
  userAddress: string | undefined
  displayAddress: string | undefined
  displayOwnAddress: boolean
  availableNetworks: NetworkOptions
  onRecipientContactChange: (contactName: string | null) => void
}

const VALIDATION_DEBOUNCE_MS = 500

const ModalSelectRecipient = ({
  userAddress,
  chainType,
  open,
  onClose,
  displayAddress,
  displayOwnAddress,
  availableNetworks,
  onRecipientContactChange,
}: ModalSelectRecipientProps) => {
  const { setValue, watch, clearErrors } =
    useFormContext<WithdrawFormNearValues>()
  const blockchain = watch("blockchain")
  const queryClient = useQueryClient()

  const [isScrolled, setIsScrolled] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [validatedAddress, setValidatedAddress] = useState<string | null>(null)
  const [showAddContact, setShowAddContact] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => getContacts(),
  })

  const contacts = data?.ok ? data.value : []

  const availableContacts = useMemo(() => {
    const availableNetworksValues = Object.keys(availableNetworks)

    return contacts.filter((contact) =>
      availableNetworksValues.includes(contact.blockchain)
    )
  }, [availableNetworks, contacts])

  const visibleContacts = useMemo(() => {
    if (!inputValue) return availableContacts

    return availableContacts.filter((contact) =>
      contact.name.toLowerCase().includes(inputValue.toLowerCase())
    )
  }, [availableContacts, inputValue])

  useEffect(() => {
    if (!inputValue) {
      setIsValidating(false)
      setValidationError(null)
      setValidatedAddress(null)
      return
    }

    // If there are matching contacts by name, skip address validation
    if (visibleContacts.length > 0) {
      setIsValidating(false)
      setValidationError(null)
      setValidatedAddress(null)
      return
    }

    let cancelled = false
    setIsValidating(true)
    setValidationError(null)
    setValidatedAddress(null)

    const timer = setTimeout(async () => {
      const result = await validationRecipientAddress(
        inputValue,
        blockchain,
        userAddress ?? "",
        chainType
      )

      if (cancelled) return

      setIsValidating(false)

      if (result.isErr()) {
        setValidationError(renderRecipientAddressError(result.unwrapErr()))
        setValidatedAddress(null)
      } else {
        setValidationError(null)
        setValidatedAddress(inputValue)
      }
    }, VALIDATION_DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [inputValue, blockchain, userAddress, chainType, visibleContacts])

  const handleScroll = () => {
    if (!scrollContainerRef.current) return

    setIsScrolled(scrollContainerRef.current.scrollTop > 0)
  }

  const handleSelectAddress = (address: string) => {
    onRecipientContactChange(null)
    setValue("recipient", address)
    onClose()
  }

  const handleClear = () => {
    setInputValue("")
    setIsValidating(false)
    setValidationError(null)
    setValidatedAddress(null)
  }

  const selectedNetworkName =
    blockchain && blockchain !== "near_intents"
      ? chainNameToNetworkName(blockchain)
      : null

  const hasNoContactsForNetwork =
    !inputValue &&
    !validatedAddress &&
    availableContacts.length === 0 &&
    selectedNetworkName

  return (
    <BaseModalDialog
      title="Select a contact, or enter an address"
      open={open}
      onClose={onClose}
      onCloseAnimationEnd={() => {
        setIsScrolled(false)
        handleClear()
      }}
    >
      <div className="mt-2 max-h-[580px] min-h-80 flex flex-col">
        <div
          className={clsx(
            "pb-5 border-b -mx-5 px-5 transition-colors",
            isScrolled ? "border-gray-200" : "border-transparent"
          )}
        >
          <SearchBar
            icon={UserCircleIcon}
            name="recipient-address"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            loading={isValidating}
            onClear={handleClear}
            autoFocus
            autoComplete="nope"
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            placeholder="Enter wallet address"
            data-testid="withdraw-target-account-field"
          />
          {validationError && (
            <ErrorMessage className="mt-1">{validationError}</ErrorMessage>
          )}
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex flex-col overflow-y-auto -mx-5 px-5 -mb-5 pb-5 space-y-5"
        >
          {hasNoContactsForNetwork && (
            <p className="text-sm text-gray-500 font-medium">
              You have no contacts created for the{" "}
              <span className="capitalize">{selectedNetworkName}</span> network.
            </p>
          )}

          {validatedAddress ? (
            <ListItem onClick={() => handleSelectAddress(validatedAddress)}>
              <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 outline-1 outline-gray-900/10 -outline-offset-1">
                <WalletIcon className="text-gray-500 size-5" />
              </div>
              <ListItem.Content>
                <ListItem.Title>
                  {midTruncate(validatedAddress, 16)}
                </ListItem.Title>
              </ListItem.Content>
              <TooltipNew>
                <TooltipNew.Trigger>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAddContact(true)
                    }}
                    className="relative z-20 size-8 rounded-lg flex items-center justify-center ml-auto text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Save as new contact"
                  >
                    <UserPlusIcon className="size-5" />
                  </button>
                </TooltipNew.Trigger>
                <TooltipNew.Content side="top">
                  Save as new contact
                </TooltipNew.Content>
              </TooltipNew>
            </ListItem>
          ) : (
            <>
              {visibleContacts.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-1.5 text-gray-500 text-sm/6 font-medium">
                    <ContactsIcon className="size-4 shrink-0" />
                    Contacts
                  </h3>

                  <div className="mt-1 space-y-1">
                    {visibleContacts.map(
                      ({ id, address, name, blockchain }) => {
                        const chainKey = reverseAssetNetworkAdapter[blockchain]
                        const chainIcon = chainIcons[chainKey]
                        const chainName = chainNameToNetworkName(chainKey)
                        const contactColor = stringToColor(
                          `${name}${address}${blockchain}`
                        )

                        return (
                          <ListItem
                            key={id}
                            onClick={() => {
                              setValue("blockchain", chainKey)
                              onRecipientContactChange(name)
                              setValue("recipient", address, {
                                shouldValidate: true,
                              })
                              onClose()
                            }}
                          >
                            <div
                              className="size-10 rounded-full flex items-center justify-center shrink-0 outline-1 outline-gray-900/10 -outline-offset-1"
                              style={{
                                backgroundColor: contactColor.background,
                              }}
                            >
                              <WalletIcon
                                className="size-5"
                                style={{ color: contactColor.icon }}
                              />
                            </div>
                            <ListItem.Content>
                              <ListItem.Title className="truncate">
                                {name}
                              </ListItem.Title>
                              <ListItem.Subtitle>
                                {midTruncate(address, 16)}
                              </ListItem.Subtitle>
                            </ListItem.Content>
                            <ListItem.Content align="end">
                              <ListItem.Title className="flex items-center gap-1 pb-4.5">
                                <NetworkIcon
                                  chainIcon={chainIcon}
                                  sizeClassName="size-4"
                                />
                                <span className="capitalize">{chainName}</span>
                              </ListItem.Title>
                            </ListItem.Content>
                          </ListItem>
                        )
                      }
                    )}
                  </div>
                </div>
              )}

              {displayOwnAddress && !inputValue && (
                <div>
                  <h3 className="flex items-center gap-1.5 text-gray-500 text-sm/6 font-medium">
                    <UserCircleIcon className="size-5 shrink-0" />
                    My address
                  </h3>

                  <div className="mt-1 space-y-1">
                    <ListItem
                      onClick={() => {
                        assert(
                          displayAddress,
                          "Display address could not be retrieved from the wallet provider"
                        )
                        onRecipientContactChange(null)
                        setValue("recipient", displayAddress, {
                          shouldValidate: true,
                        })
                        onClose()
                      }}
                    >
                      <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 outline-1 outline-gray-900/10 -outline-offset-1">
                        <WalletIcon className="text-gray-500 size-5" />
                      </div>
                      <ListItem.Content>
                        <ListItem.Title>Connected wallet</ListItem.Title>
                        <ListItem.Subtitle>
                          {midTruncate(displayAddress, 16)}
                        </ListItem.Subtitle>
                      </ListItem.Content>
                    </ListItem>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ModalAddEditContact
        open={showAddContact}
        onClose={() => setShowAddContact(false)}
        onSuccess={(contact) => {
          clearErrors()
          const chainKey = reverseAssetNetworkAdapter[contact.blockchain]
          setValue("blockchain", chainKey)
          setValue("recipient", contact.address)
          setShowAddContact(false)
          onClose()
        }}
        onCloseAnimationEnd={() => {
          queryClient.invalidateQueries({ queryKey: ["contacts"] })
        }}
        defaultValues={{
          address: validatedAddress ?? "",
          blockchain:
            blockchain && blockchain !== "near_intents"
              ? assetNetworkAdapter[blockchain]
              : null,
        }}
      />
    </BaseModalDialog>
  )
}

export default ModalSelectRecipient

function renderRecipientAddressError(error: ValidateRecipientAddressErrorType) {
  switch (error) {
    case "SELF_WITHDRAWAL":
      return "You cannot withdraw to your own address. Please enter a different recipient address."
    case "ADDRESS_INVALID":
      return "Please enter a valid address for the selected blockchain."
    case "NEAR_ACCOUNT_DOES_NOT_EXIST":
      return "The account doesn't exist on NEAR. Please enter a different recipient address."
    case "USER_ADDRESS_REQUIRED":
      return "NEAR Intents network requires your address. Try signing in again."
    default:
      return "An unexpected error occurred. Please enter a different recipient address."
  }
}
