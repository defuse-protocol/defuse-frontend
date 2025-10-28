import { InfoIcon } from "@phosphor-icons/react"
import { Box, Flex, Link, Spinner, Text } from "@radix-ui/themes"
import { chainTxExplorer } from "@src/components/DefuseSDK/utils/chainTxExplorer"
import { useSelector } from "@xstate/react"
import type { ActorRefFrom } from "xstate"
import type { depositStatusMachine } from "../../features/machines/depositStatusMachine"
import * as format from "../../utils/format"
import {
  EXPLORER_NEAR_INTENTS,
  getStatusDisplayInfo,
  truncate,
} from "../../utils/getStatusDisplayInfo"
import { AssetComboIcon } from "../Asset/AssetComboIcon"
import { Tooltip, TooltipContent, TooltipTrigger } from "../Tooltip"
import { CopyButton } from "./CopyButton"

type DepositCardProps = {
  depositStatusActorRef: ActorRefFrom<typeof depositStatusMachine>
}

export function DepositCard({ depositStatusActorRef }: DepositCardProps) {
  const state = useSelector(depositStatusActorRef, (state) => state)
  const {
    userAddress,
    depositAddress,
    txHash,
    tokenIn,
    status,
    totalAmountIn,
    is1cs,
    blockchain,
    memo,
  } = state.context

  const statusInfo = getStatusDisplayInfo(status)
  const memoToUrl = memo ? `_${memo}` : ""

  let oneClickExplorerUrl = null
  if (is1cs) {
    oneClickExplorerUrl = depositAddress
      ? `${EXPLORER_NEAR_INTENTS}/transactions/${depositAddress}${memoToUrl}`
      : null
  }

  const transactionExplorerUrl = txHash
    ? chainTxExplorer(blockchain) + txHash
    : null

  return (
    <Flex p="2" gap="3">
      <Box pt="2">
        <AssetComboIcon {...tokenIn} />
      </Box>

      <Flex direction="column" flexGrow="1">
        <Flex>
          <Box flexGrow="1">
            <Text size="2" weight="medium">
              Deposit
            </Text>
          </Box>

          {is1cs && (
            <Flex gap="1" align="center">
              {(statusInfo.showSpinner || state.matches("checking")) && (
                <Spinner size="1" />
              )}

              <Text
                size="1"
                weight="medium"
                color={statusInfo.color as "red" | "green" | undefined}
              >
                {statusInfo.label}
              </Text>
            </Flex>
          )}
          {!is1cs && (
            <Flex gap="1" align="center">
              <Text size="1" weight="medium" color="green">
                Completed
              </Text>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon />
                </TooltipTrigger>
                <TooltipContent>
                  Settlement in flight. Please wait for it to complete.
                </TooltipContent>
              </Tooltip>
            </Flex>
          )}
        </Flex>

        <Flex align="center">
          <Box flexGrow="1">
            <Flex align="center" gap="1">
              <Text size="1" weight="medium" color="gray">
                From {truncate(userAddress)}
              </Text>
              <CopyButton text={userAddress} ariaLabel="Copy Deposit address" />
            </Flex>
          </Box>

          <Box>
            <Text size="1" weight="medium" color="green">
              +
              {format.formatTokenValue(
                totalAmountIn.amount,
                totalAmountIn.decimals,
                {
                  min: 0.0001,
                  fractionDigits: 4,
                }
              )}{" "}
              {tokenIn.symbol}
            </Text>
          </Box>
        </Flex>

        {is1cs && (
          <Flex direction="column" gap="1" mt="1.5">
            {depositAddress && oneClickExplorerUrl && (
              <Flex align="center" gap="1">
                <Text size="1" color="gray">
                  Track your deposit progress on explorer:{" "}
                  <Link href={oneClickExplorerUrl} target="_blank" color="blue">
                    {truncate(depositAddress)}
                  </Link>
                </Text>

                <CopyButton
                  text={depositAddress}
                  ariaLabel="Copy Deposit address"
                />
              </Flex>
            )}
          </Flex>
        )}
        {txHash && transactionExplorerUrl && (
          <Flex align="center" gap="1" mt="1">
            <Text size="1" color="gray">
              Transaction:{" "}
              <Link href={transactionExplorerUrl} target="_blank" color="blue">
                {truncate(txHash)}
              </Link>
            </Text>

            <CopyButton text={txHash} ariaLabel="Copy Transaction hash" />
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
