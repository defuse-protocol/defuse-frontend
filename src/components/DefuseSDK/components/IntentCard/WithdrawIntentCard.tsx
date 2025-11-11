import { Box, Button, Flex, Link, Spinner, Text } from "@radix-ui/themes"
import { useSelector } from "@xstate/react"
import type { ActorRefFrom, StateValueFrom } from "xstate"
import type { intentStatusMachine } from "../../features/machines/intentStatusMachine"
import { assert } from "../../utils/assert"
import { blockExplorerTxLinkFactory } from "../../utils/chainTxExplorer"
import { formatTokenValue } from "../../utils/format"
import { AssetComboIcon } from "../Asset/AssetComboIcon"
import { CopyButton } from "./CopyButton"

type WithdrawIntentCardProps = {
  intentStatusActorRef: ActorRefFrom<typeof intentStatusMachine>
}

export function WithdrawIntentCard({
  intentStatusActorRef,
}: WithdrawIntentCardProps) {
  const state = useSelector(intentStatusActorRef, (state) => state)
  const { intentDescription, bridgeTransactionResult } = state.context

  assert(intentDescription.type === "withdraw", "Type must be withdraw")
  const { amountWithdrawn, tokenOut, tokenOutDeployment } = intentDescription

  const sourceTxHash = state.context.txHash
  const sourceTxUrl =
    sourceTxHash != null
      ? blockExplorerTxLinkFactory("near", sourceTxHash)
      : undefined

  const destTxHash = bridgeTransactionResult?.destinationTxHash
  const destTxUrl =
    destTxHash != null
      ? blockExplorerTxLinkFactory(
          intentDescription.nearIntentsNetwork
            ? "near"
            : tokenOutDeployment.chainName,
          destTxHash
        )
      : undefined

  const retryCount = state.context.bridgeRetryCount

  return (
    <Flex p="2" gap="3">
      <Box pt="2">
        <AssetComboIcon
          {...tokenOut}
          chainName={tokenOutDeployment.chainName}
        />
      </Box>

      <Flex direction="column" gap="1" flexGrow="1">
        <Flex>
          <Box flexGrow="1">
            <Text size="2" weight="medium">
              Withdraw
            </Text>
          </Box>

          <Flex gap="1" align="center">
            {retryCount > 0 &&
              (state.matches("waitingForBridge") ||
                state.matches("retryDelay")) && (
                <Text size="1" color="gray">
                  Retried {retryCount} times
                </Text>
              )}

            {(state.matches("pending") ||
              state.matches("checking") ||
              state.matches("waitingForBridge") ||
              state.matches("retryDelay")) && <Spinner size="1" />}

            <Text
              size="1"
              weight="medium"
              color={
                state.matches("error") || state.matches("not_valid")
                  ? "red"
                  : undefined
              }
              data-testid={
                state.value === "success" ? "withdraw-success" : undefined
              }
            >
              {renderStatusLabel(state.value)}
            </Text>

            {state.can({ type: "RETRY" }) && (
              <Button
                size="1"
                variant="outline"
                onClick={() => intentStatusActorRef.send({ type: "RETRY" })}
              >
                retry
              </Button>
            )}
          </Flex>
        </Flex>

        <Flex>
          <Flex direction="column" gap="1" flexGrow="1">
            {state.context.intentHash != null && (
              <Flex align="center" gap="1">
                <Text size="1" color="gray">
                  Intent: {truncateHash(state.context.intentHash)}
                </Text>

                <CopyButton
                  text={state.context.intentHash}
                  ariaLabel="Copy Intent hash"
                />
              </Flex>
            )}

            {sourceTxHash != null && (
              <Flex align="center" gap="1">
                <Text size="1" color="gray">
                  Source Tx:{" "}
                  <Link href={sourceTxUrl} target="_blank" color="blue">
                    {truncateHash(sourceTxHash)}
                  </Link>
                </Text>

                <CopyButton
                  text={sourceTxHash}
                  ariaLabel="Copy Source Transaction"
                />
              </Flex>
            )}

            {destTxHash != null && (
              <Flex align="center" gap="1">
                <Text size="1" color="gray">
                  Destination Tx:{" "}
                  <Link href={destTxUrl} target="_blank" color="blue">
                    {truncateHash(destTxHash)}
                  </Link>
                </Text>

                <CopyButton
                  text={destTxHash}
                  ariaLabel="Copy Destination Transaction"
                />
              </Flex>
            )}
          </Flex>

          <Text
            size="1"
            weight="medium"
            color={state.matches("not_valid") ? "gray" : "green"}
            style={{
              textDecoration: state.matches("not_valid")
                ? "line-through"
                : undefined,
            }}
          >
            +
            {formatTokenValue(
              amountWithdrawn.amount,
              amountWithdrawn.decimals,
              {
                min: 0.0001,
                fractionDigits: 4,
              }
            )}{" "}
            {tokenOut.symbol}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

export function renderStatusLabel(
  val: StateValueFrom<typeof intentStatusMachine>
) {
  switch (val) {
    case "pending":
    case "checking":
    case "settled":
      return "Pending"
    case "waitingForBridge":
    case "retryDelay":
      return "Transferring"
    case "error":
      return "Can't get status"
    case "success":
      return "Completed"
    case "not_valid":
      return "Failed"
    default:
      val satisfies never
  }
}

function truncateHash(hash: string) {
  return `${hash.slice(0, 5)}...${hash.slice(-5)}`
}
