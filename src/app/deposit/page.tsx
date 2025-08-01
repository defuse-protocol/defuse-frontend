"use client"

import { DepositWidget } from "@src/components/DefuseSDK"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { renderAppLink } from "@src/utils/renderAppLink"

export default function Deposit() {
  const { state, sendTransaction } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)

  return (
    <Paper>
      <DepositWidget
        tokenList={tokenList}
        userAddress={state.isVerified ? state.address : undefined}
        userWalletAddress={
          state.isVerified &&
          state.chainType !== ChainType.WebAuthn &&
          state.displayAddress
            ? state.displayAddress
            : null
        }
        chainType={state.chainType}
        sendTransactionNear={async (tx) => {
          const result = await sendTransaction({
            id: ChainType.Near,
            tx,
          })
          return Array.isArray(result) ? result[0].transaction.hash : result
        }}
        sendTransactionEVM={async ({ from, ...tx }) => {
          const result = await sendTransaction({
            id: ChainType.EVM,
            tx: {
              ...tx,
              account: from,
            },
          })
          return Array.isArray(result) ? result[0].transaction.hash : result
        }}
        sendTransactionSolana={async (tx) => {
          const result = await sendTransaction({
            id: ChainType.Solana,
            tx,
          })
          return Array.isArray(result) ? result[0].transaction.hash : result
        }}
        sendTransactionTon={async (tx) => {
          const result = await sendTransaction({
            id: ChainType.Ton,
            tx,
          })
          return Array.isArray(result) ? result[0].transaction.hash : result
        }}
        renderHostAppLink={renderAppLink}
      />
    </Paper>
  )
}
