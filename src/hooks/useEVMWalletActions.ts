import type { SendTransactionParameters } from "@wagmi/core"
import { stringify, withTimeout } from "viem"
import { useAccount, useSendTransaction, useSwitchChain } from "wagmi"

export function useEVMWalletActions() {
  const { sendTransactionAsync } = useSendTransaction()
  const { switchChainAsync } = useSwitchChain()
  const { connector } = useAccount()

  return {
    sendTransactions: async (tx: SendTransactionParameters) => {
      console.log("Sending transaction", stringify({ tx }))

      const chainId = tx.chainId

      // We can't rely on `chainId` from `useSwitchChain()` or other hooks,
      // because it might out of sync with the actual chainId of the wallet.
      const currentChainId = await connector?.getChainId()

      if (chainId != null && currentChainId !== chainId) {
        console.log("Switching chain", stringify({ currentChainId, chainId }))
        await withTimeout(() => switchChainAsync({ connector, chainId }), {
          errorInstance: new Error(`Chain switch timeout chainId=${chainId}`),
          // WalletConnect issue: when network switching is not possible, it'll hang forever, so we need to set a timeout
          timeout: 30000,
        })
      }

      const txHash = await sendTransactionAsync({
        connector,
        gas: null, // Skip gas estimation
        ...tx,
      })

      return txHash
    },
  }
}
