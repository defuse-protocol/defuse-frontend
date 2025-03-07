import type { WalletSelector } from "@near-wallet-selector/core"
import { providers } from "near-api-js"
import type { AccountView } from "near-api-js/lib/providers/provider"
import { useCallback } from "react"

import {
  CONNECTOR_BTC_MAINNET,
  CONNECTOR_ETH_BASE,
} from "@src/constants/contracts"
import { useAccountBalance } from "@src/hooks/useAccountBalance"
import type { Account } from "@src/types/interfaces"
import { NEAR_NODE_URL } from "@src/utils/environment"

type Props = {
  accountId: string | null
  selector: WalletSelector | null
}

export const useGetAccount = ({ accountId, selector }: Props) => {
  const { getAccountBalance } = useAccountBalance()

  // biome-ignore lint/correctness/useExhaustiveDependencies: <reason>
  const getAccount = useCallback(async (): Promise<Account | null> => {
    if (!accountId || !selector) {
      return null
    }

    // const { network } = selector.options
    const provider = new providers.JsonRpcProvider({ url: NEAR_NODE_URL })

    const { hasBalance } = await getAccountBalance()

    if (!hasBalance) {
      window.alert(
        `Account ID: ${accountId} has not been founded. Please send some NEAR into this account.`
      )
      const wallet = await selector.wallet()
      await wallet.signOut()
      return null
    }

    return provider
      .query<AccountView>({
        request_type: "view_account",
        finality: "final",
        account_id: accountId,
      })
      .then((data) => ({
        ...data,
        account_id: accountId,
      }))
  }, [accountId, selector])

  const getAccountIdBase = (): string | null => {
    const accountIdFromLocal = localStorage.getItem(CONNECTOR_ETH_BASE)
    if (!accountIdFromLocal) {
      return null
    }
    return accountIdFromLocal
  }

  const getAccountIdBinance = (): string | null => {
    const accountIdFromLocal = localStorage.getItem(CONNECTOR_BTC_MAINNET)
    if (!accountIdFromLocal) {
      return null
    }
    return accountIdFromLocal
  }

  return {
    getAccount,
    getAccountIdBase,
    getAccountIdBinance,
  }
}
