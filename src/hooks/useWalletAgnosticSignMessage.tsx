import { useWallet as useWalletSolana } from "@solana/wallet-adapter-react"
import { useTonConnectUI } from "@tonconnect/ui-react"
import { useSignMessage } from "wagmi"

import { useWebAuthnActions } from "@src/features/webauthn/hooks/useWebAuthnStore"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import { useNearWalletActions } from "@src/hooks/useNearWalletActions"
import type {
  WalletMessage,
  WalletSignatureResult,
} from "@src/types/walletMessages"
import {
  createHotWalletCloseObserver,
  raceFirst,
} from "@src/utils/hotWalletIframe"

export function useWalletAgnosticSignMessage() {
  const { state } = useConnectWallet()
  const { signMessage: signMessageNear } = useNearWalletActions()
  const { signMessageAsync: signMessageAsyncWagmi } = useSignMessage()
  const solanaWallet = useWalletSolana()
  const { signMessage: signMessageWebAuthn } = useWebAuthnActions()
  const [tonConnectUi] = useTonConnectUI()

  return async <T,>(
    walletMessage: WalletMessage<T>
  ): Promise<WalletSignatureResult<T>> => {
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
        const { signatureData, signedData } = await raceFirst(
          signMessageNear({
            ...walletMessage.NEP413,
            nonce: Buffer.from(walletMessage.NEP413.nonce),
          }),
          createHotWalletCloseObserver()
        )
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

      case ChainType.WebAuthn: {
        const signatureData = await signMessageWebAuthn(
          walletMessage.WEBAUTHN.challenge
        )
        return {
          type: "WEBAUTHN",
          signatureData,
          signedData: walletMessage.WEBAUTHN,
        }
      }

      case ChainType.Ton: {
        const signatureData = await tonConnectUi.signData(
          walletMessage.TON_CONNECT.message
        )
        return {
          type: "TON_CONNECT",
          signatureData,
          signedData: walletMessage.TON_CONNECT,
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
