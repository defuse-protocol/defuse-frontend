"use client"

import type { walletMessage } from "@defuse-protocol/internal-utils"
import { base64 } from "@scure/base"
import {
  generateAuthTokenFromWalletSignature,
  setActiveWalletToken,
} from "@src/actions/auth"
import { WalletBannedDialog } from "@src/components/WalletBannedDialog"
import { WalletVerificationDialog } from "@src/components/WalletVerificationDialog"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import {
  type VerificationResult,
  walletVerificationMachine,
} from "@src/machines/walletVerificationMachine"
import { useBypassedWalletsStore } from "@src/stores/useBypassedWalletsStore"
import { useWalletTokensStore } from "@src/stores/useWalletTokensStore"
import { logger } from "@src/utils/logger"
import { walletVerificationMessageFactory } from "@src/utils/walletMessage"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useActor } from "@xstate/react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { fromPromise } from "xstate"
import { useMixpanel } from "./MixpanelProvider"

export function WalletVerificationProvider() {
  const { state, signOut } = useConnectWallet()
  const mixPanel = useMixpanel()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const bannedAccountCheck = useQuery({
    queryKey: ["banned_account", state.address, state.chainType],
    queryFn: async () => {
      if (!state.address || !state.chainType) {
        return { isBanned: false }
      }
      const response = await fetch(
        `/api/account/validate-banned?address=${encodeURIComponent(state.address)}&chainType=${encodeURIComponent(state.chainType)}`
      )
      if (!response.ok) {
        throw new Error("Failed to validate banned account")
      }
      return response.json() as Promise<{
        isBanned: boolean
        accountId: string | null
      }>
    },
    enabled: state.address != null && state.chainType != null,
  })

  const safetyCheck = useQuery({
    queryKey: ["address_safety", state.address],
    queryFn: async () => {
      if (state.chainType === "evm") {
        const response = await fetch(`/api/addresses/${state.address}/safety`)
        if (!response.ok) {
          throw new Error("Failed to check safety status")
        }
        return response.json() as Promise<{ safetyStatus: "safe" | "unsafe" }>
      }
      // For non-EVM wallets, skip the safety API check
      return { safetyStatus: "safe" }
    },
    enabled: state.address != null && state.chainType !== undefined,
    staleTime: 1000 * 60 * 60, // 1 hour,
  })

  const { addBypassedWalletAddress, isWalletBypassed } =
    useBypassedWalletsStore()
  const { setToken } = useWalletTokensStore()
  const hasHydrated = useWalletTokensStore((store) => store._hasHydrated)
  const hasValidToken = useWalletTokensStore((store) =>
    state.address != null ? store.isTokenValid(state.address) : false
  )

  if (bannedAccountCheck.data?.isBanned && pathname !== "/account") {
    router.push("/wallet/banned")
    return null
  }

  if (safetyCheck.isLoading) {
    return null
  }

  // Wait for token store to hydrate before showing verification dialog
  if (!hasHydrated) {
    return null
  }

  if (
    state.address != null &&
    safetyCheck.data?.safetyStatus === "unsafe" &&
    !isWalletBypassed(state.address)
  ) {
    return (
      <WalletBannedUI
        onAbort={() => {
          if (state.chainType != null) {
            void signOut({ id: state.chainType })
          }
        }}
        onBypass={() => {
          if (state.address != null) {
            addBypassedWalletAddress(state.address)
            mixPanel?.track("wallet_bypassed", {
              wallet: state.address,
              wallet_type: state.chainType,
            })
          }
        }}
      />
    )
  }

  if (
    state.address != null &&
    (safetyCheck.data?.safetyStatus === "safe" ||
      isWalletBypassed(state.address)) &&
    !hasValidToken
  ) {
    return (
      <WalletVerificationUI
        isSessionExpired={state.isSessionExpired}
        onVerified={(token: string, expiresAt: number) => {
          if (state.address != null) {
            setToken(state.address, token, expiresAt)
            ;(async () => {
              try {
                await setActiveWalletToken(token)
              } catch (error) {
                logger.error("Failed to set active wallet token:", { error })
              }

              await queryClient.invalidateQueries({
                queryKey: [
                  "token_validation",
                  state.address,
                  state.chainType,
                  token,
                ],
              })
            })()
          }
        }}
        onAbort={() => {
          if (state.chainType != null) {
            void signOut({ id: state.chainType })
          }
        }}
      />
    )
  }

  return null
}

function WalletBannedUI({
  onAbort,
  onBypass,
}: { onAbort: () => void; onBypass: () => void }) {
  return (
    <WalletBannedDialog open={true} onCancel={onAbort} onBypass={onBypass} />
  )
}

function WalletVerificationUI({
  isSessionExpired,
  onVerified,
  onAbort,
}: {
  isSessionExpired: boolean
  onVerified: (token: string, expiresAt: number) => void
  onAbort: () => void
}) {
  const { state: unconfirmedWallet } = useConnectWallet()

  const signMessage = useWalletAgnosticSignMessage()
  const mixPanel = useMixpanel()

  const [state, send, serviceRef] = useActor(
    walletVerificationMachine.provide({
      actors: {
        verifyWallet: fromPromise(async (): Promise<VerificationResult> => {
          if (
            unconfirmedWallet.address == null ||
            unconfirmedWallet.chainType == null
          ) {
            return { success: false }
          }

          const walletSignature = await signMessage(
            walletVerificationMessageFactory(
              unconfirmedWallet.address,
              unconfirmedWallet.chainType
            )
          )

          // Serialize signature for Server Action (WebAuthn requires special handling)
          const serializedSignature =
            serializeSignatureForServerAction(walletSignature)

          const result = await generateAuthTokenFromWalletSignature({
            signature: serializedSignature,
            address: unconfirmedWallet.address,
            authMethod: unconfirmedWallet.chainType,
          })

          if (result.success && result.token && result.expiresAt) {
            return {
              success: true,
              token: result.token,
              expiresAt: result.expiresAt,
            }
          }

          return { success: false }
        }),
      },
    })
  )

  const onVerifiedRef = useRef(onVerified)
  onVerifiedRef.current = onVerified
  const onAbortRef = useRef(onAbort)
  onAbortRef.current = onAbort

  useEffect(
    () =>
      serviceRef.subscribe((machineState) => {
        if (machineState.matches("verified")) {
          const result = machineState.context.verificationResult
          if (result?.token && result?.expiresAt) {
            onVerifiedRef.current(result.token, result.expiresAt)
          }
          mixPanel?.track("wallet_verified", {
            wallet: unconfirmedWallet.address,
            wallet_type: unconfirmedWallet.chainType,
          })
        }
        if (machineState.matches("aborted")) {
          onAbortRef.current()
        }
      }).unsubscribe,
    [
      serviceRef,
      mixPanel,
      unconfirmedWallet.address,
      unconfirmedWallet.chainType,
    ]
  )

  return (
    <WalletVerificationDialog
      open={true}
      onConfirm={() => {
        send({ type: "START" })
      }}
      onCancel={() => {
        send({ type: "ABORT" })
      }}
      isVerifying={state.matches("verifying")}
      isFailure={state.context.hadError}
      isSessionExpired={isSessionExpired}
    />
  )
}

/**
 * Serializes wallet signature for Server Action compatibility.
 * Several signature types contain Uint8Array/ArrayBuffer that can't cross
 * the client-server boundary, so they must be converted to base64 strings.
 */
function serializeSignatureForServerAction(
  signature: walletMessage.WalletSignatureResult
): walletMessage.WalletSignatureResult {
  switch (signature.type) {
    case "WEBAUTHN": {
      const rawSignatureData = signature.signatureData
      return {
        type: "WEBAUTHN",
        signatureData: {
          clientDataJSON: bufferToBase64(rawSignatureData.clientDataJSON),
          authenticatorData: bufferToBase64(rawSignatureData.authenticatorData),
          signature: bufferToBase64(rawSignatureData.signature),
          userHandle: rawSignatureData.userHandle
            ? bufferToBase64(rawSignatureData.userHandle)
            : null,
        } as unknown as AuthenticatorAssertionResponse,
        signedData: {
          challenge: bufferToBase64(
            signature.signedData.challenge
          ) as unknown as Uint8Array,
          payload: signature.signedData.payload,
          parsedPayload: signature.signedData.parsedPayload,
        },
      }
    }

    case "NEP413": {
      return {
        type: "NEP413",
        signatureData: signature.signatureData,
        signedData: {
          message: signature.signedData.message,
          recipient: signature.signedData.recipient,
          nonce: bufferToBase64(
            signature.signedData.nonce
          ) as unknown as Uint8Array,
          callbackUrl: signature.signedData.callbackUrl,
        },
      }
    }

    case "SOLANA": {
      return {
        type: "SOLANA",
        signatureData: bufferToBase64(
          signature.signatureData
        ) as unknown as Uint8Array,
        signedData: {
          message: bufferToBase64(
            signature.signedData.message
          ) as unknown as Uint8Array,
        },
      }
    }

    case "STELLAR_SEP53": {
      return {
        type: "STELLAR_SEP53",
        signatureData: bufferToBase64(
          signature.signatureData
        ) as unknown as Uint8Array,
        signedData: signature.signedData,
      }
    }

    // ERC191, TON_CONNECT, TRON have no Uint8Array fields
    default:
      return signature
  }
}

/**
 * Converts an ArrayBuffer or Uint8Array to a base64 string.
 */
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  return base64.encode(bytes)
}
