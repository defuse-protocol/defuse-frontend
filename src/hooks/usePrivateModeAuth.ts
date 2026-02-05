"use client"

import {
  IntentsSDK,
  VersionedNonceBuilder,
  createIntentSignerNEP413,
  createIntentSignerViem,
} from "@defuse-protocol/intents-sdk"
import {
  authenticatePrivateIntents,
  isPrivateIntentsAuthenticated,
  logoutPrivateIntents,
} from "@src/components/DefuseSDK/features/machines/privateIntents"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import { useNearWallet } from "@src/providers/NearWalletProvider"
import { usePrivateModeStore } from "@src/stores/usePrivateModeStore"
import { useCallback, useEffect, useRef, useState } from "react"
import { useWalletClient } from "wagmi"

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

export function usePrivateModeAuth() {
  const { state } = useConnectWallet()
  const { data: walletClient } = useWalletClient()
  const nearWallet = useNearWallet()

  const { isPrivateModeEnabled, setPrivateModeEnabled } = usePrivateModeStore()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const isConnected = state.address != null

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
    if (!state.address || !state.chainType) {
      setAuthError("Please connect your wallet first")
      return false
    }

    setIsAuthenticating(true)
    setAuthError(null)

    try {
      const now = Date.now()
      const deadline = new Date(now + 5 * 60 * 1000)

      // Create signer based on wallet type
      let signer:
        | ReturnType<typeof createIntentSignerViem>
        | ReturnType<typeof createIntentSignerNEP413>

      if (state.chainType === ChainType.EVM && walletClient?.account) {
        signer = createIntentSignerViem({
          signer: {
            address: walletClient.account.address,
            signMessage: async ({ message }) => {
              return walletClient.signMessage({ message })
            },
          },
        })
      } else if (state.chainType === ChainType.Near && nearWallet.accountId) {
        signer = createIntentSignerNEP413({
          signMessage: async (nep413Payload) => {
            const result = await nearWallet.signMessage({
              message: nep413Payload.message,
              recipient: nep413Payload.recipient,
              nonce: Buffer.from(nep413Payload.nonce),
            })
            return {
              publicKey: result.signatureData.publicKey.toString(),
              signature: Buffer.from(result.signatureData.signature).toString(
                "base64"
              ),
            }
          },
          accountId: nearWallet.accountId,
        })
      } else {
        setAuthError(
          `Unsupported chain type: ${state.chainType}. Only EVM and NEAR are supported.`
        )
        setIsAuthenticating(false)
        return false
      }

      // Build and sign empty intent for authentication
      const { signed: authIntent } = await privateSDK
        .intentBuilder()
        .setDeadline(deadline)
        .setNonceRandomBytes(
          VersionedNonceBuilder.createTimestampedNonceBytes(new Date(now))
        )
        .buildAndSign(signer)

      // Authenticate with the signed data (sets HTTP-only cookie on server)
      const authResult = await authenticatePrivateIntents({
        signedData: authIntent as unknown as Record<string, unknown>,
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
      // User rejected the signature
      if (message.includes("rejected") || message.includes("denied")) {
        setAuthError(null) // Don't show error for user rejection
      } else {
        setAuthError(message)
      }
      setIsAuthenticating(false)
      return false
    }
  }, [
    state.address,
    state.chainType,
    walletClient,
    nearWallet,
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
