import { Button, Text } from "@radix-ui/themes"
import Image from "next/image"
import { useSwitchChain } from "wagmi"

import { turbo } from "@src/config/wagmi"

export default function AddTurboChainButton() {
  const { switchChain } = useSwitchChain()

  return (
    <Button
      onClick={() => switchChain({ chainId: turbo.id })}
      type="button"
      variant="soft"
      size="2"
      radius="full"
    >
      <div className="flex items-center gap-2">
        <Image
          src="/static/icons/wallets/meta-mask.svg"
          alt="MetaMask"
          width={16}
          height={16}
        />
        <Text weight="bold" wrap="nowrap" style={{ color: "var(--gray-12)" }}>
          Add to MetaMask
        </Text>
      </div>
    </Button>
  )
}
