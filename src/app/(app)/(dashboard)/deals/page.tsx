"use client"

import { OtcMakerTrades } from "@src/components/DefuseSDK/features/otcDesk/components/OtcMakerTrades"
import { OtcTakerTrades } from "@src/components/DefuseSDK/features/otcDesk/components/OtcTakerTrades"
import { SwapWidgetProvider } from "@src/components/DefuseSDK/providers/SwapWidgetProvider"

import DealsHeader from "@src/components/DealsHeader"
import type { SignerCredentials } from "@src/components/DefuseSDK/core/formatters"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { useNearWallet } from "@src/providers/NearWalletProvider"
import { useMemo } from "react"
import { createOtcOrderLink } from "./_utils/link"

export default function DealsPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const signMessage = useWalletAgnosticSignMessage()
  const { signAndSendTransactions } = useNearWallet()

  const userAddress = state.isVerified ? state.address : undefined
  const userChainType = state.chainType

  const signerCredentials: SignerCredentials | null = useMemo(() => {
    return userAddress != null && userChainType != null
      ? {
          credential: userAddress,
          credentialType: userChainType,
        }
      : null
  }, [userChainType, userAddress])

  return (
    <>
      <DealsHeader />

      <SwapWidgetProvider>
        {signerCredentials != null && (
          <>
            <OtcMakerTrades
              tokenList={tokenList}
              signerCredentials={signerCredentials}
              signMessage={signMessage}
              generateLink={(tradeId, pKey, multiPayload, iv) => {
                return createOtcOrderLink(tradeId, pKey, multiPayload, iv)
              }}
              sendNearTransaction={async (tx) => {
                const result = await signAndSendTransactions({
                  transactions: [tx],
                })

                if (typeof result === "string") {
                  return { txHash: result }
                }

                const outcome = result[0]
                if (!outcome) {
                  throw new Error("No outcome")
                }

                return { txHash: outcome.transaction.hash }
              }}
            />
            <OtcTakerTrades tokenList={tokenList} />
          </>
        )}
      </SwapWidgetProvider>
    </>
  )
}
