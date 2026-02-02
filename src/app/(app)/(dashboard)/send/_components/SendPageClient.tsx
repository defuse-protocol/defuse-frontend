"use client"

import { WithdrawWidget } from "@src/components/DefuseSDK/features/withdraw/components/WithdrawWidget"
import PageHeader from "@src/components/PageHeader"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { useNearWallet } from "@src/providers/NearWalletProvider"
import { renderAppLink } from "@src/utils/renderAppLink"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef } from "react"
import { updateURLParamsWithdraw } from "../_utils/updateURLParams"

type SendPageClientProps = {
  presetToken: string | undefined
  presetNetwork: string | undefined
  presetRecipient: string | undefined
  initialHadParams: boolean
  shouldUpdateUrl?: boolean
}

export function SendPageClient({
  presetToken,
  presetNetwork,
  presetRecipient,
  initialHadParams,
  shouldUpdateUrl,
}: SendPageClientProps) {
  const { state } = useConnectWallet()
  const signMessage = useWalletAgnosticSignMessage()
  const { signAndSendTransactions } = useNearWallet()
  const tokenList = useTokenList(LIST_TOKENS, true)
  const referral = useIntentsReferral()
  const router = useRouter()
  const queryParams = useSearchParams()
  const hasUpdatedUrlRef = useRef(false)

  useEffect(() => {
    if (shouldUpdateUrl && !hasUpdatedUrlRef.current) {
      hasUpdatedUrlRef.current = true
      const params = new URLSearchParams()
      if (presetToken) params.set("token", presetToken)
      if (presetNetwork) params.set("network", presetNetwork)
      if (presetRecipient) params.set("recipient", presetRecipient)
      const queryString = params.toString()
      router.replace(queryString ? `/send?${queryString}` : "/send", {
        scroll: false,
      })
    }
  }, [shouldUpdateUrl, presetToken, presetNetwork, presetRecipient, router])

  const handleFormChange = useCallback(
    (params: {
      token: string | null
      network: string
      recipient: string
      recipientChanged: boolean
      networkChanged: boolean
    }) => {
      if (!initialHadParams) return

      if (params.networkChanged) {
        updateURLParamsWithdraw({
          token: params.token,
          network: params.network,
          contactId: null,
          recipient: undefined,
          router,
          searchParams: queryParams,
        })
        return
      }

      if (params.recipientChanged) {
        const shouldUpdateRecipient =
          queryParams.has("token") || queryParams.has("recipient")
        updateURLParamsWithdraw({
          token: params.token,
          network: params.network,
          contactId: null,
          recipient: shouldUpdateRecipient ? params.recipient : null,
          router,
          searchParams: queryParams,
        })
        return
      }

      updateURLParamsWithdraw({
        token: params.token,
        network: params.network,
        contactId: undefined,
        recipient: undefined,
        router,
        searchParams: queryParams,
      })
    },
    [initialHadParams, router, queryParams]
  )

  const userAddress = state.isVerified ? state.address : undefined
  const userChainType = state.chainType

  return (
    <>
      <PageHeader title="Transfer" />

      <WithdrawWidget
        presetNetwork={presetNetwork}
        presetRecipient={presetRecipient}
        presetTokenSymbol={presetToken}
        presetValuesForSync={{
          network: presetNetwork,
          recipient: presetRecipient,
        }}
        tokenList={tokenList}
        userAddress={userAddress}
        displayAddress={state.isVerified ? state.displayAddress : undefined}
        chainType={userChainType}
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
        renderHostAppLink={renderAppLink}
        referral={referral}
        onFormChange={handleFormChange}
      />
    </>
  )
}
