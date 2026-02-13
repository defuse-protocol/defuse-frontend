import { CheckCircleIcon } from "@heroicons/react/16/solid"
import { CheckIcon, Square2StackIcon } from "@heroicons/react/24/outline"
import Button from "@src/components/Button"
import {
  hexToRgba,
  useDominantColor,
} from "@src/components/DefuseSDK/hooks/useDominantColor"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { isFungibleToken } from "@src/components/DefuseSDK/utils/token"
import Spinner from "@src/components/Spinner"
import { QRCodeSVG } from "qrcode.react"
import { Popover } from "radix-ui"
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
  const { hex } = useDominantColor(token.icon)

  return (
    <>
      <div className="bg-surface-card rounded-3xl border border-border p-4 mt-6 flex flex-col gap-4">
        <h2 className="flex flex-col items-start gap-1">
          <span className="font-semibold text-base/none text-fg">
            Deposit {token.symbol}
          </span>
          <span className="font-medium text-base/none text-fg-tertiary">
            from the{" "}
            <span className="capitalize">
              {chainNameToNetworkName(network)}
            </span>{" "}
            network
          </span>
        </h2>

        <div
          className="flex items-center justify-center bg-gray-900/50 rounded-2xl p-4 outline-2 outline-fg/20 -outline-offset-2 transition-colors"
          style={{
            backgroundColor: hexToRgba(hex, 0.8) ?? undefined,
          }}
        >
          <div className="size-48 flex items-center justify-center border-5 rounded-3xl bg-white border-fg">
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
              <dt className="font-semibold text-base/none text-fg">
                To this deposit address
              </dt>
              {depositAddress != null ? (
                <dd className="font-medium text-base/none text-fg-tertiary">
                  <span aria-hidden="true">{truncatedAddress}</span>
                  <span className="sr-only">{depositAddress}</span>
                </dd>
              ) : (
                <span className="w-32 h-4 bg-border rounded-sm animate-pulse" />
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
                <dt className="font-semibold text-base/none text-fg">
                  Transaction memo (required)
                </dt>
                <dd className="font-medium text-base/none text-fg-tertiary">
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
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center h-5 shrink-0">
            <CheckCircleIcon className="size-4 text-fg-secondary" />
          </div>
          <span className="text-sm font-medium text-fg-secondary">
            Only deposit{" "}
            {network === "near" &&
            token.defuseAssetId === "nep141:wrap.near" ? (
              `${token.symbol} or wNEAR`
            ) : isFungibleToken(tokenDeployment) ? (
              <TokenAddressPopover
                symbol={token.symbol}
                address={tokenDeployment.address}
              />
            ) : (
              token.symbol
            )}{" "}
            from the{" "}
            <span className="capitalize">
              {chainNameToNetworkName(tokenDeployment.chainName)}
            </span>{" "}
            network. Depositing other assets or using a different network will
            result in loss of funds.
          </span>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center h-5 shrink-0">
            <CheckCircleIcon className="size-4 text-fg-secondary" />
          </div>
          <span className="text-sm font-medium text-fg-secondary">
            <span className="text-fg font-semibold">
              Always double-check your deposit address
            </span>
            , as it may change without notice.
          </span>
        </div>

        {minDepositAmount != null && (
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center h-5 shrink-0">
              <CheckCircleIcon className="size-4 text-fg-secondary" />
            </div>
            <span className="text-sm font-medium text-fg-secondary">
              Minimum deposit is{" "}
              <span className="text-fg font-semibold">
                {formatTokenValue(minDepositAmount, tokenDeployment.decimals)}{" "}
                {token.symbol}
              </span>
            </span>
          </div>
        )}
      </div>

      {depositWarning != null && (
        <DepositWarning depositWarning={depositWarning} className="mt-6" />
      )}
    </>
  )
}

function TokenAddressPopover({
  symbol,
  address,
}: {
  symbol: string
  address: string
}) {
  return (
    <Popover.Root>
      <Popover.Trigger className="text-fg font-semibold underline hover:text-fg/80">
        {symbol}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="bg-gray-900 rounded-xl max-w-(--radix-popover-content-available-width) shadow-xl px-3 py-1.5 z-10 origin-top data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:duration-100 data-[state=open]:ease-out data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=closed]:duration-75 data-[state=closed]:ease-in"
          sideOffset={0}
          collisionPadding={8}
        >
          <div className="flex flex-col justify-center items-center">
            <span className="text-sm font-medium text-gray-400">
              Contract address
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white break-all font-mono text-center text-balance max-w-52 sm:max-w-none">
                {address}
              </span>
              <Copy text={address}>
                {(copied) => (
                  <button
                    type="button"
                    className="shrink-0 p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                  >
                    <span className="sr-only">
                      {copied ? "Address copied" : "Copy address"}
                    </span>
                    {copied ? (
                      <CheckIcon className="size-4" />
                    ) : (
                      <Square2StackIcon className="size-4" />
                    )}
                  </button>
                )}
              </Copy>
            </div>
          </div>
          <Popover.Arrow className="fill-gray-900" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
