import { Box, Button, Flex, Link, Spinner, Text } from "@radix-ui/themes"
import { useSelector } from "@xstate/react"
import type { ActorRefFrom } from "xstate"
import type { intentStatusMachine } from "../../features/machines/intentStatusMachine"
import { assert } from "../../utils/assert"
import { formatTokenValue } from "../../utils/format"
import { AssetComboIcon } from "../Asset/AssetComboIcon"
import { CopyButton } from "./CopyButton"
import { renderStatusLabel } from "./WithdrawIntentCard"

type SwapIntentCardProps = {
  intentStatusActorRef: ActorRefFrom<typeof intentStatusMachine>
}

const NEAR_EXPLORER = "https://nearblocks.io"
const EXPLORER_NEAR_INTENTS = "https://explorer.near-intents.org"

export function SwapIntentCard({ intentStatusActorRef }: SwapIntentCardProps) {
  const state = useSelector(intentStatusActorRef, (state) => state)
  const { tokenIn, tokenOut, intentDescription } = state.context
  assert(intentDescription.type === "swap", "Type must be swap")
  const { totalAmountIn, totalAmountOut } = intentDescription

  const txUrl =
    state.context.txHash != null
      ? `${NEAR_EXPLORER}/txns/${state.context.txHash}`
      : null

  const explorerUrl =
    intentDescription.depositAddress != null
      ? `${EXPLORER_NEAR_INTENTS}/transactions/${intentDescription.depositAddress}`
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
              Swap
            </Text>
          </Box>

          <Flex gap="1" align="center">
            {(state.matches("pending") || state.matches("checking")) && (
              <Spinner size="1" />
            )}

            <Text
              size="1"
              weight="medium"
              color={
                state.matches("error") || state.matches("not_valid")
                  ? "red"
                  : undefined
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
          {intentDescription.depositAddress != null && explorerUrl != null && (
            <Flex align="center" gap="1">
              <Text size="1" color="gray">
                Track your swap progress on explorer:{" "}
                <Link href={explorerUrl} target="_blank" color="blue">
                  {truncateHash(intentDescription.depositAddress)}
                </Link>
              </Text>

              <CopyButton
                text={intentDescription.depositAddress}
                ariaLabel="Copy Deposit address"
              />
            </Flex>
          )}

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

          {state.context.txHash != null && txUrl != null && (
            <Flex align="center" gap="1">
              <Text size="1" color="gray">
                Transaction:{" "}
                <Link href={txUrl} target="_blank" color="blue">
                  {truncateHash(state.context.txHash)}
                </Link>
              </Text>

              <CopyButton
                text={state.context.txHash}
                ariaLabel="Copy Transaction hash"
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
