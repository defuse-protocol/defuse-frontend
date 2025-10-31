"use client"

import { useQuery } from "@tanstack/react-query"
import { useActor } from "@xstate/react"
import { useEffect, useRef } from "react"
import { fromPromise } from "xstate"

import { config, utils } from "@defuse-protocol/internal-utils"
import { nearClient } from "@src/components/DefuseSDK/constants/nearClient"
import { WalletBannedDialog } from "@src/components/WalletBannedDialog"
import { WalletVerificationDialog } from "@src/components/WalletVerificationDialog"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { walletVerificationMachine } from "@src/machines/walletVerificationMachine"
import { useBypassedWalletsStore } from "@src/stores/useBypassedWalletsStore"
import { useVerifiedWalletsStore } from "@src/stores/useVerifiedWalletsStore"
import {
  verifyWalletSignature,
  walletVerificationMessageFactory,
} from "@src/utils/walletMessage"
import type { providers } from "near-api-js"
import * as v from "valibot"
import { useMixpanel } from "./MixpanelProvider"

export function WalletVerificationProvider() {
  const { state, signOut } = useConnectWallet()
  const mixPanel = useMixpanel()

  const safetyCheck = useQuery({
    queryKey: ["address_safety", state.address],
    queryFn: async () => {
      const response = await fetch(`/api/addresses/${state.address}/safety`)
      return response.json() as Promise<{ safetyStatus: "safe" | "unsafe" }>
    },
    enabled: state.address != null,
  })

  const predecessorIdCheck = useQuery({
    queryKey: ["predecessor_id_check", state.address],
    queryFn: async () => {
      if (state.chainType === "evm" && state.address != null) {
        return await isPredecessorIdEnabled({
          nearClient: nearClient,
          accountId: state.address,
        })
      }
      return true
    },
    enabled: state.address != null && state.chainType !== undefined,
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  const isWalletSafe =
    safetyCheck.data?.safetyStatus === "safe" &&
    predecessorIdCheck.data === true

  const { addWalletAddress } = useVerifiedWalletsStore()
  const { addBypassedWalletAddress, isWalletBypassed } =
    useBypassedWalletsStore()

  if (safetyCheck.isLoading || predecessorIdCheck.isLoading) {
    return null
  }

  if (
    state.address != null &&
    !isWalletBypassed(state.address) &&
    !isWalletSafe
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

async function isPredecessorIdEnabled({
  nearClient,
  accountId,
}: {
  nearClient: providers.Provider
  accountId: string
}) {
  const normalizedAccountId = accountId.toLowerCase()
  const data = await utils.queryContract({
    nearClient,
    contractId: config.env.contractID,
    methodName: "is_auth_by_predecessor_id_enabled",
    args: {
      account_id: normalizedAccountId,
    },
    schema: v.boolean(),
  })
  return data
}
