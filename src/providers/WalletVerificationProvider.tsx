"use client"

import { WalletBannedDialog } from "@src/components/WalletBannedDialog"
import { WalletVerificationDialog } from "@src/components/WalletVerificationDialog"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { walletVerificationMachine } from "@src/machines/walletVerificationMachine"
import { useBypassedWalletsStore } from "@src/stores/useBypassedWalletsStore"
import { useSkippedVerificationStore } from "@src/stores/useSkippedVerificationStore"
import { useVerifiedWalletsStore } from "@src/stores/useVerifiedWalletsStore"
import {
  verifyWalletSignature,
  walletVerificationMessageFactory,
} from "@src/utils/walletMessage"
import { useQuery } from "@tanstack/react-query"
import { useActor } from "@xstate/react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { fromPromise } from "xstate"
import { useMixpanel } from "./MixpanelProvider"

// Check if running on a Vercel preview deployment
function isPreviewEnvironment(): boolean {
  if (typeof window === "undefined") return false
  const hostname = window.location.hostname
  // Vercel preview URLs end with .vercel.app but aren't the production domain
  return hostname.endsWith(".vercel.app") && !hostname.startsWith("app.")
}

export function WalletVerificationProvider() {
  const { state, signOut } = useConnectWallet()
  const mixPanel = useMixpanel()
  const router = useRouter()
  const pathname = usePathname()

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

  const { addWalletAddress } = useVerifiedWalletsStore()
  const { addBypassedWalletAddress, isWalletBypassed } =
    useBypassedWalletsStore()
  const { addSkippedWalletAddress, isVerificationSkipped } =
    useSkippedVerificationStore()

  const isPreview = isPreviewEnvironment()
  const shouldAutoSkipOnPreview =
    isPreview &&
    state.address != null &&
    !state.isVerified &&
    !isVerificationSkipped(state.address)

  useEffect(() => {
    if (shouldAutoSkipOnPreview && state.address != null) {
      addSkippedWalletAddress(state.address)
    }
  }, [shouldAutoSkipOnPreview, state.address, addSkippedWalletAddress])

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

  if (shouldAutoSkipOnPreview) {
    return null
  }

  if (
    state.address != null &&
    (safetyCheck.data?.safetyStatus === "safe" ||
      isWalletBypassed(state.address)) &&
    !state.isVerified &&
    !isVerificationSkipped(state.address)
  ) {
    return (
      <WalletVerificationUI
        onConfirm={() => {
          if (state.address != null) {
            addWalletAddress(state.address)
          }
        }}
        onAbort={() => {
          if (state.chainType != null) {
            void signOut({ id: state.chainType })
          }
        }}
        onSkip={() => {
          if (state.address != null) {
            addSkippedWalletAddress(state.address)
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
  onConfirm,
  onAbort,
  onSkip,
}: { onConfirm: () => void; onAbort: () => void; onSkip: () => void }) {
  const { state: unconfirmedWallet } = useConnectWallet()

  const signMessage = useWalletAgnosticSignMessage()
  const mixPanel = useMixpanel()

  const [state, send, serviceRef] = useActor(
    walletVerificationMachine.provide({
      actors: {
        verifyWallet: fromPromise(async () => {
          if (
            unconfirmedWallet.address == null ||
            unconfirmedWallet.chainType == null
          ) {
            return false
          }

          // Add timeout to prevent hanging indefinitely
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(
              () =>
                reject(new Error("Verification timed out. Please try again.")),
              30000
            )
          })

          const walletSignature = await Promise.race([
            signMessage(
              walletVerificationMessageFactory(
                unconfirmedWallet.address,
                unconfirmedWallet.chainType
              )
            ),
            timeoutPromise,
          ])

          return verifyWalletSignature(
            walletSignature,
            unconfirmedWallet.address,
            unconfirmedWallet.chainType
          )
        }),
      },
    })
  )

  const onConfirmRef = useRef(onConfirm)
  onConfirmRef.current = onConfirm
  const onAbortRef = useRef(onAbort)
  onAbortRef.current = onAbort
  const onSkipRef = useRef(onSkip)
  onSkipRef.current = onSkip

  useEffect(
    () =>
      serviceRef.subscribe((snapshot) => {
        if (snapshot.matches("verified")) {
          onConfirmRef.current()
          mixPanel?.track("wallet_verified", {
            wallet: unconfirmedWallet.address,
            wallet_type: unconfirmedWallet.chainType,
          })
        }
        if (snapshot.matches("aborted")) {
          onAbortRef.current()
        }
        // Auto-skip verification when it fails (timeout or error)
        // This prevents the dialog from blocking the page indefinitely
        if (snapshot.matches("idle") && snapshot.context.hadError) {
          onSkipRef.current()
          mixPanel?.track("wallet_verification_auto_skipped", {
            wallet: unconfirmedWallet.address,
            wallet_type: unconfirmedWallet.chainType,
          })
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
      onSkip={() => {
        onSkipRef.current()
      }}
      isVerifying={state.matches("verifying")}
      isFailure={state.context.hadError}
    />
  )
}
