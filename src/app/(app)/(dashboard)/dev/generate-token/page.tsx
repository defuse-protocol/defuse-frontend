"use client"

import Button from "@src/components/Button"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useState } from "react"
import { generateToken } from "./actions"

export const AUTH_TOKEN_KEY = "defuse_auth_token"

/**
 * Test-only page for generating JWT authentication tokens.
 * This is a temporary development tool and should be removed before production.
 * Uses server action from ./actions.ts to generate tokens.
 */
export default function GenerateTokenPage() {
  const { state } = useConnectWallet()
  const [isGenerating, setIsGenerating] = useState(false)
  const [status, setStatus] = useState<string>("")

  const handleGenerateToken = async () => {
    if (!state.address || !state.chainType) return

    setIsGenerating(true)
    setStatus("")
    try {
      await generateToken(state.address, state.chainType)
      setStatus("Token generated and saved to cookies!")
      setIsGenerating(false)
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Failed to generate token. Please try again."
      )
      setIsGenerating(false)
    }
  }

  const isConnected = state.address != null && state.chainType != null

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Generate Test Auth Token</h1>
      <p className="text-gray-600 mb-6">
        Connect your wallet and generate a JWT token for testing authentication.
      </p>
      <div className="mb-6">
        {!isConnected ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900 mb-1">
              Wallet not connected
            </p>
            <p className="text-sm text-gray-600">
              Please connect your wallet using the wallet button in the navbar
              to generate a test authentication token.
            </p>
          </div>
        ) : (
          <Button
            onClick={handleGenerateToken}
            disabled={isGenerating}
            size="md"
          >
            {isGenerating ? "Generating..." : "Generate Token"}
          </Button>
        )}
      </div>
      {status && (
        <div
          className={`rounded-lg p-4 border ${
            status.includes("Token generated")
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <p>{status}</p>
        </div>
      )}
    </div>
  )
}
