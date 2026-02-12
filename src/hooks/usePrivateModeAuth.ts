"use client"

import {
  type IntentPayload,
  IntentsSDK,
  VersionedNonceBuilder,
} from "@defuse-protocol/intents-sdk"
import {
  type AuthMethod,
  authIdentity,
  messageFactory,
  prepareBroadcastRequest,
  type walletMessage as walletMessageTypes,
} from "@defuse-protocol/internal-utils"
import { base64 } from "@scure/base"
import {
  authenticatePrivateIntents,
  isPrivateIntentsAuthenticated,
  logoutPrivateIntents,
} from "@src/components/DefuseSDK/features/machines/privateIntents"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { usePrivateModeStore } from "@src/stores/usePrivateModeStore"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

// Private intents SDK configuration
const PRIVATE_INTENTS_ENV = {
  contractID: "privintents.test.near",
  contractSalt: "2caa9986",
  poaTokenFactoryContractID: "",
  poaBridgeBaseURL: "",
  solverRelayBaseURL: "",
  managerConsoleBaseURL: "",
  nearIntentsBaseURL: "",
}

const privateSDK = new IntentsSDK({
  referral: "private-mode",
  env: PRIVATE_INTENTS_ENV,
})

const CHAIN_TYPE_TO_AUTH_METHOD: Record<ChainType, AuthMethod> = {
  [ChainType.EVM]: "evm",
  [ChainType.Near]: "near",
  [ChainType.Solana]: "solana",
  [ChainType.WebAuthn]: "webauthn",
  [ChainType.Ton]: "ton",
  [ChainType.Stellar]: "stellar",
  [ChainType.Tron]: "tron",
}

/**
 * Convert IntentPayload from the SDK into a WalletMessage signable by any wallet.
 * Replicates the logic of messageFactory.makeSwapMessage but uses the intent's
 * own verifying_contract instead of the global config.
 */
function intentPayloadToWalletMessage(
  intent: IntentPayload
): walletMessageTypes.WalletMessage {
  const innerMessage = {
    deadline: intent.deadline,
    intents: intent.intents,
    signer_id: intent.signer_id ?? "",
  }

  const signerId = intent.signer_id ?? ""
  const payload = {
    signer_id: signerId,
    verifying_contract: intent.verifying_contract,
    deadline: intent.deadline,
    nonce: intent.nonce,
    intents: intent.intents,
  }

  const payloadSerialized = JSON.stringify(payload)
  const payloadBytes = new TextEncoder().encode(payloadSerialized)
  const nonceBytes = base64.decode(intent.nonce)

  return {
    NEP413: {
      message: JSON.stringify(innerMessage),
      recipient: intent.verifying_contract,
      nonce: nonceBytes,
    },
    ERC191: { message: JSON.stringify(payload, null, 2) },
    SOLANA: { message: payloadBytes },
    STELLAR: { message: JSON.stringify(payload, null, 2) },
    WEBAUTHN: {
      challenge: messageFactory.makeChallenge(payloadBytes),
      payload: payloadSerialized,
      parsedPayload: payload,
    },
    TON_CONNECT: {
      message: { type: "text", text: JSON.stringify(payload, null, 2) },
    },
    TRON: { message: JSON.stringify(payload, null, 2) },
  }
}

export function usePrivateModeAuth() {
  const { state } = useConnectWallet()
  const signMessage = useWalletAgnosticSignMessage()

  const { isPrivateModeEnabled, setPrivateModeEnabled } = usePrivateModeStore()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const isConnected = state.address != null
  const authMethod = state.chainType
    ? CHAIN_TYPE_TO_AUTH_METHOD[state.chainType]
    : null

  const intentsUserId = useMemo(
    () =>
      state.address && authMethod
        ? authIdentity.authHandleToIntentsUserId(state.address, authMethod)
        : null,
    [state.address, authMethod]
  )

  // Check auth status on mount and sync with store
  useEffect(() => {
    async function syncAuthStatus() {
      const isAuthenticated = await isPrivateIntentsAuthenticated()
      // If store says enabled but we're not authenticated, disable it
      if (isPrivateModeEnabled && !isAuthenticated) {
        setPrivateModeEnabled(false)
      }
    }
    syncAuthStatus()
  }, [isPrivateModeEnabled, setPrivateModeEnabled])

  // Track previous address to detect wallet changes
  const prevAddressRef = useRef<string | undefined>(state.address)

  // Clear private mode when wallet is disconnected or address changes
  useEffect(() => {
    const addressChanged =
      prevAddressRef.current != null &&
      state.address != null &&
      prevAddressRef.current !== state.address

    // Wallet disconnected or switched to different account
    if ((!isConnected || addressChanged) && isPrivateModeEnabled) {
      void logoutPrivateIntents()
      setPrivateModeEnabled(false)
    }

    prevAddressRef.current = state.address
  }, [isConnected, state.address, isPrivateModeEnabled, setPrivateModeEnabled])

  // Authenticate to enable private mode
  const enablePrivateMode = useCallback(async () => {
    if (!state.address || !state.chainType || !authMethod || !intentsUserId) {
      setAuthError("Please connect your wallet first")
      return false
    }

    setIsAuthenticating(true)
    setAuthError(null)

    try {
      const now = Date.now()
      const deadline = new Date(now + 5 * 60 * 1000)

      // Build intent payload via private SDK (correct verifying_contract + nonce)
      const intentPayload = await privateSDK
        .intentBuilder()
        .setSigner(intentsUserId)
        .setDeadline(deadline)
        .setNonceRandomBytes(
          VersionedNonceBuilder.createTimestampedNonceBytes(new Date(now))
        )
        .build()

      // Convert to WalletMessage signable by any wallet type
      const walletMessage = intentPayloadToWalletMessage(intentPayload)

      // Sign with wallet-agnostic signer (EVM, NEAR, Solana, Ton, etc.)
      const signatureResult = await signMessage(walletMessage)

      // Convert to MultiPayload format expected by the auth server
      const signedData = prepareBroadcastRequest.prepareSwapSignedData(
        signatureResult,
        { userAddress: state.address, userChainType: authMethod }
      )

      // Authenticate with the signed data (sets HTTP-only cookie on server)
      const authResult = await authenticatePrivateIntents({
        signedData,
      })

      if ("err" in authResult) {
        setAuthError(authResult.err)
        setIsAuthenticating(false)
        return false
      }

      setPrivateModeEnabled(true)
      setIsAuthenticating(false)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      // User rejected or cancelled the signature
      if (
        message.includes("rejected") ||
        message.includes("denied") ||
        message.includes("cancelled")
      ) {
        setAuthError(null)
      } else {
        setAuthError(message)
      }
      setIsAuthenticating(false)
      return false
    }
  }, [
    state.address,
    state.chainType,
    authMethod,
    intentsUserId,
    signMessage,
    setPrivateModeEnabled,
  ])

  // Disable private mode (logout)
  const disablePrivateMode = useCallback(async () => {
    await logoutPrivateIntents()
    setPrivateModeEnabled(false)
    setAuthError(null)
  }, [setPrivateModeEnabled])

  // Toggle private mode
  const togglePrivateMode = useCallback(async () => {
    if (isPrivateModeEnabled) {
      await disablePrivateMode()
    } else {
      await enablePrivateMode()
    }
  }, [isPrivateModeEnabled, enablePrivateMode, disablePrivateMode])

  return {
    isPrivateModeEnabled,
    isAuthenticating,
    authError,
    isConnected,
    enablePrivateMode,
    disablePrivateMode,
    togglePrivateMode,
  }
}
