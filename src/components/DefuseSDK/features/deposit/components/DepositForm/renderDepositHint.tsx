import type { BlockchainEnum } from "@defuse-protocol/internal-utils"
import { Callout, Skeleton } from "@radix-ui/themes"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@src/components/DefuseSDK/components/Tooltip"
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
  minDepositAmount: bigint | null,
  token: BaseTokenInfo,
  tokenDeployment: TokenDeployment
) {
  return (
    <div className="flex flex-col gap-3.5 font-medium text-gray-11 text-xs">
      <div className="flex justify-between">
        <div>Minimum deposit</div>
        {minDepositAmount != null ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-label">
                {formatTokenValue(minDepositAmount, tokenDeployment.decimals)}{" "}
                {token.symbol}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Deposits smaller than the minimum amount are not credited and are
              not refunded
            </TooltipContent>
          </Tooltip>
        ) : (
          <Skeleton className="w-16 h-4" />
        )}
      </div>
    </div>
  )
}

const formatShortenedContractAddress = (token: TokenDeployment): string =>
  isFungibleToken(token) ? `(...${token.address.slice(-7)})` : ""
