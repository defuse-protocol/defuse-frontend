import {
  ArrowUpCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
} from "@heroicons/react/16/solid"
import { CheckIcon, Square2StackIcon } from "@heroicons/react/24/outline"
import Button from "@src/components/Button"
import TooltipNew from "@src/components/DefuseSDK/components/TooltipNew"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { isFungibleToken } from "@src/components/DefuseSDK/utils/token"
import Spinner from "@src/components/Spinner"
import { QRCodeSVG } from "qrcode.react"
import { Copy } from "../../../../components/IntentCard/CopyButton"
import type {
  BaseTokenInfo,
  SupportedChainName,
  TokenDeployment,
} from "../../../../types/base"
import {
  chainNameToNetworkName,
  midTruncate,
} from "../../../withdraw/components/WithdrawForm/utils"
import { DepositWarning, type DepositWarningOutput } from "../DepositWarning"

export type PassiveDepositProps = {
  depositAddress: string | null
  minDepositAmount: bigint | null
  token: BaseTokenInfo
  tokenDeployment: TokenDeployment
  memo: string | null
  depositWarning: DepositWarningOutput
  network: SupportedChainName
}

export function PassiveDeposit({
  depositAddress,
  minDepositAmount,
  token,
  tokenDeployment,
  memo,
  depositWarning,
  network,
}: PassiveDepositProps) {
  const truncatedAddress = midTruncate(depositAddress ?? "", 16)

  return (
    <>
      <div className="bg-white rounded-3xl border border-gray-200 p-4 mt-6 space-y-4">
        <h2 className="flex flex-col items-start gap-1">
          <span className="font-semibold text-base/none text-gray-900">
            Deposit {token.name}
          </span>
          <span className="font-medium text-base/none text-gray-400">
            on the{" "}
            <span className="capitalize">
              {chainNameToNetworkName(network)}
            </span>{" "}
            network
          </span>
        </h2>

        <div className="flex items-center justify-center bg-gray-900/50 rounded-2xl p-4">
          <div className="size-48 flex items-center justify-center border-5 rounded-3xl bg-white border-gray-900">
            {depositAddress != null ? (
              <QRCodeSVG
                value={depositAddress}
                size={160}
                fgColor="#171717"
                className="size-40"
              />
            ) : (
              <Spinner />
            )}
          </div>
        </div>

        <dl className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start gap-1">
              <dt className="font-semibold text-base/none text-gray-900">
                Your deposit address
              </dt>
              {depositAddress != null ? (
                <dd className="font-medium text-base/none text-gray-400">
                  <span aria-hidden="true">{truncatedAddress}</span>
                  <span className="sr-only">{depositAddress}</span>
                </dd>
              ) : (
                <span className="w-32 h-4 bg-gray-200 rounded-sm animate-pulse" />
              )}
            </div>
            <Copy text={depositAddress ?? ""}>
              {(copied) => (
                <Button variant="outline" size="lg" className="size-10!">
                  <span className="sr-only">
                    {copied ? "Deposit address copied" : "Copy deposit address"}
                  </span>
                  {copied ? (
                    <CheckIcon className="size-5" />
                  ) : (
                    <Square2StackIcon className="size-5" />
                  )}
                </Button>
              )}
            </Copy>
          </div>

          {memo != null && (
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-start gap-1">
                <dt className="font-semibold text-base/none text-gray-900">
                  Transaction memo (required)
                </dt>
                <dd className="font-medium text-base/none text-gray-400">
                  {memo}
                </dd>
              </div>
              <Copy text={memo}>
                {(copied) => (
                  <Button variant="outline" size="lg" className="size-10!">
                    <span className="sr-only">
                      {copied ? "Memo copied" : "Copy memo"}
                    </span>
                    {copied ? (
                      <CheckIcon className="size-5" />
                    ) : (
                      <Square2StackIcon className="size-5" />
                    )}
                  </Button>
                )}
              </Copy>
            </div>
          )}
        </dl>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex items-start gap-2">
          <div className="flex items-center justify-center h-5 shrink-0">
            <ExclamationCircleIcon className="size-4 text-gray-500" />
          </div>
          <span className="text-sm font-medium text-gray-500">
            <span className="text-gray-900 font-semibold">
              {network === "near" && token.defuseAssetId === "nep141:wrap.near"
                ? `Only deposit ${token.symbol} or wNEAR `
                : `Only deposit ${token.symbol} `}
              {isFungibleToken(tokenDeployment) && (
                <TokenDeploymentAddress address={tokenDeployment.address} />
              )}{" "}
              on the{" "}
              <span className="capitalize">
                {chainNameToNetworkName(tokenDeployment.chainName)}
              </span>{" "}
              network.{" "}
            </span>
            Depositing other assets or using a different network will result in
            loss of funds.
          </span>
        </div>

        <div className="flex items-start gap-2">
          <div className="flex items-center justify-center h-5 shrink-0">
            <EyeIcon className="size-4 text-gray-500" />
          </div>
          <span className="text-sm font-medium text-gray-500">
            Always double-check your deposit address — it may change without
            notice.
          </span>
        </div>

        {minDepositAmount != null && (
          <div className="flex items-start gap-2">
            <div className="flex items-center justify-center h-5 shrink-0">
              <ArrowUpCircleIcon className="size-4 text-gray-500" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Minimum deposit{" "}
              {formatTokenValue(minDepositAmount, tokenDeployment.decimals)}{" "}
              {token.symbol}
            </span>
          </div>
        )}
      </div>

      {depositWarning != null && (
        <div className="mt-6">
          <DepositWarning depositWarning={depositWarning} />
        </div>
      )}
    </>
  )
}

function TokenDeploymentAddress({ address }: { address: string }) {
  const truncatedAddress = midTruncate(address)

  if (truncatedAddress === address) {
    return <span>({address})</span>
  }

  return (
    <TooltipNew>
      <TooltipNew.Trigger>
        <span className="underline">({truncatedAddress})</span>
      </TooltipNew.Trigger>
      <TooltipNew.Content side="top">{address}</TooltipNew.Content>
    </TooltipNew>
  )
}
