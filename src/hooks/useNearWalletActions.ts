import type {
  SignMessageParams,
  SignedMessage,
} from "@near-wallet-selector/core/src/lib/wallet/wallet.types"
import { useWalletSelector } from "@src/providers/WalletSelectorProvider"
import type { SignAndSendTransactionsParams } from "@src/types/interfaces"

export function useNearWalletActions() {
  const { selector } = useWalletSelector()

  return {
    signMessage: async (
      params: SignMessageParams
    ): Promise<{
      signatureData: SignedMessage
      signedData: SignMessageParams
    }> => {
      const wallet = await selector.wallet()

      const signatureData = await wallet.signMessage(params)
      if (!signatureData) {
        throw new Error("No signature")
      }

      return {
        signatureData,
        signedData: params,
      }
    },

    signAndSendTransactions: async (params: SignAndSendTransactionsParams) => {
      const wallet = await selector.wallet()
      const outcome = await wallet.signAndSendTransactions(params)
      if (!outcome) {
        throw new Error("No outcome")
      }

      return outcome
    },
  }
}
