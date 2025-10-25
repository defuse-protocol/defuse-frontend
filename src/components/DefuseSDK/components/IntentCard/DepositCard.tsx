import { InfoIcon } from "@phosphor-icons/react"
import { Box, Flex, Link, Spinner, Text } from "@radix-ui/themes"
import { chainTxExplorer } from "@src/components/DefuseSDK/utils/chainTxExplorer"
import { useSelector } from "@xstate/react"
import type { ActorRefFrom } from "xstate"
import { DepositMode } from "../../features/machines/depositFormReducer"
import type { depositStatusMachine } from "../../features/machines/depositStatusMachine"
import {
  oneClickStatuses,
  statusesToTrack,
} from "../../features/machines/oneClickStatusMachine"
import { formatTokenValue } from "../../utils/format"
import { AssetComboIcon } from "../Asset/AssetComboIcon"
import { Tooltip, TooltipContent, TooltipTrigger } from "../Tooltip"
import { CopyButton } from "./CopyButton"

type DepositCardProps = {
  depositStatusActorRef: ActorRefFrom<typeof depositStatusMachine>
}

const EXPLORER_NEAR_INTENTS = "https://explorer.near-intents.org"

function getStatusDisplayInfo(status: string | null) {
  if (!status) {
    return { label: "Pending...", color: undefined, showSpinner: true }
  }

  const displayStatus =
    status in oneClickStatuses
      ? oneClickStatuses[status as keyof typeof oneClickStatuses]
      : status

  const isTracking = status && (statusesToTrack as Set<string>).has(status)
  const isSuccess = status === "SUCCESS"
  const isFailed = status === "FAILED" || status === "REFUNDED"

  return {
    label: displayStatus,
    color: isFailed ? "red" : isSuccess ? "green" : undefined,
    showSpinner: isTracking,
  }
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
    depositMode,
    blockchain,
    memo,
  } = state.context

  const statusInfo = getStatusDisplayInfo(status)

  const memoToUrl = memo ? `_${memo}` : ""
  const explorerUrl =
    depositMode === DepositMode.ONE_CLICK
      ? depositAddress
        ? `${EXPLORER_NEAR_INTENTS}/transactions/${depositAddress}${memoToUrl}`
        : txHash
          ? chainTxExplorer(blockchain) + txHash
          : null
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

          {depositMode === DepositMode.ONE_CLICK && (
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
          {depositMode === DepositMode.SIMPLE && (
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
            <Text size="1" weight="medium" color="gray">
              From {truncate(userAddress)}
            </Text>
          </Box>

          <Box>
            <Text size="1" weight="medium" color="green">
              +
              {formatTokenValue(totalAmountIn.amount, totalAmountIn.decimals, {
                min: 0.0001,
                fractionDigits: 4,
              })}{" "}
              {tokenIn.symbol}
            </Text>
          </Box>
        </Flex>

        <Flex direction="column" gap="1" mt="1">
          {depositAddress && explorerUrl && (
            <Flex align="center" gap="1">
              <Text size="1" color="gray">
                Track your deposit progress on explorer:{" "}
                <Link href={explorerUrl} target="_blank" color="blue">
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
      </Flex>
    </Flex>
  )
}

function truncate(hash: string) {
  return `${hash.slice(0, 5)}...${hash.slice(-5)}`
}
