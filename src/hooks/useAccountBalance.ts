import { providers } from "near-api-js"
import type { AccountView } from "near-api-js/lib/providers/provider"

import { useWalletSelector } from "@src/providers/WalletSelectorProvider"
import { NEAR_NODE_URL } from "@src/utils/environment"

export interface GetAccountBalanceProps {
  provider: providers.Provider
  accountId: string
}

export interface GetAccountBalanceResult {
  hasBalance: boolean
  balance: string
}

export const useAccountBalance = () => {
  const { accountId } = useWalletSelector()

  const getAccountBalance = async (): Promise<GetAccountBalanceResult> => {
    const balance = { hasBalance: false, balance: "0" }
    try {
      if (!accountId) {
        return balance
      }
      const provider = new providers.JsonRpcProvider({ url: NEAR_NODE_URL })
      const { amount } = await provider.query<AccountView>({
        request_type: "view_account",
        finality: "final",
        account_id: accountId,
      })
      const isZero = BigInt(amount) === BigInt(0)
      return Object.assign(balance, { hasBalance: !isZero, balance: amount })
    } catch (e) {
      console.log("useAccountBalance: ", e)
      return balance
    }
  }

  return {
    getAccountBalance,
  }
}
