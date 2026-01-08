"use client"
import { ArrowLeftIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"
import TokenIconPlaceholder from "@src/components/TokenIconPlaceholder"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTonConnectUI } from "@tonconnect/ui-react"
import Image from "next/image"
import type { Connector } from "wagmi"

export default function LoginWalletPage() {
  const { signIn, connectors } = useConnectWallet()
  const [tonConnectUI] = useTonConnectUI()

  const handleNearWalletSelector = () => {
    return signIn({ id: ChainType.Near })
  }

  const handleWalletConnect = (connector: Connector) => {
    return signIn({ id: ChainType.EVM, connector })
  }

  const handleSolanaWalletSelector = () => {
    return signIn({ id: ChainType.Solana })
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="max-w-sm w-full">
        <h1 className="mt-12 text-3xl font-bold text-gray-900 text-center text-balance leading-[1.1] tracking-tight">
          Connect your wallet
        </h1>

        <div className="grid grid-cols-2 gap-2 mt-12">
          <WalletButton
            name="Solana Wallet"
            iconSrc="/static/icons/wallets/solana-wallet.svg"
            onClick={handleSolanaWalletSelector}
          />
          <WalletButton
            name="NEAR Wallet"
            iconSrc="/static/icons/wallets/near-wallet.svg"
            onClick={handleNearWalletSelector}
          />
          {connectors.slice(0, 1).map((connector) => (
            <WalletButton
              key={connector.uid}
              name={connector.name}
              iconSrc={getWalletIconSrc(connector)}
              onClick={() => handleWalletConnect(connector)}
            />
          ))}
          <WalletButton
            name="TON Wallet"
            iconSrc="/static/icons/wallets/ton.svg"
            onClick={() => void tonConnectUI.openModal()}
          />
          <WalletButton
            name="Stellar Wallet"
            iconSrc="/static/icons/network/stellar.svg"
            onClick={() => signIn({ id: ChainType.Stellar })}
          />
          <WalletButton
            name="Tron Wallet"
            iconSrc="/static/icons/network/tron.svg"
            onClick={() => signIn({ id: ChainType.Tron })}
          />
          {connectors
            .slice(1)
            .filter((connector) => connector.id !== "injected")
            .map((connector) => (
              <WalletButton
                key={connector.uid}
                name={connector.name}
                iconSrc={getWalletIconSrc(connector)}
                onClick={() => handleWalletConnect(connector)}
                testId={connector.name}
              />
            ))}
        </div>

        <Button size="xl" variant="secondary" className="mt-8" href="/login">
          <ArrowLeftIcon className="size-5" />
          Back
        </Button>
      </div>
    </div>
  )
}

const WalletButton = ({
  name,
  iconSrc,
  onClick,
  testId,
}: {
  name: string
  iconSrc: string
  onClick: () => void
  testId?: string
}) => (
  <button
    type="button"
    onClick={onClick}
    className="border border-gray-200 rounded-2xl p-4 text-left flex flex-col items-start gap-4 bg-white hover:bg-gray-50 hover:border-gray-300"
    data-testid={testId}
  >
    <WalletIcon src={iconSrc} />
    <span className="text-base font-medium text-gray-900">{name}</span>
  </button>
)

const getWalletIconSrc = (connector: Connector): string => {
  let src = ""

  if (connector.id === "walletConnect") {
    src = "/static/icons/wallets/wallet-connect.svg"
  } else if (connector.id === "coinbaseWalletSDK") {
    src = "/static/icons/wallets/coinbase-wallet.svg"
  } else if (connector.id === "io.metamask") {
    src = "/static/icons/wallets/meta-mask.svg"
  } else if (connector.icon != null) {
    src = connector.icon.trim()
  }

  return src
}

const WalletIcon = ({ src }: { src?: string }) =>
  src ? (
    <Image src={src} alt="" width={40} height={40} />
  ) : (
    <TokenIconPlaceholder className="size-10" />
  )
