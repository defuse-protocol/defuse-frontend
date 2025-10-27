import { Box, Button, Flex, Link, Spinner, Text } from "@radix-ui/themes"
import { useSelector } from "@xstate/react"
import type { ActorRefFrom } from "xstate"
import type { oneClickStatusMachine } from "../../features/machines/oneClickStatusMachine"
import { formatTokenValue } from "../../utils/format"
import { AssetComboIcon } from "../Asset/AssetComboIcon"
import { CopyButton } from "./CopyButton"
import { EXPLORER_NEAR_INTENTS, getStatusDisplayInfo, truncate } from "./utils"

type Swap1csCardProps = {
  oneClickStatusActorRef: ActorRefFrom<typeof oneClickStatusMachine>
}

export function Swap1csCard({ oneClickStatusActorRef }: Swap1csCardProps) {
  const state = useSelector(oneClickStatusActorRef, (state) => state)
  const {
    tokenIn,
    tokenOut,
    depositAddress,
    status,
    totalAmountIn,
    totalAmountOut,
  } = state.context

  const statusInfo = getStatusDisplayInfo(status)

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
              Swap
            </Text>
          </Box>

          <Flex gap="1" align="center">
            {(statusInfo.showSpinner || state.matches("checking")) && (
              <Spinner size="1" />
            )}

            <Text
              size="1"
              weight="medium"
              color={statusInfo.color as "red" | "green" | undefined}
              data-testid={status === "SUCCESS" ? "swap-success" : undefined}
            >
              {statusInfo.label}
            </Text>

            {state.can({ type: "RETRY" }) && (
              <Button
                size="1"
                variant="outline"
                onClick={() => oneClickStatusActorRef.send({ type: "RETRY" })}
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
                Track your swap progress on explorer:{" "}
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
