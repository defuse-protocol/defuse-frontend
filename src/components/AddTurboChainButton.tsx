import {
  Button,
  Dialog,
  Flex,
  Heading,
  Separator,
  Text,
  VisuallyHidden,
} from "@radix-ui/themes"
import Image from "next/image"
import { useTransition } from "react"
import { useSwitchChain } from "wagmi"

import { CopyIconButton } from "@src/components/CopyToClipboard"
import { turbo } from "@src/config/wagmi"

export default function AddTurboChainButton() {
  const { switchChainAsync } = useSwitchChain()
  const [isAdding, startAdding] = useTransition()

  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button type="button" variant="soft" size="2" radius="full">
          <div className="flex items-center gap-2">
            <Image
              src="/static/icons/wallets/meta-mask.svg"
              alt="MetaMask"
              width={16}
              height={16}
            />
            <Text
              weight="bold"
              wrap="nowrap"
              style={{ color: "var(--gray-12)" }}
            >
              Add TurboChain
            </Text>
          </div>
        </Button>
      </Dialog.Trigger>
      <Dialog.Content
        minWidth={{ initial: "300px", xs: "330px" }}
        maxHeight={{ initial: "90vh", xs: "80vh" }}
        className={"p-8"}
        // Suppressing the warning about missing aria-describedby
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <Dialog.Title>Add TurboChain to your MetaMask wallet</Dialog.Title>
        </VisuallyHidden>

        <Flex direction={"column"} align={"center"} gap={"5"}>
          <Flex direction={"column"} align={"center"} gap={"4"}>
            <Heading as={"h2"} size={"6"} className={"text-center font-black"}>
              Add TurboChain
              <br /> to your MetaMask wallet
            </Heading>

            <Button
              type="button"
              variant="classic"
              size="3"
              onClick={() => {
                startAdding(async () => {
                  try {
                    await switchChainAsync({ chainId: turbo.id })
                  } catch (err) {
                    console.error(err)
                  }
                })
              }}
              disabled={isAdding}
            >
              <div className="flex items-center gap-2">
                <Image
                  src="/static/icons/wallets/meta-mask.svg"
                  alt="MetaMask"
                  width={16}
                  height={16}
                />
                <Text weight="bold" wrap="nowrap">
                  Add to MetaMask
                </Text>
              </div>
            </Button>
          </Flex>

          <Flex direction={"column"} align={"center"} gap={"2"}>
            <Text
              size={"2"}
              weight={"bold"}
              align={"center"}
              className={"max-w-96"}
            >
              You can also add the network manually:
            </Text>

            <Text
              size={"2"}
              color={"gray"}
              weight={"medium"}
              align={"center"}
              className={"max-w-80"}
            >
              Open MetaMask and go to{" "}
              <Text style={{ color: "var(--gray-12)" }}>
                Settings &gt; Networks
              </Text>
              , then add and save the following details:
            </Text>
          </Flex>

          <Flex direction={"column"} align={"stretch"} className={"w-full"}>
            <Separator className={"w-full"} />

            <Flex py={"3"}>
              <Flex direction={"column"} gap={"1"} flexGrow={"1"}>
                <Text size={"2"} weight={"medium"} color={"gray"}>
                  Network Name
                </Text>
                <Text size={"2"} weight={"bold"}>
                  {turbo.name}
                </Text>
              </Flex>

              <Flex>
                <CopyIconButton copyValue={turbo.name} />
              </Flex>
            </Flex>

            <Separator className={"w-full"} />

            <Flex py={"3"}>
              <Flex direction={"column"} gap={"1"} flexGrow={"1"}>
                <Text size={"2"} weight={"medium"} color={"gray"}>
                  RPC URL
                </Text>
                <Text size={"2"} weight={"bold"}>
                  {turbo.rpcUrls.default.http[0]}
                </Text>
              </Flex>

              <Flex>
                <CopyIconButton copyValue={turbo.rpcUrls.default.http[0]} />
              </Flex>
            </Flex>

            <Separator className={"w-full"} />

            <Flex py={"3"}>
              <Flex direction={"column"} gap={"1"} flexGrow={"1"}>
                <Text size={"2"} weight={"medium"} color={"gray"}>
                  Chain ID
                </Text>
                <Text size={"2"} weight={"bold"}>
                  {turbo.id}
                </Text>
              </Flex>

              <Flex>
                <CopyIconButton copyValue={turbo.id.toString()} />
              </Flex>
            </Flex>

            <Separator className={"w-full"} />

            <Flex py={"3"}>
              <Flex direction={"column"} gap={"1"} flexGrow={"1"}>
                <Text size={"2"} weight={"medium"} color={"gray"}>
                  Currency Symbol
                </Text>
                <Text size={"2"} weight={"bold"}>
                  {turbo.nativeCurrency.symbol}
                </Text>
              </Flex>

              <Flex>
                <CopyIconButton copyValue={turbo.nativeCurrency.symbol} />
              </Flex>
            </Flex>

            <Separator className={"w-full"} />

            <Flex py={"3"}>
              <Flex direction={"column"} gap={"1"} flexGrow={"1"}>
                <Text size={"2"} weight={"medium"} color={"gray"}>
                  Block Explorer URL
                </Text>
                <Text size={"2"} weight={"bold"}>
                  {turbo.blockExplorers.default.url}
                </Text>
              </Flex>

              <Flex>
                <CopyIconButton copyValue={turbo.blockExplorers.default.url} />
              </Flex>
            </Flex>

            <Separator className={"w-full"} />
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}
