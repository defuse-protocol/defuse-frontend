import type { BlockchainEnum } from "@defuse-protocol/internal-utils"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { ExclamationTriangleIcon, TagIcon } from "@heroicons/react/20/solid"
import {
  type Contact,
  getContacts,
} from "@src/app/(app)/(auth)/contacts/actions"
import ModalSaveContact from "@src/components/DefuseSDK/components/Modal/ModalSaveContact"
import ModalSelectRecipient from "@src/components/DefuseSDK/components/Modal/ModalSelectRecipient"
import { getMinWithdrawalHyperliquidAmount } from "@src/components/DefuseSDK/features/withdraw/utils/hyperliquid"
import { usePreparedNetworkLists } from "@src/components/DefuseSDK/hooks/useNetworkLists"
import { isSupportedChainName } from "@src/components/DefuseSDK/utils/blockchain"
import ErrorMessage from "@src/components/ErrorMessage"
import { WalletIcon } from "@src/icons"
import { useQuery } from "@tanstack/react-query"
import { useSelector } from "@xstate/react"
import clsx from "clsx"
import { type ReactNode, useEffect, useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Controller } from "react-hook-form"
import { EmptyIcon } from "../../../../../../components/EmptyIcon"
import { ModalSelectNetwork } from "../../../../../../components/Network/ModalSelectNetwork"
import { SelectTriggerLike } from "../../../../../../components/Select/SelectTriggerLike"
import TooltipNew from "../../../../../../components/TooltipNew"
import {
  getBlockchainsOptions,
  getNearIntentsOption,
} from "../../../../../../constants/blockchains"
import { useSolverLiquidityQuery } from "../../../../../../queries/solverLiquidityQuerires"
import type {
  SupportedChainName,
  TokenValue,
} from "../../../../../../types/base"
import {
  assetNetworkAdapter,
  reverseAssetNetworkAdapter,
} from "../../../../../../utils/adapters"
import { parseDestinationMemo } from "../../../../../machines/withdrawFormReducer"
import { WithdrawUIMachineContext } from "../../../../WithdrawUIMachineContext"
import { useCreateHLDepositAddress } from "../../hooks/useCreateHLDepositAddress"
import { useTokenBalances } from "../../hooks/useTokenBalances"
import type { WithdrawFormNearValues } from "../../index"
import { balancesSelector } from "../../selectors"
import {
  chainNameToNetworkName,
  chainTypeSatisfiesChainName,
  getBlockchainSelectItems,
  getFastWithdrawals,
  isNearIntentsNetwork,
  midTruncate,
} from "../../utils"
import { HotBalance } from "../HotBalance/HotBalance"
import { LongWithdrawWarning } from "../LongWithdrawWarning"

type RecipientSubFormProps = {
  form: UseFormReturn<WithdrawFormNearValues>
  chainType: AuthMethod | undefined
  userAddress: string | undefined
  displayAddress: string | undefined
  tokenInBalance: TokenValue | undefined
  /** Contact ID to pre-select, enabling contact mode */
  presetContactId: string | undefined
  /** Network that was requested but has no compatible tokens */
  noTokenForPresetNetwork?: SupportedChainName | null
  /** Called when the selected contact changes */
  onContactChange?: (contact: Contact | null) => void
}

export const RecipientSubForm = ({
  form: {
    control,
    register,
    setValue,
    getValues,
    watch,
    formState: { errors },
  },
  chainType,
  userAddress,
  displayAddress,
  tokenInBalance,
  presetContactId,
  noTokenForPresetNetwork,
  onContactChange,
}: RecipientSubFormProps) => {
  const [modalType, setModalType] = useState<"network" | "recipient" | null>(
    null
  )
  const isSelectNetworkModalOpen = modalType === "network"
  const isSelectRecipientModalOpen = modalType === "recipient"
  const closeModal = () => setModalType(null)

  // Contact mode vs address mode state
  type RecipientMode = "contact" | "address"
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("address")
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isSaveContactModalOpen, setIsSaveContactModalOpen] = useState(false)

  // Notify parent when selected contact changes
  useEffect(() => {
    onContactChange?.(selectedContact)
  }, [selectedContact, onContactChange])

  // Fetch contacts for presetContactId lookup and recipient modal
  const { data: contactsData } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => getContacts(),
  })
  const contacts = contactsData?.ok ? contactsData.value : []

  // Initialize contact mode if presetContactId is provided
  useEffect(() => {
    if (presetContactId && contacts.length > 0) {
      const contact = contacts.find((c) => c.id === presetContactId)
      if (contact) {
        setRecipientMode("contact")
        setSelectedContact(contact)
        // Form values should already be set via presetRecipient and presetNetwork
      }
    }
  }, [presetContactId, contacts])

  // Watch for address+network combinations that match an existing contact
  const currentRecipient = watch("recipient")
  const currentBlockchain = watch("blockchain")

  useEffect(() => {
    // Only check in address mode (don't interfere when already in contact mode)
    if (recipientMode !== "address") return
    // Need both recipient and blockchain to match
    if (!currentRecipient || !currentBlockchain) return
    // Skip near_intents network (not a real blockchain for contacts)
    if (!isSupportedChainName(currentBlockchain)) return

    const blockchainEnum = assetNetworkAdapter[currentBlockchain]
    const matchingContact = contacts.find(
      (c) =>
        c.address.toLowerCase() === currentRecipient.toLowerCase() &&
        c.blockchain === blockchainEnum
    )

    if (matchingContact) {
      setRecipientMode("contact")
      setSelectedContact(matchingContact)
    }
  }, [currentRecipient, currentBlockchain, contacts, recipientMode])

  const actorRef = WithdrawUIMachineContext.useActorRef()
  const { formRef, balances: balancesData } =
    WithdrawUIMachineContext.useSelector((state) => {
      return {
        state,
        formRef: state.context.withdrawFormRef,
        balances: balancesSelector(state),
      }
    })

  const { token, tokenOut, tokenOutDeployment, parsedAmountIn } = useSelector(
    formRef,
    (state) => {
      return {
        token: state.context.tokenIn,
        tokenOut: state.context.tokenOut,
        tokenOutDeployment: state.context.tokenOutDeployment,
        parsedAmountIn: state.context.parsedAmount,
        recipient: state.context.recipient,
      }
    }
  )

  const isChainTypeSatisfiesChainName = chainTypeSatisfiesChainName(
    chainType,
    tokenOutDeployment.chainName
  )

  const hasAnyBalance = tokenInBalance != null && tokenInBalance?.amount > 0
  const poaBridgeBalances = useTokenBalances(token, hasAnyBalance)
  const { data: liquidityData } = useSolverLiquidityQuery()

  const maxWithdrawals = hasAnyBalance
    ? getFastWithdrawals(token, balancesData, poaBridgeBalances, liquidityData)
    : {}

  const blockchainSelectItems = getBlockchainSelectItems(token, maxWithdrawals)
  const { availableNetworks, disabledNetworks } = usePreparedNetworkLists({
    networks: getBlockchainsOptions(),
    token,
    near_intents: true,
  })

  // temporary disable it, it's not working properly
  const showHotBalances = false && Object.keys(maxWithdrawals).length > 0

  const onChangeNetwork = (network: SupportedChainName) => {
    setValue("blockchain", network)
    actorRef.send({
      type: "WITHDRAW_FORM.UPDATE_MIN_RECEIVED_AMOUNT",
      params: {
        minReceivedAmount: getMinWithdrawalHyperliquidAmount(network, token),
      },
    })
    closeModal()
  }

  const onIntentsNetworkSelect = () => {
    setValue("blockchain", "near_intents")
    closeModal()
  }

  const { data: hyperliquidDepositAddress } = useCreateHLDepositAddress(
    token,
    watch("blockchain"),
    watch("recipient")
  )

  useEffect(() => {
    if (hyperliquidDepositAddress?.tag === "ok") {
      const recipient = getValues().recipient
      if (recipient) {
        actorRef.send({
          type: "WITHDRAW_FORM.RECIPIENT",
          params: {
            recipient: recipient,
            proxyRecipient: hyperliquidDepositAddress.value,
          },
        })
      }
    }
  }, [hyperliquidDepositAddress, getValues, actorRef])

  useEffect(() => {
    const sub = watch(async (value, { name }) => {
      const blockchain = name === "blockchain" && value[name]
      if (blockchain) {
        actorRef.send({
          type: "WITHDRAW_FORM.UPDATE_BLOCKCHAIN",
          params: {
            blockchain: blockchain,
          },
        })
      }
    })
    return () => {
      sub.unsubscribe()
    }
  }, [watch, actorRef])

  return (
    <>
      <Controller
        name="blockchain"
        control={control}
        rules={{
          required: "This field is required",
          deps: "recipient",
        }}
        render={({ field }) => (
          <>
            {noTokenForPresetNetwork != null ? (
              // Error state: user has no tokens for the requested network
              <SelectTriggerLike
                label="Network"
                value={chainNameToNetworkName(noTokenForPresetNetwork)}
                icon={
                  <div className="size-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <ExclamationTriangleIcon className="text-red-500 size-5" />
                  </div>
                }
                data-testid="select-trigger-like"
                error={`You have no assets available on ${chainNameToNetworkName(noTokenForPresetNetwork)}`}
                disabled // Hide chevron to indicate non-interactive state
              />
            ) : recipientMode === "contact" ? (
              // In contact mode, network is locked (determined by contact)
              <TooltipNew>
                <TooltipNew.Trigger>
                  <SelectTriggerLike
                    label="Network"
                    value={determineBlockchainControllerLabel(
                      field.value,
                      isSupportedChainName(field.value)
                        ? blockchainSelectItems[field.value]?.label
                        : undefined
                    )}
                    icon={determineBlockchainControllerIcon(
                      field.value,
                      isSupportedChainName(field.value)
                        ? blockchainSelectItems[field.value]?.icon
                        : undefined
                    )}
                    onClick={() => {}} // No-op in contact mode
                    data-testid="select-trigger-like"
                    hint={determineBlockchainControllerHint(field.value)}
                    disabled={false}
                  />
                </TooltipNew.Trigger>
                <TooltipNew.Content>
                  The network is determined by the contact.
                </TooltipNew.Content>
              </TooltipNew>
            ) : (
              // In address mode, network selector is interactive
              <SelectTriggerLike
                label={field.value ? "Network" : "Select network"}
                value={determineBlockchainControllerLabel(
                  field.value,
                  isSupportedChainName(field.value)
                    ? blockchainSelectItems[field.value]?.label
                    : undefined
                )}
                icon={determineBlockchainControllerIcon(
                  field.value,
                  isSupportedChainName(field.value)
                    ? blockchainSelectItems[field.value]?.icon
                    : undefined
                )}
                onClick={() => setModalType("network")}
                data-testid="select-trigger-like"
                hint={determineBlockchainControllerHint(field.value)}
                disabled={false}
              />
            )}

            <ModalSelectNetwork
              selectNetwork={onChangeNetwork}
              selectedNetwork={getValues("blockchain")}
              isOpen={isSelectNetworkModalOpen}
              onClose={closeModal}
              availableNetworks={availableNetworks}
              disabledNetworks={disabledNetworks}
              onIntentsSelect={onIntentsNetworkSelect}
              renderValueDetails={
                showHotBalances
                  ? (address: string) => (
                      <HotBalance
                        symbol={tokenOut.symbol}
                        hotBalance={
                          blockchainSelectItems[
                            reverseAssetNetworkAdapter[
                              address as BlockchainEnum
                            ]
                          ]?.hotBalance
                        }
                      />
                    )
                  : undefined
              }
            />
          </>
        )}
      />

      <Controller
        name="recipient"
        control={control}
        rules={{
          required: "Recipient is required",
        }}
        render={({ field, fieldState }) => (
          <SelectTriggerLike
            label="Recipient"
            value={
              recipientMode === "contact" && selectedContact
                ? selectedContact.name
                : field.value
                  ? midTruncate(field.value, 16)
                  : "Select a contact or enter an address"
            }
            subtitle={
              recipientMode === "contact" && selectedContact
                ? midTruncate(field.value, 16)
                : undefined
            }
            error={fieldState.error?.message}
            icon={
              <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <WalletIcon className="text-gray-500 size-5" />
              </div>
            }
            onClick={() => setModalType("recipient")}
          />
        )}
      />

      <ModalSelectRecipient
        open={isSelectRecipientModalOpen}
        onClose={closeModal}
        chainType={chainType}
        userAddress={userAddress}
        displayAddress={displayAddress}
        availableNetworks={availableNetworks}
        displayOwnAddress={
          isChainTypeSatisfiesChainName &&
          !isNearIntentsNetwork(getValues("blockchain")) &&
          userAddress != null &&
          getValues("blockchain") !== "hyperliquid"
        }
        onSelectContact={(contact) => {
          const chainKey = reverseAssetNetworkAdapter[contact.blockchain]
          setRecipientMode("contact")
          setSelectedContact(contact)
          setValue("blockchain", chainKey)
          setValue("recipient", contact.address, { shouldValidate: true })
        }}
      />

      {/* Save as contact option in address mode */}
      {recipientMode === "address" &&
        watch("recipient") &&
        !errors.recipient &&
        isSupportedChainName(watch("blockchain")) && (
          <button
            type="button"
            onClick={() => setIsSaveContactModalOpen(true)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 -mt-2"
          >
            Save as contact
          </button>
        )}

      {isSupportedChainName(currentBlockchain) && (
        <ModalSaveContact
          open={isSaveContactModalOpen}
          address={currentRecipient}
          network={currentBlockchain}
          onClose={() => setIsSaveContactModalOpen(false)}
          onSuccess={(contact) => {
            setRecipientMode("contact")
            setSelectedContact(contact)
          }}
        />
      )}

      <Controller
        name="blockchain"
        control={control}
        render={({ field }) =>
          field.value === "xrpledger" ? (
            <>
              <div>
                <label
                  className={clsx(
                    "flex items-center gap-3 rounded-3xl border bg-white p-4 cursor-text hover:outline focus-within:outline",
                    errors.destinationMemo
                      ? "border-red-500 hover:border-red-500 hover:outline-red-500 focus-within:border-red-500 focus-within:outline-red-500"
                      : "border-gray-200 hover:border-gray-700 hover:outline-gray-700 focus-within:border-gray-700 focus-within:outline-gray-700"
                  )}
                >
                  <div className="bg-gray-100 rounded-full size-10 shrink-0 flex items-center justify-center">
                    <TagIcon className="text-gray-500 size-5" />
                  </div>
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-sm/none font-medium text-gray-500">
                      Destination Tag (optional)
                    </span>
                    <input
                      id="destinationMemo"
                      type="text"
                      className="block w-full text-base/none font-semibold text-gray-700 placeholder:text-gray-400 focus:outline-none leading-none ring-0 border-none p-0"
                      {...register("destinationMemo", {
                        validate: {
                          uint32: (value) => {
                            if (value == null || value === "") return

                            if (
                              parseDestinationMemo(
                                value,
                                tokenOutDeployment.chainName
                              ) == null
                            ) {
                              return "Should be a number"
                            }
                          },
                        },
                      })}
                    />
                  </div>
                </label>

                {errors.destinationMemo && (
                  <ErrorMessage className="mt-1">
                    {errors.destinationMemo?.message}
                  </ErrorMessage>
                )}
              </div>
            </>
          ) : (
            <></>
          )
        }
      />

      {tokenOutDeployment.bridge === "poa" && showHotBalances && (
        <LongWithdrawWarning
          amountIn={parsedAmountIn}
          symbol={tokenOut.symbol}
          hotBalance={
            blockchainSelectItems[tokenOutDeployment.chainName]?.hotBalance
          }
        />
      )}
    </>
  )
}

export const isFirstBlockchainSelected = (
  fieldValue: SupportedChainName | "near_intents",
  blockchainSelectItems: Record<string, { value: BlockchainEnum }>
): boolean => {
  const firstBlockchain = Object.values(blockchainSelectItems)[0]
  return (
    firstBlockchain != null &&
    fieldValue === reverseAssetNetworkAdapter[firstBlockchain.value]
  )
}

function determineBlockchainControllerLabel(
  blockchain: SupportedChainName | "near_intents",
  blockchainSelectedLabel?: string
) {
  if (isNearIntentsNetwork(blockchain)) {
    return blockchainSelectedLabel ?? "NEAR Intents"
  }
  return blockchainSelectedLabel ?? "Select network"
}

export function determineBlockchainControllerIcon(
  blockchain: SupportedChainName | "near_intents",
  blockchainSelectedIcon?: ReactNode
) {
  if (isNearIntentsNetwork(blockchain)) {
    return getNearIntentsOption().intents.icon
  }
  return blockchainSelectedIcon ?? <EmptyIcon />
}

function determineBlockchainControllerHint(
  blockchain: SupportedChainName | "near_intents"
) {
  if (isNearIntentsNetwork(blockchain)) {
    return "Internal network"
  }
}
