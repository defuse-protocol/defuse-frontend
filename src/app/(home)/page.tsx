"use client"

import { SwapWidget, isBaseToken } from "@defuse-protocol/defuse-sdk"
import { useRouter } from "next/navigation"
import { useContext } from "react"

import Paper from "@src/components/Paper"
import type { WhitelabelTemplateValue } from "@src/config/featureFlags"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useNearWalletActions } from "@src/hooks/useNearWalletActions"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"

export default function Swap() {
  const { state } = useConnectWallet()
  const signMessage = useWalletAgnosticSignMessage()
  const { signAndSendTransactions } = useNearWalletActions()
  const tokenList = useTokenList(LIST_TOKENS)
  const { tokenIn, tokenOut } = useDeterminePair()
  const router = useRouter()
  const referral = useIntentsReferral()

  return (
    <Paper
      title="Swap"
      description="Cross-chain swap across any network, any token."
    >
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
        onNavigateDeposit={() => {
          router.push("/deposit")
        }}
        userChainType={state.chainType ?? null}
        referral={referral}
        initialTokenIn={tokenIn}
        initialTokenOut={tokenOut}
      />
    </Paper>
  )
}

const pairs: Record<WhitelabelTemplateValue, [string, string]> = {
  "near-intents": [
    "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near",
    "nep141:wrap.near",
  ],
  solswap: [
    "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near",
    "nep141:sol.omft.near",
  ],
  dogecoinswap: [
    "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near",
    "nep141:doge.omft.near",
  ],
  turboswap: [
    "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near",
    "nep141:a35923162c49cf95e6bf26623385eb431ad920d3.factory.bridge.near",
  ],
  trumpswap: [
    "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near",
    "nep141:sol-c58e6539c2f2e097c251f8edf11f9c03e581f8d4.omft.near",
  ],
}

export function useDeterminePair() {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  const pair = pairs[whitelabelTemplate]

  const tokenIn = LIST_TOKENS.find((token) => {
    if (isBaseToken(token)) {
      return token.defuseAssetId === pair[0]
    }

    return token.groupedTokens.some((t) => t.defuseAssetId === pair[0])
  })

  const tokenOut = LIST_TOKENS.find((token) => {
    if (isBaseToken(token)) {
      return token.defuseAssetId === pair[1]
    }

    return token.groupedTokens.some((t) => t.defuseAssetId === pair[1])
  })

  return { tokenIn, tokenOut }
}
