"use client"

import TokenIconPlaceholder from "@src/components/TokenIconPlaceholder"
import { useWebAuthnUIStore } from "@src/features/webauthn/hooks/useWebAuthnUiStore"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import { LogoIcon, PasskeyIcon } from "@src/icons"
import { useTonConnectUI } from "@tonconnect/ui-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import type { Connector } from "wagmi"

export default function LoginPage() {
  const router = useRouter()
  const { signIn, connectors, state } = useConnectWallet()
  const [tonConnectUI] = useTonConnectUI()
  const webauthnUI = useWebAuthnUIStore()

  useEffect(() => {
    if (state.address) {
      router.replace("/account")
    }
  }, [state.address, router])

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-20">
      <div className="max-w-md w-full flex flex-col items-start">
        <LogoIcon className="h-3.5 shrink-0" />

        <h1 className="mt-10! text-2xl font-bold text-gray-900 tracking-tight">
          Log in
        </h1>

        <p className="mt-2! text-sm font-medium text-gray-500">
          Near Intents is like a Binance or Kraken, but on-chain and
          permissionless. Create an account, deposit some assets, and experience
          blazingly fast cross-chain swapping, and other features made possible
          by technology created at NEAR.
        </p>

        <button
          type="button"
          onClick={() => webauthnUI.open()}
          className="mt-8 flex flex-col items-start p-5 rounded-2xl text-left outline outline-gray-200 bg-white hover:outline-2 hover:outline-gray-300 focus-visible:outline-2 focus-visible:outline-gray-900"
        >
          <div className="flex items-start justify-between gap-2 self-stretch">
            <div className="flex items-center justify-center size-10 bg-gray-100 rounded-full">
              <PasskeyIcon className="size-5" />
            </div>
            <div className="flex items-center gap-1.5 text-xs/none font-semibold text-green-700 bg-green-100 rounded-md px-2 py-1.5 whitespace-pre">
              <span className="size-1.5 rounded-full bg-green-500 shrink-0" />
              Recommended
            </div>
          </div>
          <span className="mt-6 text-base font-semibold text-gray-900">
            Continue with passkey
          </span>
          <span className="mt-2 text-sm font-medium text-gray-500 text-balance">
            Use a passkey for the best experience, and one that syncs across
            your devices.
          </span>
        </button>

        <div className="mt-10 flex items-center gap-x-6 self-stretch">
          <div className="w-full flex-1 border-t border-gray-200" />
          <p className="text-sm/6 font-medium text-nowrap text-gray-500">
            Or, use almost any Web3 wallet
          </p>
          <div className="w-full flex-1 border-t border-gray-200" />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-10 w-full">
          <LoginButton
            name="Solana"
            iconSrc="/static/icons/wallets/solana-wallet.svg"
            onClick={() => signIn({ id: ChainType.Solana })}
          />
          <LoginButton
            name="NEAR"
            iconSrc="/static/icons/wallets/near-wallet.svg"
            onClick={() => signIn({ id: ChainType.Near })}
          />
          {connectors.slice(0, 1).map((connector) => (
            <LoginButton
              key={connector.uid}
              name={connector.name}
              iconSrc={getWalletIconSrc(connector)}
              onClick={() => signIn({ id: ChainType.EVM, connector })}
            />
          ))}
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
          {connectors
            .slice(1)
            .filter((connector) => connector.id !== "injected")
            .map((connector) => (
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
      className="rounded-2xl p-5 text-left flex flex-col items-start gap-4 outline outline-gray-200 bg-white group hover:outline-2 hover:outline-gray-300 focus-visible:outline-2 focus-visible:outline-gray-900"
    >
      {icon ??
        (iconSrc ? (
          <Image src={iconSrc} alt="" width={40} height={40} />
        ) : (
          <TokenIconPlaceholder className="size-10" />
        ))}
      <span className="text-base font-semibold text-gray-900">{name}</span>
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
