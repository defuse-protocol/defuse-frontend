"use client"

import { Button, Popover, Text } from "@radix-ui/themes"
import Image from "next/image"
import React, { useContext } from "react"
import type { Connector } from "wagmi"

import WalletConnections from "@src/components/Wallet/WalletConnections"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import useShortAccountId from "@src/hooks/useShortAccountId"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"

const TURN_OFF_APPS = process?.env?.turnOffApps === "true" ?? true

const ConnectWallet = () => {
  const { state, signIn, connectors } = useConnectWallet()
  const { shortAccountId } = useShortAccountId(state.address ?? "")
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  const handleNearWalletSelector = () => {
    return signIn({ id: ChainType.Near })
  }

  const handleWalletConnect = (connector: Connector) => {
    return signIn({ id: ChainType.EVM, connector })
  }

  const handleSolanaWalletSelector = () => {
    return signIn({ id: ChainType.Solana })
  }

  if (!state.address || TURN_OFF_APPS) {
    return (
      <Popover.Root>
        <Popover.Trigger>
          <Button
            type={"button"}
            variant={"solid"}
            size={"2"}
            radius={"full"}
            disabled={TURN_OFF_APPS}
          >
            <Text weight="bold" wrap="nowrap">
              Connect wallet
            </Text>
          </Button>
        </Popover.Trigger>
        <Popover.Content
          maxWidth={{ initial: "90vw", xs: "480px" }}
          minWidth={{ initial: "300px", xs: "330px" }}
          className="md:mr-[48px] dark:bg-black-800 rounded-2xl"
        >
          <Text size="1">How do you want to connect?</Text>
          <div className="w-full grid grid-cols-1 gap-4 mt-4">
            <Text size="1" color="gray">
              Popular wallets
            </Text>

            {whitelabelTemplate === "turboswap" ? (
              <>
                {/* WalletConnect */}
                {connectors
                  .filter((c) => c.id === "walletConnect")
                  .map((connector) => (
                    <Button
                      key={connector.uid}
                      onClick={() => handleWalletConnect(connector)}
                      size="4"
                      radius="medium"
                      variant="soft"
                      color="gray"
                      className="px-2.5"
                    >
                      <div className="w-full flex items-center justify-start gap-2">
                        <WalletIcon connector={connector} />
                        <Text size="2" weight="bold">
                          {renderWalletName(connector)}
                        </Text>
                      </div>
                    </Button>
                  ))}

                {/* EIP-6963 detected wallets */}
                {connectors
                  .filter((c) => c.type === "injected" && c.id !== "injected")
                  .map((connector) => (
                    <Button
                      key={connector.uid}
                      onClick={() => handleWalletConnect(connector)}
                      size="4"
                      radius="medium"
                      variant="soft"
                      color="gray"
                      className="px-2.5"
                    >
                      <div className="w-full flex items-center justify-start gap-2">
                        <WalletIcon connector={connector} />
                        <Text size="2" weight="bold">
                          {renderWalletName(connector)}
                        </Text>
                      </div>
                    </Button>
                  ))}

                <Text size="1" color="gray">
                  Other options
                </Text>

                <Button
                  onClick={handleNearWalletSelector}
                  size="4"
                  radius="medium"
                  variant="soft"
                  color="gray"
                  className="px-2.5"
                >
                  <div className="w-full flex items-center justify-start gap-2">
                    <Image
                      src="/static/icons/wallets/near-wallet-selector.svg"
                      alt="Near Wallet Selector"
                      width={36}
                      height={36}
                    />
                    <Text size="2" weight="bold">
                      NEAR Wallet
                    </Text>
                  </div>
                </Button>

                <Button
                  onClick={handleSolanaWalletSelector}
                  size="4"
                  radius="medium"
                  variant="soft"
                  color="gray"
                  className="px-2.5"
                >
                  <div className="w-full flex items-center justify-start gap-2">
                    <Image
                      src="/static/icons/wallets/solana-logo-mark.svg"
                      alt="Solana Wallet Selector"
                      width={36}
                      height={36}
                    />
                    <Text size="2" weight="bold">
                      Solana Wallet
                    </Text>
                  </div>
                </Button>

                {/* Other non-EIP-6963 connectors */}
                {connectors
                  .filter(
                    (c) => c.id !== "walletConnect" && c.type !== "injected"
                  )
                  .map((connector) => (
                    <Button
                      key={connector.uid}
                      onClick={() => handleWalletConnect(connector)}
                      size="4"
                      radius="medium"
                      variant="soft"
                      color="gray"
                      className="px-2.5"
                    >
                      <div className="w-full flex items-center justify-start gap-2">
                        <WalletIcon connector={connector} />
                        <Text size="2" weight="bold">
                          {renderWalletName(connector)}
                        </Text>
                      </div>
                    </Button>
                  ))}
              </>
            ) : (
              // Original order for other templates
              <>
                <Button
                  onClick={handleSolanaWalletSelector}
                  size="4"
                  radius="medium"
                  variant="soft"
                  color="gray"
                  className="px-2.5"
                >
                  <div className="w-full flex items-center justify-start gap-2">
                    <Image
                      src="/static/icons/wallets/solana-logo-mark.svg"
                      alt="Solana Wallet Selector"
                      width={36}
                      height={36}
                    />
                    <Text size="2" weight="bold">
                      Solana Wallet
                    </Text>
                  </div>
                </Button>

                {whitelabelTemplate !== "solswap" && (
                  <>
                    <Button
                      onClick={handleNearWalletSelector}
                      size="4"
                      radius="medium"
                      variant="soft"
                      color="gray"
                      className="px-2.5"
                    >
                      <div className="w-full flex items-center justify-start gap-2">
                        <Image
                          src="/static/icons/wallets/near-wallet-selector.svg"
                          alt="Near Wallet Selector"
                          width={36}
                          height={36}
                        />
                        <Text size="2" weight="bold">
                          NEAR Wallet
                        </Text>
                      </div>
                    </Button>
                    {connectors.slice(0, 1).map((connector) => (
                      <Button
                        key={connector.uid}
                        onClick={() => handleWalletConnect(connector)}
                        size="4"
                        radius="medium"
                        variant="soft"
                        color="gray"
                        className="px-2.5"
                      >
                        <div className="w-full flex items-center justify-start gap-2">
                          <WalletIcon connector={connector} />
                          <Text size="2" weight="bold">
                            {renderWalletName(connector)}
                          </Text>
                        </div>
                      </Button>
                    ))}
                    <Text size="1" color="gray">
                      Other wallets
                    </Text>
                    {connectors
                      .slice(1)
                      .filter((connector) => connector.id !== "injected")
                      .map((connector) => (
                        <Button
                          key={connector.uid}
                          onClick={() => handleWalletConnect(connector)}
                          size="4"
                          radius="medium"
                          variant="soft"
                          color="gray"
                          className="px-2.5"
                        >
                          <div className="w-full flex items-center justify-start gap-2">
                            <WalletIcon connector={connector} />
                            <Text size="2" weight="bold">
                              {renderWalletName(connector)}
                            </Text>
                          </div>
                        </Button>
                      ))}
                  </>
                )}
              </>
            )}
          </div>
        </Popover.Content>
      </Popover.Root>
    )
  }

  return (
    <div className="flex gap-2">
      <Popover.Root>
        <Popover.Trigger>
          <Button
            type={"button"}
            variant={"soft"}
            color={"gray"}
            size={"2"}
            radius={"full"}
            disabled={TURN_OFF_APPS}
          >
            <Text
              weight="bold"
              wrap="nowrap"
              style={{ color: "var(--gray-12)" }}
            >
              {shortAccountId}
            </Text>
          </Button>
        </Popover.Trigger>
        <Popover.Content
          minWidth={{ initial: "300px", xs: "330px" }}
          className="mt-1 md:mr-[48px] dark:bg-black-800 rounded-2xl"
        >
          <div className="flex flex-col gap-5">
            <WalletConnections />
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
  )
}

function WalletIcon({ connector }: { connector: Connector }) {
  switch (connector.id) {
    case "walletConnect":
      return (
        <Image
          src="/static/icons/wallets/wallet-connect.svg"
          alt="Wallet Connect"
          width={36}
          height={36}
        />
      )
    case "coinbaseWalletSDK":
      return (
        <Image
          src="/static/icons/wallets/coinbase-wallet.svg"
          alt="Coinbase Wallet"
          width={36}
          height={36}
        />
      )
    case "metaMaskSDK":
      return (
        <Image
          src="/static/icons/wallets/meta-mask.svg"
          alt="MetaMask"
          width={36}
          height={36}
        />
      )
  }

  if (connector.icon != null) {
    return (
      <Image
        src={connector.icon.trim()}
        alt={connector.name}
        width={36}
        height={36}
      />
    )
  }
}

function renderWalletName(connector: Connector) {
  return connector.name
}

export default ConnectWallet
