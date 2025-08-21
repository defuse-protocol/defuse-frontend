"use client"

import { updateURLParams } from "@src/app/(home)/_utils/useDeterminePair"
import { useDeterminePair } from "@src/app/(home)/_utils/useDeterminePair"
import { SwapWidget } from "@src/components/DefuseSDK"
import Paper from "@src/components/Paper"
import { LIST_TOKENS, type TokenWithTags } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useNearWalletActions } from "@src/hooks/useNearWalletActions"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { renderAppLink } from "@src/utils/renderAppLink"
import { useRouter, useSearchParams } from "next/navigation"

export default function Swap() {
  const { state } = useConnectWallet()
  const signMessage = useWalletAgnosticSignMessage()
  const { signAndSendTransactions } = useNearWalletActions()
  const tokenList = useTokenList(filterOutRefAndBrrrTokens(LIST_TOKENS))
  const { tokenIn, tokenOut } = useDeterminePair()
  const referral = useIntentsReferral()
  const router = useRouter()
  const searchParams = useSearchParams()

  const userAddress = state.isVerified ? state.address : undefined
  const userChainType = state.chainType

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
