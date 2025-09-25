import type { walletMessage as walletMessage_ } from "@defuse-protocol/internal-utils"
import { useWallet as useWalletSolana } from "@solana/wallet-adapter-react"
import { useWebAuthnActions } from "@src/features/webauthn/hooks/useWebAuthnStore"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import { useNearWallet } from "@src/providers/NearWalletProvider"
import { signMessageStellar } from "@src/providers/StellarWalletProvider"
import { useTronWallet } from "@src/providers/TronWalletProvider"
import {
  createHotWalletCloseObserver,
  raceFirst,
} from "@src/utils/hotWalletIframe"
import { useTonConnectUI } from "@tonconnect/ui-react"
import { useSignMessage } from "wagmi"

export function useWalletAgnosticSignMessage() {
  const { state } = useConnectWallet()
  const { signMessage: signMessageNear } = useNearWallet()
  const { signMessageAsync: signMessageAsyncWagmi } = useSignMessage()
  const solanaWallet = useWalletSolana()
  const { signMessage: signMessageWebAuthn } = useWebAuthnActions()
  const [tonConnectUi] = useTonConnectUI()
  const { signMessage: signMessageTron } = useTronWallet()

  return async (
    walletMessage: walletMessage_.WalletMessage
  ): Promise<walletMessage_.WalletSignatureResult> => {
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

      case ChainType.Stellar: {
        const signatureData = await signMessageStellar(
          walletMessage.STELLAR.message
        )
        return {
          type: "STELLAR_SEP53",
          signatureData,
          signedData: walletMessage.STELLAR,
        }
      }

      case ChainType.Tron: {
        // TODO: Remove this workaround once Tron Ledger app fixes the message signing bug.
        // Tron Ledger incorrectly signs messages >225 bytes causing signature verification issues,
        // so we need to increase message size for unverified wallets to prevent signIn if issue persists.
        if (!state.isVerified) {
          const extendedMessage = {
            ...JSON.parse(walletMessage.TRON.message),
            message_size_validation:
              "Validates message size compatibility with wallet signing requirements.",
          }
          const signatureData = await signMessageTron(
            JSON.stringify(extendedMessage, null, 2)
          )
          return {
            type: "TRON",
            signatureData,
            signedData: { message: JSON.stringify(extendedMessage, null, 2) },
          }
        }
        const signatureData = await signMessageTron(walletMessage.TRON.message)
        return { type: "TRON", signatureData, signedData: walletMessage.TRON }
      }

      case undefined:
        throw new Error("User not signed in")

      default:
        chainType satisfies never
        throw new Error(`Unsupported sign in type: ${chainType}`)
    }
  }
}
