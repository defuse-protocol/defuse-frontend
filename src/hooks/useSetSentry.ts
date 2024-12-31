import { setUser } from "@sentry/nextjs"
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react"
import { EthereumProvider } from "@walletconnect/ethereum-provider"
import { useEffect } from "react"
import { useAccount } from "wagmi"

import { useWalletSelector } from "@src/providers/WalletSelectorProvider"
import { useConnectWallet } from "./useConnectWallet"

export const useSentrySetUser = () => {
  const { selector } = useWalletSelector()
  const { connector } = useAccount()
  const { wallet: solanaWallet } = useSolanaWallet()
  const { state: userConnectionState } = useConnectWallet()

  useEffect(() => {
    const abortCtrl = new AbortController()

    void getUserDetails().then((user) => {
      if (abortCtrl.signal.aborted) return
      setUser(user)
    })

    return () => {
      abortCtrl.abort()
    }

    async function getUserDetails() {
      let walletProvider: string | undefined = undefined
      let walletAppName: string | undefined = undefined

      switch (userConnectionState.chainType) {
        case "solana": {
          walletProvider = "solana" // todo: how to distinguish between injected wallet or WalletConnect?
          walletAppName = solanaWallet?.adapter.name
          break
        }
        case "near": {
          const wallet = await selector.wallet()
          walletProvider = wallet.type
          walletAppName = wallet.metadata.name
          break
        }
        case "evm": {
          walletProvider = connector?.type
          walletAppName = connector?.name

          if (connector?.name === "WalletConnect") {
            try {
              const provider = await connector.getProvider()
              if (provider instanceof EthereumProvider) {
                walletAppName =
                  provider.session?.peer.metadata?.name ?? connector.name
              }
            } catch {
              walletAppName = connector.name
            }
          }
          break
        }
      }

      return {
        id: userConnectionState.address,
        walletChainType: userConnectionState.chainType,
        walletProvider,
        walletAppName,
      }
    }
  }, [selector.wallet, connector, solanaWallet, userConnectionState])
}
