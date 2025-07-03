"use client"
import { SwapWidget } from "@defuse-protocol/defuse-sdk"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

import { useDeterminePair } from "@src/app/(home)/_utils/useDeterminePair"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useNearWalletActions } from "@src/hooks/useNearWalletActions"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { findTokenBySymbol } from "@src/utils/findTokenBySymbol"
import { renderAppLink } from "@src/utils/renderAppLink"

export default function Swap() {
  const { state } = useConnectWallet()
  const signMessage = useWalletAgnosticSignMessage()
  const { signAndSendTransactions } = useNearWalletActions()
  const tokenList = useTokenList(LIST_TOKENS)
  const { tokenIn: defaultTokenIn, tokenOut: defaultTokenOut } =
    useDeterminePair()
  const referral = useIntentsReferral()
  const searchParams = useSearchParams()
  const tokenInSymbol = searchParams.get("tokenIn")
  const tokenOutSymbol = searchParams.get("tokenOut")

  const tokenIn = useMemo(() => {
    return findTokenBySymbol(tokenInSymbol, defaultTokenIn)
  }, [tokenInSymbol, defaultTokenIn])

  const tokenOut = useMemo(() => {
    return findTokenBySymbol(tokenOutSymbol, defaultTokenOut)
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
