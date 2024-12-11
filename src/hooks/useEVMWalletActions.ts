import { config } from "@src/config/wagmi"
import { type SendTransactionParameters, sendTransaction } from "@wagmi/core"
import { useAccount } from "wagmi"

export function useEVMWalletActions() {
  const { connector } = useAccount()

  return {
    sendTransactions: async (calldata: SendTransactionParameters) => {
      const outcome = await sendTransaction(config, {
        connector,
        to: calldata.to,
        data: calldata.data,
        value: calldata.value,
        gasPrice: calldata?.gasPrice ?? undefined,
      })
      if (!outcome) {
        throw new Error("No outcome")
      }

      return outcome
    },
  }
}
