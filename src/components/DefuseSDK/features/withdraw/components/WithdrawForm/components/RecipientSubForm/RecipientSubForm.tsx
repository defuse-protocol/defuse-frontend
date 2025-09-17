import { assert, type BlockchainEnum } from "@defuse-protocol/internal-utils"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { MagicWandIcon, PersonIcon } from "@radix-ui/react-icons"
import { Box, Flex, IconButton, Text, TextField } from "@radix-ui/themes"
import { getMinWithdrawalHyperliquidAmount } from "@src/components/DefuseSDK/features/withdraw/utils/hyperliquid"
import { usePreparedNetworkLists } from "@src/components/DefuseSDK/hooks/useNetworkLists"
import { isSupportedChainName } from "@src/components/DefuseSDK/utils/blockchain"
import { useSelector } from "@xstate/react"
import { type ReactNode, useEffect, useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Controller } from "react-hook-form"
import { EmptyIcon } from "../../../../../../components/EmptyIcon"
import { ModalSelectNetwork } from "../../../../../../components/Network/ModalSelectNetwork"
import { Select } from "../../../../../../components/Select/Select"
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
import { reverseAssetNetworkAdapter } from "../../../../../../utils/adapters"
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
} from "../../utils"
import { truncateUserAddress } from "../../utils"
import { HotBalance } from "../HotBalance/HotBalance"
import { LongWithdrawWarning } from "../LongWithdrawWarning"
import { validateAddressSoft } from "./validation"

type RecipientSubFormProps = {
  form: UseFormReturn<WithdrawFormNearValues>
  chainType: AuthMethod | undefined
  userAddress: string | undefined
  displayAddress: string | undefined
  tokenInBalance: TokenValue | undefined
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
}: RecipientSubFormProps) => {
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false)
  const actorRef = WithdrawUIMachineContext.useActorRef()
  const { formRef, balances: balancesData } =
    WithdrawUIMachineContext.useSelector((state) => {
      return {
        state,
        formRef: state.context.withdrawFormRef,
        balances: balancesSelector(state),
      }
    })

  const { token, tokenOut, parsedAmountIn, recipient } = useSelector(
    formRef,
    (state) => {
      return {
        token: state.context.tokenIn,
        tokenOut: state.context.tokenOut,
        parsedAmountIn: state.context.parsedAmount,
        recipient: state.context.recipient,
      }
    }
  )

  const isChainTypeSatisfiesChainName = chainTypeSatisfiesChainName(
    chainType,
    tokenOut.chainName
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

  const showHotBalances = Object.keys(maxWithdrawals).length > 0

  const onCloseNetworkModal = () => setIsNetworkModalOpen(false)

  const onChangeNetwork = (network: SupportedChainName) => {
    setValue("blockchain", network)
    actorRef.send({
      type: "WITHDRAW_FORM.UPDATE_MIN_RECEIVED_AMOUNT",
      params: {
        minReceivedAmount: getMinWithdrawalHyperliquidAmount(network, token),
      },
    })
    onCloseNetworkModal()
  }

  const onIntentsNetworkSelect = () => {
    setValue("blockchain", "near_intents")
    onCloseNetworkModal()
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
    <Flex direction="column" gap="2">
      <Box px="2" asChild>
        <Text size="1" weight="bold">
          Recipient
        </Text>
      </Box>
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
              label={determineBlockchainControllerLabel(
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
              onClick={() => setIsNetworkModalOpen(true)}
              hint={
                <Select.Hint>
                  {determineBlockchainControllerHint(field.value)}
                </Select.Hint>
              }
              disabled={false}
            />

            <ModalSelectNetwork
              selectNetwork={onChangeNetwork}
              selectedNetwork={getValues("blockchain")}
              isOpen={isNetworkModalOpen}
              onClose={() => setIsNetworkModalOpen(false)}
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

      {tokenOut.bridge === "poa" && showHotBalances && (
        <LongWithdrawWarning
          amountIn={parsedAmountIn}
          symbol={tokenOut.symbol}
          hotBalance={blockchainSelectItems[tokenOut.chainName]?.hotBalance}
        />
      )}

      <Flex direction="column" gap="1">
        <Flex gap="2" align="center">
          <Box asChild flexGrow="1">
            <TextField.Root
              size="3"
              {...register("recipient", {
                validate: {
                  pattern: (value, formValues) => {
                    const error = validateAddressSoft(
                      value,
                      formValues.blockchain,
                      userAddress ?? "",
                      chainType
                    )
                    return error ? error : true
                  },
                },
              })}
              placeholder="Enter wallet address"
            >
              <TextField.Slot>
                <PersonIcon height="16" width="16" />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          {isChainTypeSatisfiesChainName &&
            !isNearIntentsNetwork(getValues("blockchain")) &&
            userAddress != null &&
            recipient !== userAddress &&
            getValues("blockchain") !== "hyperliquid" && (
              <IconButton
                type="button"
                onClick={() => {
                  assert(
                    displayAddress,
                    "Display address could not be retrieved from the wallet provider"
                  )
                  setValue("recipient", displayAddress, {
                    shouldValidate: true,
                  })
                }}
                variant="outline"
                size="3"
                title={`Autofill with your address ${truncateUserAddress(
                  userAddress
                )}`}
                aria-label={`Autofill with your address ${truncateUserAddress(
                  userAddress
                )}`}
              >
                <MagicWandIcon />
              </IconButton>
            )}
        </Flex>

        {errors.recipient && (
          <Box px="2" asChild>
            <Text size="1" color="red" weight="medium">
              {errors.recipient.message}
            </Text>
          </Box>
        )}
      </Flex>

      <Controller
        name="blockchain"
        control={control}
        render={({ field }) =>
          field.value === "xrpledger" ? (
            <Flex direction="column" gap="1">
              <Box px="2" asChild>
                <Text size="1" weight="bold">
                  Destination Tag (optional)
                </Text>
              </Box>
              <TextField.Root
                size="3"
                {...register("destinationMemo", {
                  validate: {
                    uint32: (value) => {
                      if (value == null || value === "") return

                      if (
                        parseDestinationMemo(value, tokenOut.chainName) == null
                      ) {
                        return "Should be a number"
                      }
                    },
                  },
                })}
                placeholder="Enter destination tag"
              />
              {errors.destinationMemo && (
                <Box px="2" asChild>
                  <Text size="1" color="red" weight="medium">
                    {errors.destinationMemo.message}
                  </Text>
                </Box>
              )}
            </Flex>
          ) : (
            <></>
          )
        }
      />
    </Flex>
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

function determineBlockchainControllerIcon(
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
  return "Network"
}
