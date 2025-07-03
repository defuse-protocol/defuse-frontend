"use client"

import { SwapWidget } from "@defuse-protocol/defuse-sdk"
import { useSearchParams } from "next/navigation"

import { isBaseToken } from "@defuse-protocol/defuse-sdk/utils"
import { useDeterminePair } from "@src/app/(home)/_utils/useDeterminePair"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useNearWalletActions } from "@src/hooks/useNearWalletActions"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { renderAppLink } from "@src/utils/renderAppLink"
import { useMemo } from "react"

export default function Swap() {
  const { state } = useConnectWallet()
  const signMessage = useWalletAgnosticSignMessage()
  const { signAndSendTransactions } = useNearWalletActions()
  const tokenList = useTokenList(LIST_TOKENS)
  const { tokenIn: defaultTokenIn, tokenOut: defaultTokenOut } =
    useDeterminePair()
  const referral = useIntentsReferral()
  const searchParams = useSearchParams()

  // Parse URL parameters for token preselection
  const tokenInSymbol = searchParams.get("tokenIn")
  const tokenOutSymbol = searchParams.get("tokenOut")

  // Find tokens by symbol from URL parameters
  const tokenIn = useMemo(() => {
    if (!tokenInSymbol) return defaultTokenIn

    return (
      LIST_TOKENS.find((token) => {
        if (isBaseToken(token)) {
          return token.symbol.toLowerCase() === tokenInSymbol.toLowerCase()
        }
        return token.groupedTokens.some(
          (t) => t.symbol.toLowerCase() === tokenInSymbol.toLowerCase()
        )
      }) || defaultTokenIn
    )
  }, [tokenInSymbol, defaultTokenIn])

  const tokenOut = useMemo(() => {
    if (!tokenOutSymbol) return defaultTokenOut

    return (
      LIST_TOKENS.find((token) => {
        if (isBaseToken(token)) {
          return token.symbol.toLowerCase() === tokenOutSymbol.toLowerCase()
        }
        return token.groupedTokens.some(
          (t) => t.symbol.toLowerCase() === tokenOutSymbol.toLowerCase()
        )
      }) || defaultTokenOut
    )
  }, [tokenOutSymbol, defaultTokenOut])

  return (
    <Paper>
      <SwapWidget
        tokenList={tokenList}
        userAddress={(state.isVerified ? state.address : undefined) ?? null}
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
        renderHostAppLink={renderAppLink}
        userChainType={state.chainType ?? null}
        referral={referral}
        initialTokenIn={tokenIn}
        initialTokenOut={tokenOut}
      />
    </Paper>
  )
}
