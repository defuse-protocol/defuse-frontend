"use client"

import { useDeterminePair } from "@src/app/(home)/_utils/useDeterminePair"
import { SwapWidget } from "@src/components/DefuseSDK/features/swap/components/SwapWidget"
import Paper from "@src/components/Paper"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { prefetchMostTradableTokens } from "@src/hooks/useMostTradableTokens"
import { useTokenList1cs } from "@src/hooks/useTokenList1cs"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { useNearWallet } from "@src/providers/NearWalletProvider"
import { renderAppLink } from "@src/utils/renderAppLink"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

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
