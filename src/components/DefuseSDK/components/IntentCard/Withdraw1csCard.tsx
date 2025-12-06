import { GetExecutionStatusResponse } from "@defuse-protocol/one-click-sdk-typescript"
import { Box, Button, Flex, Link, Spinner, Text } from "@radix-ui/themes"
import { useSelector } from "@xstate/react"
import type { ActorRefFrom } from "xstate"
import type { withdrawStatus1csMachine } from "../../features/machines/withdrawStatus1csMachine"
import { formatTokenValue } from "../../utils/format"
import { AssetComboIcon } from "../Asset/AssetComboIcon"
import { CopyButton } from "./CopyButton"

type Withdraw1csCardProps = {
  withdrawStatusActorRef: ActorRefFrom<typeof withdrawStatus1csMachine>
}

const EXPLORER_NEAR_INTENTS = "https://explorer.near-intents.org"

const Status = GetExecutionStatusResponse.status

const withdraw1csStatuses: Record<GetExecutionStatusResponse.status, string> = {
  [Status.KNOWN_DEPOSIT_TX]: "Known Deposit Tx",
  [Status.PROCESSING]: "Processing",
  [Status.SUCCESS]: "Completed",
  [Status.REFUNDED]: "Refunded",
  [Status.FAILED]: "Failed",
  [Status.PENDING_DEPOSIT]: "Pending...",
  [Status.INCOMPLETE_DEPOSIT]: "Incomplete Deposit",
}

const statusesToTrack = new Set<GetExecutionStatusResponse.status>([
  Status.KNOWN_DEPOSIT_TX,
  Status.PENDING_DEPOSIT,
  Status.INCOMPLETE_DEPOSIT,
  Status.PROCESSING,
])

function getStatusDisplayInfo(
  status: GetExecutionStatusResponse.status | null,
  isChecking: boolean
) {
  if (!status) {
    return { label: "Pending...", color: undefined, showSpinner: true }
  }

  const displayStatus = withdraw1csStatuses[status]
  const isTracking = statusesToTrack.has(status)
  const isSuccess = status === Status.SUCCESS
  const isFailed = status === Status.FAILED || status === Status.REFUNDED

  return {
    label: displayStatus,
    color: isFailed ? "red" : isSuccess ? "green" : undefined,
    showSpinner: isTracking || isChecking,
  }
}

export function Withdraw1csCard({
  withdrawStatusActorRef,
}: Withdraw1csCardProps) {
  const state = useSelector(withdrawStatusActorRef, (state) => state)
  const {
    tokenIn,
    tokenOut,
    depositAddress,
    status,
    totalAmountIn,
    totalAmountOut,
  } = state.context

  const statusInfo = getStatusDisplayInfo(status, state.matches("checking"))

  const explorerUrl = depositAddress
    ? `${EXPLORER_NEAR_INTENTS}/transactions/${depositAddress}`
    : null

  return (
    <Flex p="2" gap="3">
      <Box pt="2">
        <AssetComboIcon {...tokenOut} />
      </Box>

      <Flex direction="column" flexGrow="1">
        <Flex>
          <Box flexGrow="1">
            <Text size="2" weight="medium">
              Withdraw
            </Text>
          </Box>

          <Flex gap="1" align="center">
            {statusInfo.showSpinner && <Spinner size="1" />}

            <Text
              size="1"
              weight="medium"
              color={statusInfo.color as "red" | "green" | undefined}
              data-testid={
                status === Status.SUCCESS ? "withdraw-success" : undefined
              }
            >
              {statusInfo.label}
            </Text>

            {state.can({ type: "RETRY" }) && (
              <Button
                size="1"
                variant="outline"
                onClick={() => withdrawStatusActorRef.send({ type: "RETRY" })}
              >
                retry
              </Button>
            )}
          </Flex>
        </Flex>

        <Flex align="center">
          <Box flexGrow="1">
            <Text size="1" weight="medium" color="gray">
              -
              {formatTokenValue(totalAmountIn.amount, totalAmountIn.decimals, {
                min: 0.0001,
                fractionDigits: 4,
              })}{" "}
              {tokenIn.symbol}
            </Text>
          </Box>

          <Box>
            <Text size="1" weight="medium" color="green">
              +
              {formatTokenValue(
                totalAmountOut.amount,
                totalAmountOut.decimals,
                {
                  min: 0.0001,
                  fractionDigits: 4,
                }
              )}{" "}
              {tokenOut.symbol}
            </Text>
          </Box>
        </Flex>

        <Flex direction="column" gap="1" mt="1">
          {depositAddress && explorerUrl && (
            <Flex align="center" gap="1">
              <Text size="1" color="gray">
                Track your withdrawal progress on explorer:{" "}
                <Link href={explorerUrl} target="_blank" color="blue">
                  {truncateHash(depositAddress)}
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

function truncateHash(hash: string) {
  return `${hash.slice(0, 5)}...${hash.slice(-5)}`
}
