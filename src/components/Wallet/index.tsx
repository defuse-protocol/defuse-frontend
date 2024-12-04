"use client"

import { Button, Popover, Text } from "@radix-ui/themes"
import clsx from "clsx"
import Image from "next/image"
import React, { useContext } from "react"
import type { Connector } from "wagmi"

import WalletConnections from "@src/components/Wallet/WalletConnections"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import useShortAccountId from "@src/hooks/useShortAccountId"
import { useWalletAgreement } from "@src/hooks/useWalletAgreement"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"

const TURN_OFF_APPS = process?.env?.turnOffApps === "true" ?? true

const ConnectWallet = () => {
  const { state } = useConnectWallet()
  const { shortAccountId } = useShortAccountId(state.address ?? "")
  const { signIn, connectors } = useConnectWallet()
  const walletAgreement = useWalletAgreement()
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  const handleNearWalletSelector = () => {
    if (walletAgreement.nearConfirmed) {
      return signIn({ id: ChainType.Near })
    }
    walletAgreement.setContext({ show: true, chain: ChainType.Near })
  }

  const handleWalletConnect = (connector: Connector) => {
    signIn({ id: ChainType.EVM, connector })
  }

  const handleSolanaWalletSelector = () => {
    if (walletAgreement.solanaConfirmed) {
      return signIn({ id: ChainType.Solana })
    }
    walletAgreement.setContext({ show: true, chain: ChainType.Solana })
  }

  const handleWalletAgreement = (call: (cb: () => void) => void) => {
    if (!walletAgreement.context) return
    const chain = walletAgreement.context.chain
    switch (chain) {
      case "near":
        call(() => signIn({ id: ChainType.Near }))
        break
      case "solana":
        call(() => signIn({ id: ChainType.Solana }))
        break
      default:
        chain satisfies never
    }
  }

  if (!state.address || TURN_OFF_APPS) {
    return (
      <Popover.Root>
        <Popover.Trigger>
          <Button
            type={"button"}
            size={"3"}
            radius={"full"}
            disabled={TURN_OFF_APPS}
          >
            <Text size="2" weight="medium" wrap="nowrap">
              Connect wallet
            </Text>
          </Button>
        </Popover.Trigger>
        <Popover.Content className="min-w-[330px] md:mr-[48px] dark:bg-black-800 rounded-2xl">
          {walletAgreement.context?.show && (
            <div className="w-full grid grid-cols-1 gap-4 mt-4">
              <Text size="2">
                Ledger is not currently supported on
                <span className="font-bold mx-1">
                  {walletAgreement.context?.chain}
                </span>
                wallets. Please use other wallets with Ledger. We are actively
                working on adding support for it.
              </Text>
              <Button
                variant="soft"
                onClick={() => handleWalletAgreement(walletAgreement.submit)}
              >
                Ok
              </Button>
              <Button
                variant="soft"
                color="gray"
                onClick={() => handleWalletAgreement(walletAgreement.off)}
              >
                Don't show again
              </Button>
            </div>
          )}
          {!walletAgreement.context?.show && (
            <>
              <Text size="1">How do you want to connect?</Text>
              <div className="w-full grid grid-cols-1 gap-4 mt-4">
                <Text size="1" color="gray">
                  Popular wallets
                </Text>
                {/* TODO: Show first 3 connectors */}

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
                    {connectors.slice(1).map((connector) => (
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
              </div>
            </>
          )}
        </Popover.Content>
      </Popover.Root>
    )
  }

  return (
    <div className="flex gap-2">
      <Popover.Root>
        <Popover.Trigger>
          <button
            type={"button"}
            className="rounded-full bg-gray-200 text-black-400 text-sm px-3 py-1.5 dark:bg-gray-1000 dark:text-gray-100"
            disabled={TURN_OFF_APPS}
          >
            {shortAccountId}
          </button>
        </Popover.Trigger>
        <Popover.Content className="min-w-[330px] mt-1 md:mr-[48px] dark:bg-black-800 rounded-2xl">
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
    case "nearWalletSelector":
      return (
        <Image
          src="/static/icons/wallets/near-wallet-selector.svg"
          alt="Near Wallet Selector"
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
    case "injected":
      return (
        <Image
          src="/static/icons/wallets/injected-wallets.svg"
          alt="Injected"
          width={36}
          height={36}
        />
      )
  }
}

function renderWalletName(connector: Connector) {
  switch (connector.id) {
    case "injected":
      return "Browser Wallet"
    default:
      return connector.name
  }
}

export default ConnectWallet
