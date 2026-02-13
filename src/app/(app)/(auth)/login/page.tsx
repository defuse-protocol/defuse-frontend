"use client"

import HelperPopover from "@src/components/HelperPopover"
import TokenIconPlaceholder from "@src/components/TokenIconPlaceholder"
import { useWebAuthnUIStore } from "@src/features/webauthn/hooks/useWebAuthnUiStore"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import { NearIntentsLogoIcon, PasskeyIcon } from "@src/icons"
import { useTonConnectUI } from "@tonconnect/ui-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"
import type { Connector } from "wagmi"

export default function LoginPage() {
  const { state, signIn, connectors } = useConnectWallet()
  const router = useRouter()
  const [tonConnectUI] = useTonConnectUI()
  const webauthnUI = useWebAuthnUIStore()

  const metamaskConnector = useMemo(
    () => connectors.find((c) => c.id === "io.metamask"),
    [connectors]
  )
  const walletConnectConnector = useMemo(
    () => connectors.find((c) => c.id === "walletConnect"),
    [connectors]
  )
  const browserWallets = useMemo(
    () =>
      connectors.filter(
        (c) =>
          c.type === "injected" && c.id !== "injected" && c.id !== "io.metamask"
      ),
    [connectors]
  )
  const fallbackInjected = useMemo(
    () =>
      !metamaskConnector && browserWallets.length === 0
        ? connectors.find((c) => c.id === "injected")
        : null,
    [connectors, metamaskConnector, browserWallets]
  )
  const otherEvmConnectors = useMemo(
    () =>
      connectors.filter(
        (c) =>
          c.id !== "io.metamask" &&
          c.id !== "walletConnect" &&
          c.id !== "injected" &&
          c.type !== "injected"
      ),
    [connectors]
  )

  useEffect(() => {
    if (state.isAuthorized && state.address) {
      router.replace("/account")
    }
  }, [state.isAuthorized, state.address, router])
  return (
    <div className="flex-1 flex flex-col items-center px-4 py-20">
      <div className="max-w-md w-full flex flex-col items-start">
        <Link href="/" className="shrink-0">
          <span className="sr-only">Home</span>
          <NearIntentsLogoIcon className="h-4 text-black" />
        </Link>

        <h1 className="mt-10! text-2xl font-bold text-fg tracking-tight">
          Sign up or Sign in
        </h1>

        <p className="mt-2! text-sm font-medium text-fg-secondary">
          Choose a wallet or passkey below—returning users{" "}
          <span className="font-bold text-fg">sign in</span>, new users{" "}
          <span className="font-bold text-fg">create an account</span>{" "}
          instantly.
        </p>

        <div className="mt-8 flex items-center gap-x-6 self-stretch">
          <div className="w-full flex-1 border-t border-border" />
          <div className="flex items-center gap-1.5">
            <p className="text-sm/6 font-medium text-nowrap text-fg-secondary">
              Wondering which to choose?
            </p>
            <HelperPopover>
              <p className="font-semibold">Passkey</p>
              <p className="mt-1">
                Simple login familiar to most users. Syncs across your devices.
                However, if you lose access to your passkey—e.g. Apple, Google,
                1Password, etc.—your account cannot be recovered.
              </p>
              <p className="mt-3 font-semibold">Web3 wallet</p>
              <p className="mt-1">
                Natural for existing crypto users with faster deposits directly
                from your wallet. Note that your NEAR Intents account address
                will match your wallet address, which could be a privacy
                consideration if you plan to share it for account-to-account
                transfers.
              </p>
            </HelperPopover>
          </div>
          <div className="w-full flex-1 border-t border-border" />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-6 w-full">
          <button
            type="button"
            onClick={() => webauthnUI.open()}
            className="rounded-2xl p-5 text-left flex flex-col items-start gap-4 outline outline-border bg-surface-card group hover:outline-2 hover:outline-border-strong focus-visible:outline-2 focus-visible:outline-fg"
          >
            <div className="size-10 flex items-center justify-center bg-surface-active rounded-full">
              <PasskeyIcon className="size-6" />
            </div>
            <span className="text-base font-semibold text-fg">Passkey</span>
          </button>
          <LoginButton
            name="NEAR"
            iconSrc="/static/icons/wallets/near-wallet.svg"
            onClick={() => signIn({ id: ChainType.Near })}
          />
          {metamaskConnector && (
            <LoginButton
              name="MetaMask"
              iconSrc="/static/icons/wallets/meta-mask.svg"
              onClick={() =>
                signIn({ id: ChainType.EVM, connector: metamaskConnector })
              }
            />
          )}
          {browserWallets.map((connector) => (
            <LoginButton
              key={connector.uid}
              name={connector.name}
              iconSrc={getWalletIconSrc(connector)}
              onClick={() => signIn({ id: ChainType.EVM, connector })}
            />
          ))}
          {fallbackInjected && (
            <LoginButton
              name="Browser Wallet"
              iconSrc={getWalletIconSrc(fallbackInjected)}
              onClick={() =>
                signIn({ id: ChainType.EVM, connector: fallbackInjected })
              }
            />
          )}
          <LoginButton
            name="Solana"
            iconSrc="/static/icons/wallets/solana-wallet.svg"
            onClick={() => signIn({ id: ChainType.Solana })}
          />
          {walletConnectConnector && (
            <LoginButton
              name="WalletConnect"
              iconSrc={getWalletIconSrc(walletConnectConnector)}
              onClick={() =>
                signIn({
                  id: ChainType.EVM,
                  connector: walletConnectConnector,
                })
              }
            />
          )}
          <LoginButton
            name="TON"
            iconSrc="/static/icons/wallets/ton.svg"
            onClick={() => void tonConnectUI.openModal()}
          />
          <LoginButton
            name="Stellar"
            iconSrc="/static/icons/network/stellar.svg"
            onClick={() => signIn({ id: ChainType.Stellar })}
          />
          <LoginButton
            name="Tron"
            iconSrc="/static/icons/network/tron.svg"
            onClick={() => signIn({ id: ChainType.Tron })}
          />
          {otherEvmConnectors.map((connector) => (
            <LoginButton
              key={connector.uid}
              name={connector.name}
              iconSrc={getWalletIconSrc(connector)}
              onClick={() => signIn({ id: ChainType.EVM, connector })}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function LoginButton({
  name,
  icon,
  iconSrc,
  onClick,
}: {
  name: string
  icon?: React.ReactNode
  iconSrc?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative rounded-2xl p-5 text-left flex flex-col items-start gap-4 outline outline-border bg-surface-card group hover:outline-2 hover:outline-border-strong focus-visible:outline-2 focus-visible:outline-fg"
    >
      <span className="absolute top-3 right-3 text-[10px] font-semibold text-fg-secondary bg-surface-active px-1.5 py-0.5 rounded">
        Web3
      </span>
      {icon ??
        (iconSrc ? (
          <Image src={iconSrc} alt="" width={40} height={40} />
        ) : (
          <TokenIconPlaceholder className="size-10" />
        ))}
      <span className="text-base font-semibold text-fg">{name}</span>
    </button>
  )
}

function getWalletIconSrc(connector: Connector): string {
  switch (connector.id) {
    case "walletConnect":
      return "/static/icons/wallets/wallet-connect.svg"
    case "coinbaseWalletSDK":
      return "/static/icons/wallets/coinbase-wallet.svg"
    case "io.metamask":
      return "/static/icons/wallets/meta-mask.svg"
    default:
      return connector.icon?.trim() ?? ""
  }
}
