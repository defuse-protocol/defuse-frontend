import { CheckIcon, CopyIcon } from "@radix-ui/react-icons"
import { Dialog } from "@radix-ui/themes"
import { Button } from "@radix-ui/themes"
import { Callout } from "@radix-ui/themes"
import { Text } from "@radix-ui/themes"
import { QRCodeSVG } from "qrcode.react"
import { Copy } from "../../../components/IntentCard/CopyButton"
import { BaseModalDialog } from "../../../components/Modal/ModalDialog"
import { getNearIntentsOption } from "../../../constants/blockchains"
import { IntentsIcon } from "./shared/IntentsIcon"

type RevealAddressDialogProps = {
  internalUserAddress: string
  onClose: () => void
}

export function RevealAddressDialog({
  internalUserAddress,
  onClose,
}: RevealAddressDialogProps) {
  const truncatedAddress = truncateAddress(internalUserAddress)
  const nearIntentsOption = getNearIntentsOption().intents

  return (
    <BaseModalDialog open onClose={onClose} isDismissable>
      <Dialog.Title className="text-2xl font-black text-gray-12 mb-2.5">
        <div className="min-h-11 flex items-center gap-4">
          <IntentsIcon className="rounded-full" />
          Your internal address
        </div>
      </Dialog.Title>
      <Dialog.Description className="text-sm font-medium text-gray-11 mb-6">
        Share this address with other Near Intents users for easy, fee-free
        internal transfers of any asset.
      </Dialog.Description>

      {/* QR Code Section */}
      <div className="flex flex-col items-center gap-4 z-10 mb-6">
        {internalUserAddress && (
          <div className="flex items-center justify-center bg-white w-[152px] h-[152px] p-2 rounded-md border border-gray-4">
            <QRCodeSVG value={internalUserAddress} />
          </div>
        )}
      </div>

      {/* Network Select Section */}
      <div className="flex justify-between items-center gap-3 p-2.5">
        <div className="flex items-center gap-2">
          {nearIntentsOption.icon}
          <Text as="span" size="2" weight="medium">
            {nearIntentsOption.label}
          </Text>
        </div>
        <div className="flex items-center py-1 px-2 rounded-full bg-[#E1F9EA] text-[#17A615]">
          <span className="text-xs">Accound ID</span>
        </div>
      </div>

      {/* Visible Address Section */}
      <div className="mb-4 flex items-center rounded-lg bg-gray-3 px-4 py-2">
        <div className="flex flex-1 justify-center">
          <span className="relative">
            {/* Visible truncated address */}
            <span className="pointer-events-none font-medium font-mono text-label text-sm">
              {truncatedAddress}
            </span>

            {/* Hidden full address for copy functionality */}
            <input
              type="text"
              value={internalUserAddress}
              readOnly
              style={{
                // It's easier to make the input transparent using CSS instead of Tailwind
                all: "unset",
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                color: "transparent",
                outline: "none",
              }}
            />
          </span>
        </div>
        <div className="shrink-0">
          <Copy text={internalUserAddress}>
            {(copied) => (
              <Button
                type="button"
                size="4"
                variant="solid"
                className="box-border size-8 p-0"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </Button>
            )}
          </Copy>
        </div>
      </div>

      {/* Warning Section */}
      <Callout.Root className="bg-warning px-3 py-2 text-warning-foreground">
        <Callout.Text className="text-xs">
          <span className="font-bold">
            This is your internal Near Intents address.
          </span>{" "}
          <span>
            Funds will be deposited into your account, not your connected
            wallet.
          </span>
        </Callout.Text>
      </Callout.Root>
    </BaseModalDialog>
  )
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
