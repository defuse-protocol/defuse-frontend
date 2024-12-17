import { InfoCircledIcon } from "@radix-ui/react-icons"
import {
  Button,
  Callout,
  Dialog,
  Flex,
  Heading,
  Separator,
  Text,
  VisuallyHidden,
} from "@radix-ui/themes"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"
import { useState, useTransition } from "react"
import { type Connector, useSwitchChain } from "wagmi"

import { CopyIconButton } from "@src/components/CopyToClipboard"
import { turbo } from "@src/config/wagmi"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"

export default function AddTurboChainButton() {
  return (
    <Dialog.Root onOpenChange={(open) => !open}>
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

            <AddToMetaMaskButton />
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

function AddToMetaMaskButton() {
  const { switchChainAsync } = useSwitchChain()
  const [isAdding, startAdding] = useTransition()
  const { signIn, connectors, state } = useConnectWallet()
  const [error, setError] = useState<string | null>(null)

  return (
    <Flex direction="column" align="center" gap="2">
      <Button
        type="button"
        variant="classic"
        size="3"
        onClick={() => {
          setError(null)
          startAdding(async () => {
            try {
              if (state.address == null) {
                const connector = getPreferredConnector(connectors)
                await signIn({
                  id: ChainType.EVM,
                  connector,
                })
              } else if (state.chainType !== ChainType.EVM) {
                setError("Please connect an EVM wallet first, like MetaMask.")
                return
              }

              await switchChainAsync({
                chainId: turbo.id,
                addEthereumChainParameter: {
                  chainName: turbo.name,
                  nativeCurrency: turbo.nativeCurrency,
                  rpcUrls: turbo.rpcUrls.default.http,
                  blockExplorerUrls: [turbo.blockExplorers.default.url],
                },
              })
            } catch (err) {
              console.error(err)
              setError(
                "Couldn't add chain automatically. Please try adding manually using the details below."
              )
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

      <AnimatePresence mode="sync">
        {error && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            layout
          >
            <Callout.Root color="yellow" role="alert" size="1">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>

              <Callout.Text weight={"medium"}>{error}</Callout.Text>
            </Callout.Root>
          </motion.div>
        )}
      </AnimatePresence>
    </Flex>
  )
}

function getPreferredConnector(connectors: Connector[]): Connector | undefined {
  return (
    connectors.find((connector) => connector.id === "injected") ?? connectors[0]
  )
}
