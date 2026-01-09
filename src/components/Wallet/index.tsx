"use client"

import { Button, Popover, Text } from "@radix-ui/themes"
import Image from "next/image"
import { useContext, useEffect } from "react"
import type { Connector } from "wagmi"

import WalletConnections from "@src/components/Wallet/WalletConnections"
import { isSupportedByBrowser } from "@src/features/webauthn/lib/webauthnService"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import useShortAccountId from "@src/hooks/useShortAccountId"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import { useSignInWindowOpenState } from "@src/stores/useSignInWindowOpenState"
import { mapStringToEmojis } from "@src/utils/emoji"
import { TonConnectButton } from "./TonConnectButton"

const ConnectWallet = () => {
  const { isOpen, setIsOpen } = useSignInWindowOpenState()
  const { state, signIn, connectors, isLoading } = useConnectWallet()
  const { shortAccountId } = useShortAccountId(state.displayAddress ?? "")
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

  const handlePasskey = () => {
    return signIn({ id: ChainType.WebAuthn })
  }

  // Close sign-in popover when wallet gets connected
  useEffect(() => {
    if (state.address && isOpen) {
      setIsOpen(false)
    }
  }, [state.address, isOpen, setIsOpen])

  // Show loading spinner while wallet is connecting/reconnecting
  if (isLoading) {
    return (
      <Button
        type="button"
        variant="soft"
        color="gray"
        size="2"
        radius="full"
        disabled
      >
        <span className="size-4 border-2 border-gray-8 border-t-gray-11 rounded-full animate-spin" />
      </Button>
    )
  }

  if (!state.address) {
    return (
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger>
          <button
            type="button"
            className="flex items-center gap-4 py-4 px-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-gray-700 transition-colors w-full"
            data-testid="sign-in-button"
          >
            <div className="size-5 shrink-0" />
            <span className="text-base/5 font-semibold">Sign in</span>
          </button>
        </Popover.Trigger>
        <Popover.Content
          side="right"
          align="start"
          sideOffset={16}
          collisionPadding={16}
          maxWidth={{ initial: "90vw", xs: "480px" }}
          minWidth={{ initial: "300px", xs: "330px" }}
          maxHeight={{ initial: "70vh", sm: "90vh" }}
          className="dark:bg-black-800 bg-white rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700"
        >
          <Text size="1">How do you want to sign in?</Text>
          <div className="w-full grid grid-cols-1 gap-4 mt-4">
            <Text size="1" color="gray">
              Popular options
            </Text>

            {isSupportedByBrowser() && (
              <Button
                onClick={() => handlePasskey()}
                size="4"
                radius="medium"
                variant="soft"
                color="gray"
                className="px-2.5"
              >
                <div className="w-full flex items-center justify-start gap-2">
                  <Image
                    src="/static/icons/wallets/webauthn.svg"
                    alt=""
                    width={36}
                    height={36}
                  />
                  <Text size="2" weight="bold">
                    Passkey
                  </Text>
                </div>
              </Button>
            )}

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

                <TonConnectButton />

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
                      src="/static/icons/wallets/near-wallet.svg"
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
                      src="/static/icons/wallets/solana-wallet.svg"
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
                      src="/static/icons/wallets/solana-wallet.svg"
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
                          src="/static/icons/wallets/near-wallet.svg"
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

                    <TonConnectButton />

                    {/* Stellar connector */}
                    <Button
                      onClick={() => signIn({ id: ChainType.Stellar })}
                      size="4"
                      radius="medium"
                      variant="soft"
                      color="gray"
                      className="px-2.5"
                    >
                      <div className="w-full flex items-center justify-start gap-2">
                        <Image
                          src="/static/icons/network/stellar.svg"
                          alt="Stellar"
                          width={36}
                          height={36}
                        />
                        <Text size="2" weight="bold">
                          Stellar Wallet
                        </Text>
                      </div>
                    </Button>

                    {/* Tron connector */}
                    <Button
                      onClick={() => signIn({ id: ChainType.Tron })}
                      size="4"
                      radius="medium"
                      variant="soft"
                      color="gray"
                      className="px-2.5"
                    >
                      <div className="w-full flex items-center justify-start gap-2">
                        <Image
                          src="/static/icons/network/tron.svg"
                          alt="Tron"
                          width={36}
                          height={36}
                        />
                        <Text size="2" weight="bold">
                          Tron Wallet
                        </Text>
                      </div>
                    </Button>

                    <Text size="1" color="gray">
                      Other options
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
                          data-testid={connector.name}
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
    <Popover.Root>
      <Popover.Trigger>
        <button
          type="button"
          className="flex items-center gap-4 py-4 px-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-gray-700 transition-colors w-full"
          data-testid="account-indicator"
        >
          {state.chainType !== "webauthn" ? (
            <>
              <div className="size-5 shrink-0 flex items-center justify-center">
                <div className="size-2.5 rounded-full bg-green-500" />
              </div>
              <span className="text-base/5 font-semibold">
                {shortAccountId}
              </span>
            </>
          ) : (
            <>
              <div className="size-5 shrink-0 flex items-center justify-center relative">
                <Image
                  src="/static/icons/wallets/webauthn.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="rounded-full size-5"
                />
                <div className="absolute -right-1 -bottom-1 rounded-full size-3 bg-white text-black text-[8px] flex items-center justify-center">
                  {mapStringToEmojis(state.address, { count: 1 }).join("")}
                </div>
              </div>
              <span className="text-base/5 font-semibold">Passkey</span>
            </>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Content
        side="bottom"
        align="start"
        sideOffset={8}
        collisionPadding={16}
        minWidth={{ initial: "300px", xs: "330px" }}
        className="!bg-white dark:!bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-0"
      >
        <WalletConnections />
      </Popover.Content>
    </Popover.Root>
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
