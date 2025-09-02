"use client"

import { updateURLParams } from "@src/app/(home)/_utils/useDeterminePair"
import { useDeterminePair } from "@src/app/(home)/_utils/useDeterminePair"
import { SwapWidget } from "@src/components/DefuseSDK"
import Paper from "@src/components/Paper"
import { LIST_TOKENS, type TokenWithTags } from "@src/constants/tokens"
import { use1csTokens } from "@src/hooks/use1csTokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useNearWalletActions } from "@src/hooks/useNearWalletActions"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { filter1csTokens } from "@src/utils/filter1csTokens"
import { renderAppLink } from "@src/utils/renderAppLink"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo } from "react"

export default function Swap() {
  const { state } = useConnectWallet()
  const signMessage = useWalletAgnosticSignMessage()
  const { signAndSendTransactions } = useNearWalletActions()
  const baseTokenList = useTokenList(filterOutRefAndBrrrTokens(LIST_TOKENS))
  const { tokenIn, tokenOut } = useDeterminePair()
  const referral = useIntentsReferral()
  const router = useRouter()
  const searchParams = useSearchParams()

  const userAddress = state.isVerified ? state.address : undefined
  const userChainType = state.chainType
  const is1cs = !!searchParams.get("1cs")

  const { data: oneClickTokens, isLoading: is1csTokensLoading } = use1csTokens()

  const tokenList = useMemo(() => {
    if (!is1cs) {
      return baseTokenList
    }

    if (!oneClickTokens || is1csTokensLoading) {
      return []
    }

    return filter1csTokens(baseTokenList, oneClickTokens)
  }, [is1cs, baseTokenList, oneClickTokens, is1csTokensLoading])

  return (
    <Paper>
      <SwapWidget
        is1cs={is1cs}
        tokenList={tokenList}
        userAddress={userAddress}
        sendNearTransaction={async (tx) => {
          const result = await signAndSendTransactions({ transactions: [tx] })

          if (typeof result === "string") {
            return { txHash: result }
          }

          const outcome = result[0]
          if (!outcome) {
            throw new Error("No outcome")
          }

          return { txHash: outcome.transaction.hash }
        }}
        signMessage={(params) => signMessage(params)}
        onSuccessSwap={() => {}}
        renderHostAppLink={(routeName, children, props) =>
          renderAppLink(routeName, children, props, searchParams)
        }
        userChainType={userChainType}
        referral={referral}
        initialTokenIn={tokenIn ?? undefined}
        initialTokenOut={tokenOut ?? undefined}
        onTokenChange={(params) =>
          updateURLParams({ ...params, router, searchParams })
        }
      />
    </Paper>
  )
}

// These tokens no longer tradable and might be removed in future.
function filterOutRefAndBrrrTokens(LIST_TOKENS: TokenWithTags[]) {
  return LIST_TOKENS.filter(
    (token) => token.symbol !== "REF" && token.symbol !== "BRRR"
  )
}
