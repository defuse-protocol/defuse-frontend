import { setUser } from "@sentry/nextjs"
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react"
import { useNearWallet } from "@src/providers/NearWalletProvider"
import { EthereumProvider } from "@walletconnect/ethereum-provider"
import { useEffect } from "react"
import { useAccount } from "wagmi"
import { useConnectWallet } from "./useConnectWallet"

export const useSentrySetUser = () => {
  const { connector: nearWallet } = useNearWallet()
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
      // This is a special case, since for faked user there is no wallet info
      if (userConnectionState.isFake) {
        return null
      }

      let walletProvider: string | undefined = undefined
      let walletAppName: string | undefined = undefined

      switch (userConnectionState.chainType) {
        case "solana": {
          walletProvider = "solana" // todo: how to distinguish between injected wallet or WalletConnect?
          walletAppName = solanaWallet?.adapter.name
          break
        }
        case "near": {
          if (!nearWallet) {
            throw new Error("Near wallet not connected")
          }
          const wallet = await nearWallet.wallet()
          walletProvider = "near"
          walletAppName = wallet.manifest.name
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
  }, [nearWallet, connector, solanaWallet, userConnectionState])
}
