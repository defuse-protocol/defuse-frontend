import { Box, Flex, Link, Text } from "@radix-ui/themes"
import { AssetComboIcon } from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { CopyButton } from "@src/components/DefuseSDK/components/IntentCard/CopyButton"
import { assert } from "@src/components/DefuseSDK/utils/assert"
import { chainTxExplorer } from "@src/components/DefuseSDK/utils/chainTxExplorer"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { useIs1CsEnabled } from "@src/hooks/useIs1CsEnabled"
import type { SupportedChainName } from "../../../types/base"
import type { Context } from "../../machines/depositUIMachine"

const EXPLORER_NEAR_INTENTS = "https://explorer.near-intents.org"

export const DepositResult = ({
  chainName,
  depositResult,
}: {
  chainName: SupportedChainName
  depositResult: Context["depositOutput"]
}) => {
  if (depositResult?.tag !== "ok") {
    return null
  }
  const explorerUrl = chainTxExplorer(chainName)
  const txHash = depositResult.value.txHash
  const depositAddress = depositResult.value.depositDescription.depositAddress
  const memoToUrl = depositResult.value.depositDescription.memo
    ? `_${depositResult.value.depositDescription.memo}`
    : ""

  assert(explorerUrl != null, "explorerUrl should not be null")

  const txUrl = explorerUrl + txHash

  const is1cs = useIs1CsEnabled()
  let oneClickExplorerUrl = null
  if (is1cs) {
    oneClickExplorerUrl = depositAddress
      ? `${EXPLORER_NEAR_INTENTS}/transactions/${depositAddress}${memoToUrl}`
      : null
  }

  return (
    <Flex p="2" gap="3">
      <Box pt="2">
        <AssetComboIcon
          icon={depositResult.value.depositDescription.derivedToken.icon}
          name={depositResult.value.depositDescription.derivedToken.name}
        />
      </Box>

      <Flex direction="column" flexGrow="1">
        <Flex>
          <Box flexGrow="1">
            <Text size="2" weight="medium">
              Deposit
            </Text>
          </Box>

          <Flex gap="1" align="center">
            <Text size="1" weight="medium">
              Completed
            </Text>
          </Flex>
        </Flex>

        <Flex align="center">
          <Box flexGrow="1">
            <Text size="1" weight="medium" color="gray">
              From{" "}
              {shortenText(depositResult.value.depositDescription.userAddress)}
            </Text>
          </Box>

          <Box>
            <Text size="1" weight="medium" color="green">
              +
              {formatTokenValue(
                depositResult.value.depositDescription.amount,
                depositResult.value.depositDescription.tokenDeployment.decimals,
                {
                  min: 0.0001,
                  fractionDigits: 4,
                }
              )}{" "}
              {depositResult.value.depositDescription.derivedToken.symbol}
            </Text>
          </Box>
        </Flex>

        {depositResult.value.txHash != null && txUrl != null && (
          <Box>
            <Text size="1" color="gray">
              Transaction:
            </Text>{" "}
            <Text size="1">
              <Link href={txUrl} target="_blank">
                {shortenText(depositResult.value.txHash)}
              </Link>
            </Text>
          </Box>
        )}

        <Box>
          {is1cs && txHash && oneClickExplorerUrl ? (
            <Flex align="center" gap="1">
              <Text size="1" color="gray">
                Track your deposit progress on explorer:{" "}
                <Link href={oneClickExplorerUrl} target="_blank" color="blue">
                  {shortenText(depositAddress)}
                </Link>
              </Text>

              <CopyButton
                text={depositAddress}
                ariaLabel="Copy Deposit address"
              />
            </Flex>
          ) : (
            <Text size="1" color="gray">
              Settlement in flight!
            </Text>
          )}
        </Box>
      </Flex>
    </Flex>
  )
}

function shortenText(text: string) {
  return `${text.slice(0, 5)}...${text.slice(-5)}`
}
