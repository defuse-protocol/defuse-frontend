"use client"

import { SwapWidget } from "@defuse-protocol/defuse-sdk"
import { formatUnits } from "viem"

import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useNearWalletActions } from "@src/hooks/useNearWalletActions"
import { useNotificationStore } from "@src/providers/NotificationProvider"
import { useWalletSelector } from "@src/providers/WalletSelectorProvider"
import { NotificationType } from "@src/stores/notificationStore"
import { useNearCurrentAccount } from "@src/utils/myNearWalletAdapter"

export default function Swap() {
  const { accountId } = useWalletSelector()
  const { signMessage } = useNearWalletActions()
  const setNotification = useNotificationStore((state) => state.setNotification)
  const nearCurrentAccount = useNearCurrentAccount()

  return (
    <Paper
      title="Swap"
      description="Cross-chain swap across any network, any token."
    >
      <SwapWidget
        tokenList={LIST_TOKENS}
        userAddress={accountId}
        signMessage={async (params) => {
          const { signatureData, signedData } = await signMessage({
            ...params.NEP413,
            nonce: Buffer.from(params.NEP413.nonce),
          })

          return { type: "NEP413", signatureData, signedData }
        }}
        onSuccessSwap={({ amountOut, tokenOut }) => {
          setNotification({
            id: crypto.randomUUID(),
            message: `Transaction complete! You received ${formatUnits(amountOut, tokenOut.decimals)} ${tokenOut.symbol}`,
            type: NotificationType.SUCCESS,
          })
        }}
      />
    </Paper>
  )
}
