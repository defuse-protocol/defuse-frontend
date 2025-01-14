import { useWallet as useWalletSolana } from "@solana/wallet-adapter-react"
import { useSignMessage } from "wagmi"

import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import { useNearWalletActions } from "@src/hooks/useNearWalletActions"
import type {
  WalletMessage,
  WalletSignatureResult,
} from "@src/types/walletMessages"

export function useWalletAgnosticSignMessage() {
  const { state } = useConnectWallet()
  const { signMessage: signMessageNear } = useNearWalletActions()
  const { signMessageAsync: signMessageAsyncWagmi } = useSignMessage()
  const solanaWallet = useWalletSolana()

  return async (
    walletMessage: WalletMessage
  ): Promise<WalletSignatureResult> => {
    const chainType = state.chainType

    switch (chainType) {
      case ChainType.EVM: {
        const signatureData = await signMessageAsyncWagmi({
          message: walletMessage.ERC191.message,
        })
        return {
          type: "ERC191",
          signatureData,
          signedData: walletMessage.ERC191,
        }
      }

      case ChainType.Near: {
        const { signatureData, signedData } = await signMessageNear({
          ...walletMessage.NEP413,
          nonce: Buffer.from(walletMessage.NEP413.nonce),
        })
        return { type: "NEP413", signatureData, signedData }
      }

      case ChainType.Solana: {
        if (solanaWallet.signMessage == null) {
          throw new Error("Solana wallet does not support signMessage")
        }

        const signatureData = await solanaWallet.signMessage(
          walletMessage.SOLANA.message
        )

        return {
          type: "SOLANA",
          signatureData,
          signedData: walletMessage.SOLANA,
        }
      }

      case undefined:
        throw new Error("User not signed in")

      default:
        chainType satisfies never
        throw new Error(`Unsupported sign in type: ${chainType}`)
    }
  }
}
