"use client"

import { WalletBannedDialog } from "@src/components/WalletBannedDialog"
import { WalletVerificationDialog } from "@src/components/WalletVerificationDialog"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { walletVerificationMachine } from "@src/machines/walletVerificationMachine"
import { useBypassedWalletsStore } from "@src/stores/useBypassedWalletsStore"
import { useVerifiedWalletsStore } from "@src/stores/useVerifiedWalletsStore"
import { getStoredToken, storeAppAuthToken, verifyJWT } from "@src/utils/jwt"
import {
  verifyWalletSignature,
  walletVerificationMessageFactory,
} from "@src/utils/walletMessage"
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

  const tokenValidityCheck = useQuery({
    queryKey: ["token_validity", state.address, state.chainType],
    queryFn: async () => {
      const storedToken = getStoredToken()
      if (!storedToken) {
        return { isValid: false }
      }

      const payload = await verifyJWT(storedToken)
      if (!payload) {
        return { isValid: false }
      }

      const matchesWallet =
        payload.auth_identifier === state.address &&
        payload.auth_method === state.chainType

      return { isValid: matchesWallet }
    },
    enabled:
      state.address != null &&
      state.chainType !== undefined &&
      state.isVerified,
    staleTime: 1000 * 60, // 1 minute
  })

  const isTokenValid = tokenValidityCheck.data?.isValid ?? false

  const generateToken = useQuery({
    queryKey: [
      "generate_token",
      state.address,
      state.chainType,
      state.isVerified,
      isTokenValid,
    ],
    queryFn: async () => {
      const response = await fetch("/api/auth/token", {
        method: "POST",
        body: JSON.stringify({
          authIdentifier: state.address,
          authMethod: state.chainType,
        }),
      })
      if (!response.ok) {
        throw new Error("Failed to generate token")
      }
      const data = (await response.json()) as { token: string }

      if (data.token) {
        storeAppAuthToken(data.token)
        queryClient.invalidateQueries({
          queryKey: ["token_validity", state.address, state.chainType],
        })
      }

      return data
    },
    enabled:
      state.address != null &&
      state.chainType !== undefined &&
      state.isVerified &&
      !isTokenValid &&
      !tokenValidityCheck.isLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes,
  })

  void generateToken

  const { addWalletAddress } = useVerifiedWalletsStore()
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
    !state.isVerified
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
}: { onConfirm: () => void; onAbort: () => void }) {
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

          const walletSignature = await signMessage(
            walletVerificationMessageFactory(
              unconfirmedWallet.address,
              unconfirmedWallet.chainType
            )
          )

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

  useEffect(
    () =>
      serviceRef.subscribe((state) => {
        if (state.matches("verified")) {
          onConfirmRef.current()
          mixPanel?.track("wallet_verified", {
            wallet: unconfirmedWallet.address,
            wallet_type: unconfirmedWallet.chainType,
          })
        }
        if (state.matches("aborted")) {
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
    />
  )
}
