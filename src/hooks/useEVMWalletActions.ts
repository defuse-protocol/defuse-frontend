import type { SendTransactionParameters } from "@wagmi/core"
import { withTimeout } from "viem"
import { useSendTransaction, useSwitchChain } from "wagmi"

export function useEVMWalletActions() {
  const { sendTransactionAsync } = useSendTransaction()
  const { switchChainAsync } = useSwitchChain()

  return {
    sendTransactions: async (tx: SendTransactionParameters) => {
      console.log("Sending transaction", serializeStructuredLogData({ tx }))

      const chainId = tx.chainId
      if (chainId != null) {
        await withTimeout(() => switchChainAsync({ chainId }), {
          errorInstance: new Error(`Chain switch timeout chainId=${chainId}`),
          // WalletConnect issue: when network switching is not possible, it'll hang forever, so we need to set a timeout
          timeout: 30000,
        })
      }

      const txHash = await sendTransactionAsync(tx)

      return txHash
    },
  }
}

function serializeStructuredLogData(data: object) {
  return JSON.stringify(data, (key, value) =>
    typeof value === "bigint" ? value.toString() : value
  )
}
