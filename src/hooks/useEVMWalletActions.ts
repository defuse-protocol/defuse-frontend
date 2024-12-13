import type { SendTransactionParameters } from "@wagmi/core"
import { withTimeout } from "viem"
import {
  serialize,
  useAccount,
  useSendTransaction,
  useSwitchChain,
} from "wagmi"

export function useEVMWalletActions() {
  const { sendTransactionAsync } = useSendTransaction()
  const { switchChainAsync } = useSwitchChain()
  const { connector } = useAccount()

  return {
    sendTransactions: async (tx: SendTransactionParameters) => {
      console.log("Sending transaction", serialize({ tx }))

      const chainId = tx.chainId

      // We can't rely on `chainId` from `useSwitchChain()` or other hooks,
      // because it might out of sync with the actual chainId of the wallet.
      const currentChainId = await connector?.getChainId()

      if (chainId != null && currentChainId !== chainId) {
        console.log("Switching chain", serialize({ currentChainId, chainId }))
        await withTimeout(() => switchChainAsync({ connector, chainId }), {
          errorInstance: new Error(`Chain switch timeout chainId=${chainId}`),
          // WalletConnect issue: when network switching is not possible, it'll hang forever, so we need to set a timeout
          timeout: 30000,
        })
      }

      const txHash = await sendTransactionAsync({
        connector,
        ...tx,
      })

      return txHash
    },
  }
}
