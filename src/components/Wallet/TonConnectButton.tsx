import { Button, Text } from "@radix-ui/themes"
import { useTonConnectUI } from "@tonconnect/ui-react"
import Image from "next/image"

export function TonConnectButton() {
  const [tonConnectUI] = useTonConnectUI()
  return (
    <Button
      type="button"
      onClick={() => {
        void tonConnectUI.openModal()
      }}
      size="4"
      radius="medium"
      variant="soft"
      color="gray"
      className="px-2.5"
    >
      <div className="w-full flex items-center justify-start gap-2">
        <Image
          src="/static/icons/wallets/ton.svg"
          alt=""
          width={36}
          height={36}
        />
        <Text size="2" weight="bold">
          TON
        </Text>
      </div>
    </Button>
  )
}
