import type { BlockchainEnum } from "@defuse-protocol/internal-utils"
import { Callout } from "@radix-ui/themes"
import { reverseAssetNetworkAdapter } from "@src/components/DefuseSDK/utils/adapters"
import { isFungibleToken } from "@src/components/DefuseSDK/utils/token"
import type { BaseTokenInfo, TokenDeployment } from "../../../../types/base"
import { formatTokenValue } from "../../../../utils/format"

export function renderDepositHint(
  network: BlockchainEnum,
  token: BaseTokenInfo,
  tokenDeployment: TokenDeployment
) {
  return (
    <div className="flex flex-col gap-4">
      <Callout.Root className="bg-warning px-3 py-2 text-warning-foreground">
        <Callout.Text className="text-xs">
          <span className="font-bold">
            Only deposit {token.symbol}
            {formatShortenedContractAddress(tokenDeployment)} from the{" "}
            {reverseAssetNetworkAdapter[network]} network.
          </span>{" "}
          <span>
            Depositing other assets or using a different network will result in
            loss of funds.
          </span>
        </Callout.Text>
      </Callout.Root>
    </div>
  )
}

export function renderMinDepositAmountHint(
  minDepositAmount: bigint,
  token: BaseTokenInfo,
  tokenDeployment: TokenDeployment
) {
  return (
    <div className="flex flex-col gap-3.5 font-medium text-gray-11 text-xs">
      <div className="flex justify-between">
        <div>Minimum deposit</div>
        <div className="text-label">
          {formatTokenValue(minDepositAmount, tokenDeployment.decimals)}{" "}
          {token.symbol}
        </div>
      </div>
    </div>
  )
}

const formatShortenedContractAddress = (token: TokenDeployment): string =>
  isFungibleToken(token) ? `(...${token.address.slice(-7)})` : ""
