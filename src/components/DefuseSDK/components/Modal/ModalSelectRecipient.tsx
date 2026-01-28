import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { assert } from "@defuse-protocol/internal-utils"
import {
  PencilIcon,
  UserCircleIcon,
  UserPlusIcon,
} from "@heroicons/react/20/solid"
import {
  type Contact,
  getContacts,
} from "@src/app/(app)/(auth)/contacts/actions"
import ErrorMessage from "@src/components/ErrorMessage"
import ListItem from "@src/components/ListItem"
import { ContactsIcon, WalletIcon } from "@src/icons"
import { useQuery } from "@tanstack/react-query"
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
import { reverseAssetNetworkAdapter } from "../../utils/adapters"
import { isSupportedChainName } from "../../utils/blockchain"
import { NetworkIcon } from "../Network/NetworkIcon"
import SearchBar from "../SearchBar"
import TooltipNew from "../TooltipNew"
import { BaseModalDialog } from "./ModalDialog"
import ModalSaveContact from "./ModalSaveContact"

type ModalSelectRecipientProps = {
  open: boolean
  onClose: () => void
  chainType: AuthMethod | undefined
  userAddress: string | undefined
  displayAddress: string | undefined
  displayOwnAddress: boolean
  availableNetworks: NetworkOptions
  /** Callback when a contact is selected (switches to contact mode) */
  onSelectContact?: (contact: Contact) => void
  /** Callback when user wants to enter address manually (switches to address mode) */
  onSwitchToAddressMode?: () => void
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
  onSelectContact,
  onSwitchToAddressMode,
}: ModalSelectRecipientProps) => {
  const { setValue, watch } = useFormContext<WithdrawFormNearValues>()
  const blockchain = watch("blockchain")

  const [isScrolled, setIsScrolled] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [validatedAddress, setValidatedAddress] = useState<string | null>(null)
  const [isSaveContactModalOpen, setIsSaveContactModalOpen] = useState(false)
  // Track if modal was closed by selecting an address (don't clear input)
  const [closedBySelection, setClosedBySelection] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => getContacts(),
  })

  const contacts = data?.ok ? data.value : []

  // Split contacts into matching network and other networks
  const { matchingNetworkContacts, otherNetworkContacts } = useMemo(() => {
    // availableNetworks is keyed by BlockchainEnum (e.g., "ETHEREUM")
    const availableNetworksValues = Object.keys(availableNetworks)

    // Filter to only contacts on available networks
    // contact.blockchain is BlockchainEnum, which matches availableNetworks keys
    const availableContacts = contacts.filter((contact) => {
      return availableNetworksValues.includes(contact.blockchain)
    })

    // Further filter by search input if any
    const filteredContacts = inputValue
      ? availableContacts.filter((contact) =>
          contact.name.toLowerCase().includes(inputValue.toLowerCase())
        )
      : availableContacts

    // Split by whether they match the current network
    const currentNetworkKey = blockchain
    const matching: Contact[] = []
    const other: Contact[] = []

    for (const contact of filteredContacts) {
      const contactNetworkKey = reverseAssetNetworkAdapter[contact.blockchain]
      if (contactNetworkKey === currentNetworkKey) {
        matching.push(contact)
      } else {
        other.push(contact)
      }
    }

    // Sort alphabetically within each group
    matching.sort((a, b) => a.name.localeCompare(b.name))
    other.sort((a, b) => a.name.localeCompare(b.name))

    return { matchingNetworkContacts: matching, otherNetworkContacts: other }
  }, [contacts, availableNetworks, inputValue, blockchain])

  // For backward compatibility with existing code that uses visibleContacts
  const visibleContacts = useMemo(
    () => [...matchingNetworkContacts, ...otherNetworkContacts],
    [matchingNetworkContacts, otherNetworkContacts]
  )

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
      try {
        const result = await validationRecipientAddress(
          inputValue,
          blockchain,
          userAddress ?? "",
          chainType
        )

        if (cancelled) return

        setIsValidating(false)

        if (result.isErr()) {
          setValidationError(
            renderRecipientAddressError(result.unwrapErr(), blockchain)
          )
          setValidatedAddress(null)
        } else {
          setValidationError(null)
          setValidatedAddress(inputValue)
        }
      } catch {
        if (cancelled) return
        setIsValidating(false)
        setValidationError(
          "An unexpected error occurred. Please try a different address."
        )
        setValidatedAddress(null)
      }
    }, VALIDATION_DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [inputValue, blockchain, userAddress, chainType, visibleContacts.length])

  const handleScroll = () => {
    if (!scrollContainerRef.current) return

    setIsScrolled(scrollContainerRef.current.scrollTop > 0)
  }

  const handleSelectAddress = (address: string) => {
    setClosedBySelection(true)
    setValue("recipient", address)
    onClose()
  }

  const handleClear = () => {
    setInputValue("")
    setIsValidating(false)
    setValidationError(null)
    setValidatedAddress(null)
  }

  const hasNoContacts =
    visibleContacts.length === 0 && !displayOwnAddress && !inputValue

  return (
    <BaseModalDialog
      title="Enter recipient address or select contact"
      open={open}
      onClose={onClose}
      onCloseAnimationEnd={() => {
        setIsScrolled(false)
        // Only clear input if modal was dismissed (X button, click outside)
        // Keep input if user selected an address so they can reopen and save as contact
        if (!closedBySelection) {
          handleClear()
        }
        setClosedBySelection(false)
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
            name="address"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && validatedAddress) {
                e.preventDefault()
                handleSelectAddress(validatedAddress)
              }
            }}
            loading={isValidating}
            onClear={handleClear}
            autoFocus
            placeholder="Enter address manually"
            data-testid="withdraw-target-account-field"
          />
          {validationError && (
            <ErrorMessage className="mt-3">{validationError}</ErrorMessage>
          )}
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex flex-col overflow-y-auto -mx-5 px-5 -mb-5 pb-5 space-y-5"
        >
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
                    className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsSaveContactModalOpen(true)
                    }}
                  >
                    <UserPlusIcon className="size-5" />
                  </button>
                </TooltipNew.Trigger>
                <TooltipNew.Content>Save as a new contact</TooltipNew.Content>
              </TooltipNew>
            </ListItem>
          ) : (
            <>
              {/* No contacts message */}
              {hasNoContacts && (
                <p className="text-sm text-gray-500 text-center py-4">
                  You haven't created any contacts on the{" "}
                  {isSupportedChainName(blockchain)
                    ? chainNameToNetworkName(blockchain)
                    : blockchain}{" "}
                  network yet. Please enter your destination address manually in
                  the field above.
                </p>
              )}

              {/* Contacts matching current network (selectable) */}
              {matchingNetworkContacts.length > 0 &&
                isSupportedChainName(blockchain) && (
                  <div>
                    <h3 className="flex items-center gap-1.5 text-gray-500 text-sm/6 font-medium">
                      <ContactsIcon className="size-4 shrink-0" />
                      Contacts on {chainNameToNetworkName(blockchain)}
                    </h3>

                    <div className="mt-1 space-y-1">
                      {matchingNetworkContacts.map((contact) => {
                        const chainKey =
                          reverseAssetNetworkAdapter[contact.blockchain]
                        const chainIcon = chainIcons[chainKey]
                        const chainName = chainNameToNetworkName(chainKey)

                        return (
                          <ListItem
                            key={contact.id}
                            onClick={() => {
                              if (onSelectContact) {
                                onSelectContact(contact)
                              } else {
                                setValue("blockchain", chainKey)
                                setValue("recipient", contact.address, {
                                  shouldValidate: true,
                                })
                              }
                              onClose()
                            }}
                          >
                            <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 outline-1 outline-gray-900/10 -outline-offset-1">
                              <WalletIcon className="text-gray-500 size-5" />
                            </div>
                            <ListItem.Content>
                              <ListItem.Title className="truncate">
                                {contact.name}
                              </ListItem.Title>
                              <ListItem.Subtitle>
                                {midTruncate(contact.address, 16)}
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
                      })}
                    </div>
                  </div>
                )}

              {/* Contacts on other networks (greyed out with tooltip) */}
              {otherNetworkContacts.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-1.5 text-gray-500 text-sm/6 font-medium">
                    <ContactsIcon className="size-4 shrink-0" />
                    Other networks
                  </h3>

                  <div className="mt-1 space-y-1">
                    {otherNetworkContacts.map((contact) => {
                      const chainKey =
                        reverseAssetNetworkAdapter[contact.blockchain]
                      const chainIcon = chainIcons[chainKey]
                      const chainName = chainNameToNetworkName(chainKey)

                      return (
                        <TooltipNew key={contact.id}>
                          <TooltipNew.Trigger>
                            <div className="w-full">
                              <ListItem className="opacity-50 cursor-not-allowed">
                                <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 outline-1 outline-gray-900/10 -outline-offset-1">
                                  <WalletIcon className="text-gray-500 size-5" />
                                </div>
                                <ListItem.Content>
                                  <ListItem.Title className="truncate">
                                    {contact.name}
                                  </ListItem.Title>
                                  <ListItem.Subtitle>
                                    {midTruncate(contact.address, 16)}
                                  </ListItem.Subtitle>
                                </ListItem.Content>
                                <ListItem.Content align="end">
                                  <ListItem.Title className="flex items-center gap-1 pb-4.5">
                                    <NetworkIcon
                                      chainIcon={chainIcon}
                                      sizeClassName="size-4"
                                    />
                                    <span className="capitalize">
                                      {chainName}
                                    </span>
                                  </ListItem.Title>
                                </ListItem.Content>
                              </ListItem>
                            </div>
                          </TooltipNew.Trigger>
                          <TooltipNew.Content>
                            Switch to {chainName} to send to this contact
                          </TooltipNew.Content>
                        </TooltipNew>
                      )
                    })}
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

              {/* Enter address manually option */}
              {onSwitchToAddressMode && !inputValue && (
                <div className="border-t border-gray-200 pt-4 -mx-5 px-5">
                  <ListItem
                    onClick={() => {
                      onSwitchToAddressMode()
                      onClose()
                    }}
                  >
                    <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 outline-1 outline-gray-900/10 -outline-offset-1">
                      <PencilIcon className="text-gray-500 size-5" />
                    </div>
                    <ListItem.Content>
                      <ListItem.Title>Enter address manually</ListItem.Title>
                      <ListItem.Subtitle>
                        Send to any wallet address
                      </ListItem.Subtitle>
                    </ListItem.Content>
                  </ListItem>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {validatedAddress && isSupportedChainName(blockchain) && (
        <ModalSaveContact
          open={isSaveContactModalOpen}
          onClose={() => setIsSaveContactModalOpen(false)}
          address={validatedAddress}
          network={blockchain}
          onSuccess={(contact) => {
            setIsSaveContactModalOpen(false)
            setClosedBySelection(true)
            if (onSelectContact) {
              onSelectContact(contact)
            }
            onClose()
          }}
        />
      )}
    </BaseModalDialog>
  )
}

export default ModalSelectRecipient

function renderRecipientAddressError(
  error: ValidateRecipientAddressErrorType,
  blockchain: string
) {
  const networkName = isSupportedChainName(blockchain)
    ? chainNameToNetworkName(blockchain)
    : blockchain

  switch (error) {
    case "SELF_WITHDRAWAL":
      return "You cannot withdraw to your own address. Please enter a different recipient address."
    case "ADDRESS_INVALID":
      return `You have selected ${networkName} as the network, but have entered an invalid ${networkName} address. Please double-check and try again.`
    case "NEAR_ACCOUNT_DOES_NOT_EXIST":
      return "The account doesn't exist on NEAR. Please enter a different recipient address."
    case "USER_ADDRESS_REQUIRED":
      return "Near Intents network requires your address. Try signing in again."
    default:
      return "An unexpected error occurred. Please enter a different recipient address."
  }
}
