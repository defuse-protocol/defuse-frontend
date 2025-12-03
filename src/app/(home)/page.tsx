"use client"
import { useDeterminePair } from "@src/app/(home)/_utils/useDeterminePair"
import { getTokens } from "@src/components/DefuseSDK/features/machines/1cs"
import { SwapWidget } from "@src/components/DefuseSDK/features/swap/components/SwapWidget"
import { isBaseToken } from "@src/components/DefuseSDK/utils"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useIs1CsEnabled } from "@src/hooks/useIs1CsEnabled"
import { prefetchMostTradableTokens } from "@src/hooks/useMostTradableTokens"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { useNearWallet } from "@src/providers/NearWalletProvider"
import { renderAppLink } from "@src/utils/renderAppLink"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo } from "react"

export default function Swap() {
  const { state } = useConnectWallet()
  const signMessage = useWalletAgnosticSignMessage()
  const { signAndSendTransactions } = useNearWallet()
  const searchParams = useSearchParams()
  const userAddress = state.isVerified ? state.address : undefined
  const userChainType = state.chainType
  const tokenList = useTokenList1cs()
  const { tokenIn, tokenOut } = useDeterminePair(true)
  const referral = useIntentsReferral()

  useEffect(() => {
    const timer = setTimeout(() => {
      void prefetchMostTradableTokens()
    }, 3000)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  return (
    <Paper>
      <SwapWidget
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
      />
    </Paper>
  )
}

// These tokens no longer tradable and might be removed in future.
const TOKENS_WITHOUT_REF_AND_BRRR = LIST_TOKENS.filter(
  (token) =>
    token.symbol !== "REF" &&
    token.symbol !== "BRRR" &&
    // TMP FIX
    token.symbol !== "NEAR"
)

function useTokenList1cs() {
  const tokenList = useTokenList(TOKENS_WITHOUT_REF_AND_BRRR, true)

  const { data: oneClickTokens, isLoading: is1csTokensLoading } = useQuery({
    queryKey: ["1cs-tokens"],
    queryFn: () => getTokens(),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  const is1cs = useIs1CsEnabled()

  return useMemo(() => {
    if (!is1cs || !oneClickTokens || is1csTokensLoading) {
      return tokenList
    }

    const oneClickAssetIds = new Set(
      oneClickTokens.map((token) => token.assetId)
    )

    return tokenList.filter((token) => {
      return isBaseToken(token)
        ? oneClickAssetIds.has(token.defuseAssetId)
        : oneClickAssetIds.has(token.groupedTokens[0]?.defuseAssetId)
    })
  }, [is1cs, tokenList, oneClickTokens, is1csTokensLoading])
}
