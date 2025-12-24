import {
  Check as CheckIcon,
  Copy as CopyIcon,
  HourglassHigh,
} from "@phosphor-icons/react"
import { Dialog } from "@radix-ui/themes"
import { useSelector } from "@xstate/react"
import type { ActorRefFrom } from "xstate"
import AssetComboIcon from "../../../components/Asset/AssetComboIcon"
import { ButtonCustom } from "../../../components/Button/ButtonCustom"
import { Copy } from "../../../components/IntentCard/CopyButton"
import { BaseModalDialog } from "../../../components/Modal/ModalDialog"
import type { SignerCredentials } from "../../../core/formatters"
import { formatTokenValue } from "../../../utils/format"
import type { otcMakerConfigLoadActor } from "../actors/otcMakerConfigLoadActor"
import type { otcMakerOrderCancellationActor } from "../actors/otcMakerOrderCancellationActor"
import type { otcMakerReadyOrderActor } from "../actors/otcMakerReadyOrderActor"
import type { GenerateLink, SignMessage } from "../types/sharedTypes"
import { computeTradeBreakdown } from "../utils/otcMakerBreakdown"
import { CancellationDialog } from "./shared/CancellationDialog"

type OtcMakerReadyOrderDialogProps = {
  configRef: ActorRefFrom<typeof otcMakerConfigLoadActor>
  readyOrderRef: ActorRefFrom<typeof otcMakerReadyOrderActor>
  signerCredentials: SignerCredentials
  signMessage: SignMessage
  generateLink: GenerateLink
}

export function OtcMakerReadyOrderDialog({
  configRef,
  readyOrderRef,
  signerCredentials,
  signMessage,
  generateLink,
}: OtcMakerReadyOrderDialogProps) {
  const { orderCancellationRef } = useSelector(readyOrderRef, (state) => ({
    orderCancellationRef: state.children.otcMakerOrderCancellationRef as
      | undefined
      | ActorRefFrom<typeof otcMakerOrderCancellationActor>,
  }))

  return (
    <>
      <OrderDialog
        readyOrderRef={readyOrderRef}
        configRef={configRef}
        generateLink={generateLink}
      />

      <CancellationDialog
        actorRef={orderCancellationRef}
        signerCredentials={signerCredentials}
        signMessage={signMessage}
      />
    </>
  )
}

function OrderDialog({
  readyOrderRef,
  configRef,
  generateLink,
}: {
  readyOrderRef: ActorRefFrom<typeof otcMakerReadyOrderActor>
  configRef: ActorRefFrom<typeof otcMakerConfigLoadActor>
  generateLink: GenerateLink
}) {
  const { context } = useSelector(readyOrderRef, (state) => ({
    context: state.context,
  }))

  const protocolFee = useSelector(
    configRef,
    (state) => state.context.protocolFee
  )

  const finish = () => {
    readyOrderRef.send({ type: "FINISH" })
  }

  const cancelOrder = () => {
    readyOrderRef.send({ type: "CANCEL_ORDER" })
  }

  const breakdown =
    protocolFee != null
      ? computeTradeBreakdown({
          multiPayload: context.multiPayload,
          tokenIn: context.parsed.tokenIn,
          tokenOut: context.parsed.tokenOut,
          protocolFee,
        })
      : null

  return (
    <BaseModalDialog open={true} onClose={finish} title="Your order is open">
      {/* Header Section */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-[64px] h-[64px] mt-5 mb-4 flex items-center justify-center rounded-full bg-yellow-300">
          <HourglassHigh
            className="size-7 text-warning-foreground"
            weight="bold"
          />
        </div>
        <Dialog.Title className="text-2xl font-black text-gray-12 mb-2">
          Your order is open
        </Dialog.Title>
        <Dialog.Description className="text-sm font-medium text-gray-11">
          Share the link with the recipient to finalize the swap.
        </Dialog.Description>
      </div>

      {/* Order Section */}
      {breakdown != null && (
        <div className="flex justify-between items-center gap-2 px-4 py-3.5 rounded-lg bg-gray-3 mb-4">
          <div className="flex items-center">
            <div className="flex items-center relative">
              <AssetComboIcon {...context.parsed.tokenIn} />
              <div className="flex relative items-center -left-[10px] z-10">
                <AssetComboIcon {...context.parsed.tokenOut} />
              </div>
            </div>
            <div className="text-sm text-a12 font-bold">Swap</div>
          </div>
          <div className="text-xs text-a12">
            {formatTokenValue(
              breakdown.makerSends.amount,
              breakdown.makerSends.decimals,
              { fractionDigits: 4 }
            )}{" "}
            {context.parsed.tokenIn.symbol}
            {" → "}
            <span className="font-bold">
              {formatTokenValue(
                breakdown.makerReceives.amount,
                breakdown.makerReceives.decimals,
                { fractionDigits: 4 }
              )}{" "}
              {context.parsed.tokenOut.symbol}
            </span>
          </div>
        </div>
      )}

      {breakdown != null && (
        <div className="flex flex-col gap-3.5 px-4 text-xs">
          <div className="flex justify-between items-center">
            <div className="text-gray-11 font-medium">You send</div>
            <div className="text-gray-12 font-medium">
              {formatTokenValue(
                breakdown.makerSends.amount,
                breakdown.makerSends.decimals,
                { fractionDigits: 4 }
              )}{" "}
              {context.parsed.tokenIn.symbol}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-gray-11 font-medium">Processing fee</div>
            <div className="text-gray-12 font-medium">
              {formatTokenValue(
                breakdown.makerPaysFee.amount,
                breakdown.makerPaysFee.decimals,
                { fractionDigits: 4 }
              )}{" "}
              {context.parsed.tokenIn.symbol}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-gray-11 font-medium">Recipient will get</div>
            <div className="text-gray-12 font-medium">
              {formatTokenValue(
                breakdown.takerReceives.amount,
                breakdown.takerReceives.decimals,
                { fractionDigits: 4 }
              )}{" "}
              {context.parsed.tokenIn.symbol}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col justify-center gap-3 mt-5">
        <Copy
          text={() =>
            generateLink(
              context.tradeId,
              context.pKey,
              context.multiPayload,
              context.iv
            )
          }
        >
          {(copied) => (
            <ButtonCustom
              type="button"
              size="lg"
              variant="primary"
              variantRadix={copied ? "soft" : undefined}
            >
              <div className="flex gap-2 items-center">
                {copied ? (
                  <CheckIcon weight="bold" />
                ) : (
                  <CopyIcon weight="bold" />
                )}
                {copied ? "Copied" : "Copy link"}
              </div>
            </ButtonCustom>
          )}
        </Copy>

        <ButtonCustom
          size="lg"
          type="button"
          variant="danger"
          onClick={cancelOrder}
        >
          Cancel order
        </ButtonCustom>
      </div>
    </BaseModalDialog>
  )
}
