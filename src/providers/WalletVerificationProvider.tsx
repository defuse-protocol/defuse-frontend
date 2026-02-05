"use client"

import { generateAuthTokenFromWalletSignature } from "@src/actions/auth"
import { formatSignedIntent } from "@src/components/DefuseSDK/core/formatters"
import { WalletBannedDialog } from "@src/components/WalletBannedDialog"
import { WalletVerificationDialog } from "@src/components/WalletVerificationDialog"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import {
  type VerificationResult,
  walletVerificationMachine,
} from "@src/machines/walletVerificationMachine"
import { useBypassedWalletsStore } from "@src/stores/useBypassedWalletsStore"
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

  if (bannedAccountCheck.data?.isBanned && pathname !== "/account") {
    router.push("/wallet/banned")
    return null
  }

  if (safetyCheck.isLoading) {
    return null
  }

  if (
    state.address != null &&
    safetyCheck.data?.safetyStatus === "unsafe" &&
    !isWalletBypassed(state.address)
  ) {
    return (
      <WalletBannedDialog
        open={true}
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

  // Don't show verification dialog while auth validation is in progress
  if (state.isAuthValidating) {
    return null
  }

  if (
    state.address != null &&
    (safetyCheck.data?.safetyStatus === "safe" ||
      isWalletBypassed(state.address)) &&
    !state.isAuthorized
  ) {
    return (
      <WalletVerificationUI
        isSessionExpired={state.isSessionExpired}
        onVerified={() => {
          const walletAddress = state.address
          if (walletAddress != null) {
            void queryClient.invalidateQueries({
              queryKey: ["token_validation", walletAddress, state.chainType],
            })
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

function WalletVerificationUI({
  isSessionExpired,
  onVerified,
  onAbort,
}: {
  isSessionExpired: boolean
  /** Called when verification succeeds; JWT is already set in httpOnly cookie by server */
  onVerified: () => void
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

          // Format the signature into MultiPayload format (JSON-safe)
          // This is verified server-side via NEAR RPC simulate_intents
          const signedIntent = formatSignedIntent(walletSignature, {
            credential: unconfirmedWallet.address,
            credentialType: unconfirmedWallet.chainType,
          })

          const result = await generateAuthTokenFromWalletSignature({
            signedIntent,
            address: unconfirmedWallet.address,
            authMethod: unconfirmedWallet.chainType,
          })

          if (result.success && result.expiresAt) {
            return {
              success: true,
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
          onVerifiedRef.current()
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
