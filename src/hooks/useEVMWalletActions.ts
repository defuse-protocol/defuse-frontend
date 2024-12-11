import { config } from "@src/config/wagmi"
import { type SendTransactionParameters, sendTransaction } from "@wagmi/core"
import { useAccount, useSendTransaction } from "wagmi"

export function useEVMWalletActions() {
  const { sendTransactionAsync } = useSendTransaction()
  return {
    sendTransactions: async (tx: SendTransactionParameters) => {
      const outcome = await sendTransactionAsync({
        ...tx,
      })
      if (!outcome) {
        throw new Error("No outcome")
      }

      return outcome
    },
  }
}
