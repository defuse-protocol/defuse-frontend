import type { BlockchainEnum } from "@defuse-protocol/internal-utils"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { TagIcon } from "@heroicons/react/20/solid"
import { getContacts } from "@src/app/(app)/(auth)/contacts/actions"
import ModalSelectRecipient from "@src/components/DefuseSDK/components/Modal/ModalSelectRecipient"
import { getMinWithdrawalHyperliquidAmount } from "@src/components/DefuseSDK/features/withdraw/utils/hyperliquid"
import { usePreparedNetworkLists } from "@src/components/DefuseSDK/hooks/useNetworkLists"
import { isSupportedChainName } from "@src/components/DefuseSDK/utils/blockchain"
import { findContactByAddress } from "@src/components/DefuseSDK/utils/contactUtils"
import { stringToColor } from "@src/components/DefuseSDK/utils/stringToColor"
import ErrorMessage from "@src/components/ErrorMessage"
import { WalletIcon } from "@src/icons"
import { useQuery } from "@tanstack/react-query"
import { useSelector } from "@xstate/react"
import clsx from "clsx"
import { type ReactNode, useEffect, useMemo, useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Controller } from "react-hook-form"
import { EmptyIcon } from "../../../../../../components/EmptyIcon"
import { ModalSelectNetwork } from "../../../../../../components/Network/ModalSelectNetwork"
import { SelectTriggerLike } from "../../../../../../components/Select/SelectTriggerLike"
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
  onRecipientContactChange?: (name: string | null) => void
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
  onRecipientContactChange,
}: RecipientSubFormProps) => {
  const [modalType, setModalType] = useState<"network" | "recipient" | null>(
    null
  )
  const isSelectNetworkModalOpen = modalType === "network"
  const isSelectRecipientModalOpen = modalType === "recipient"
  const closeModal = () => setModalType(null)

  const { data: contactsData } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => getContacts(),
  })
  const contacts = contactsData?.ok ? contactsData.value : []

  const recipient = watch("recipient")
  const blockchain = watch("blockchain")
  const blockchainEnum =
    blockchain && blockchain !== "near_intents"
      ? assetNetworkAdapter[blockchain]
      : null
  const matchingContact = useMemo(
    () => findContactByAddress(contacts, recipient, blockchainEnum),
    [contacts, recipient, blockchainEnum]
  )
  const contactColors = matchingContact
    ? stringToColor(
        `${matchingContact.name}${matchingContact.address}${matchingContact.blockchain}`
      )
    : null

  useEffect(() => {
    onRecipientContactChange?.(matchingContact?.name ?? null)
  }, [matchingContact, onRecipientContactChange])

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
            <SelectTriggerLike
              label={field.value ? "On this network" : "Select network"}
              value={determineBlockchainControllerLabel(
                field.value,
                isSupportedChainName(field.value) // filter out virtual "near_intents" chain
                  ? blockchainSelectItems[field.value]?.label
                  : undefined
              )}
              icon={determineBlockchainControllerIcon(
                field.value,
                isSupportedChainName(field.value) // filter out virtual "near_intents" chain
                  ? blockchainSelectItems[field.value]?.icon
                  : undefined
              )}
              onClick={() => setModalType("network")}
              data-testid="select-trigger-like"
              hint={determineBlockchainControllerHint(field.value)}
              disabled={false}
            />

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
            label="To this recipient"
            value={
              matchingContact
                ? matchingContact.name
                : field.value
                  ? midTruncate(field.value, 16)
                  : "Select a contact or enter an address"
            }
            error={fieldState.error?.message}
            icon={
              matchingContact && contactColors ? (
                <div
                  className="size-10 rounded-full flex items-center justify-center shrink-0 outline-1 outline-gray-900/10 -outline-offset-1"
                  style={{ backgroundColor: contactColors.background }}
                >
                  <WalletIcon
                    className="size-5"
                    style={{ color: contactColors.icon }}
                  />
                </div>
              ) : (
                <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <WalletIcon className="text-gray-500 size-5" />
                </div>
              )
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
        onRecipientContactChange={onRecipientContactChange}
        onContactSelect={(blockchain, recipient, contactName) => {
          onRecipientContactChange?.(contactName)
          actorRef.send({
            type: "WITHDRAW_FORM.UPDATE_BLOCKCHAIN_AND_RECIPIENT",
            params: { blockchain, recipient, proxyRecipient: null },
          })
          actorRef.send({
            type: "WITHDRAW_FORM.UPDATE_MIN_RECEIVED_AMOUNT",
            params: {
              minReceivedAmount: getMinWithdrawalHyperliquidAmount(
                blockchain,
                token
              ),
            },
          })
          closeModal()
        }}
      />

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
