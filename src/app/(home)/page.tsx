"use client"
import { updateURLParams } from "@src/app/(home)/_utils/useDeterminePair"
import { useDeterminePair } from "@src/app/(home)/_utils/useDeterminePair"
import { SwapWidget } from "@src/components/DefuseSDK"
import { getTokens } from "@src/components/DefuseSDK/features/machines/1cs"
import { isBaseToken } from "@src/components/DefuseSDK/utils"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useNearWalletActions } from "@src/hooks/useNearWalletActions"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { renderAppLink } from "@src/utils/renderAppLink"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo } from "react"

export default function Swap() {
  const { state } = useConnectWallet()
  const signMessage = useWalletAgnosticSignMessage()
  const { signAndSendTransactions } = useNearWalletActions()
  const searchParams = useSearchParams()
  const is1cs = !!searchParams.get("1cs")
  const tokenList = useTokenList1cs(is1cs)
  const { tokenIn, tokenOut } = useDeterminePair()
  const referral = useIntentsReferral()
  const router = useRouter()
  const userAddress = state.isVerified ? state.address : undefined
  const userChainType = state.chainType

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
const TOKENS_WITHOUT_REF_AND_BRRR = LIST_TOKENS.filter(
  (token) => token.symbol !== "REF" && token.symbol !== "BRRR"
)

function useTokenList1cs(is1cs: boolean) {
  const tokenList = useTokenList(TOKENS_WITHOUT_REF_AND_BRRR)

  const { data: oneClickTokens, isLoading: is1csTokensLoading } = useQuery({
    queryKey: ["1cs-tokens"],
    queryFn: () => getTokens(),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  return useMemo(() => {
    if (!is1cs) {
      return tokenList
    }

    if (!oneClickTokens || is1csTokensLoading) {
      return []
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
