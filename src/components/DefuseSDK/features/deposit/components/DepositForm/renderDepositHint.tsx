import { Callout } from "@radix-ui/themes"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@src/components/DefuseSDK/components/Tooltip"
import { isFungibleToken } from "@src/components/DefuseSDK/utils/token"
import type {
  BaseTokenInfo,
  SupportedChainName,
  TokenDeployment,
} from "../../../../types/base"
import { formatTokenValue } from "../../../../utils/format"

export function renderDepositHint(
  token: BaseTokenInfo,
  tokenDeployment: TokenDeployment
) {
  return (
    <div className="flex flex-col gap-4">
      <Callout.Root className="bg-warning px-3 py-2 text-warning-foreground">
        <Callout.Text className="text-xs">
          <span className="font-bold">
            {token.defuseAssetId === "nep141:wrap.near"
              ? `Only deposit ${token.symbol} or wNEAR`
              : `Only deposit ${token.symbol}`}
            {isFungibleToken(tokenDeployment) && (
              <TokenDeploymentAddress address={tokenDeployment.address} />
            )}{" "}
            from the{" "}
            <span className="capitalize">
              {chainNameToNetworkName(tokenDeployment.chainName)}
            </span>{" "}
            network.{" "}
          </span>
          <span>
            Depositing other assets or using a different network will result in
            loss of funds.
          </span>
        </Callout.Text>
      </Callout.Root>
    </div>
  )
}

function TokenDeploymentAddress({ address }: { address: string }) {
  return (
    <Tooltip>
      <TooltipTrigger>(...{address.slice(-7)})</TooltipTrigger>
      <TooltipContent>{address}</TooltipContent>
    </Tooltip>
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

function chainNameToNetworkName(chainName: SupportedChainName): string {
  switch (chainName) {
    case "eth":
      return "ethereum"
    case "xrpledger":
      return "XRP Ledger"
    case "bsc":
      return "BNB Smart Chain"
    default:
      return chainName
  }
}
