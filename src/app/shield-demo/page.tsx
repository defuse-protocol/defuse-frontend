"use client"

import {
  type AuthMethod,
  authIdentity,
  prepareBroadcastRequest,
} from "@defuse-protocol/internal-utils"
import type {
  GetBalanceResponseDto,
  MultiPayload,
} from "@defuse-protocol/one-click-sdk-typescript"
import { CaretDownIcon } from "@radix-ui/react-icons"
import { Button, Spinner, Tabs } from "@radix-ui/themes"
import { AssetComboIcon } from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { wrapPayloadAsWalletMessage } from "@src/components/DefuseSDK/core/messages"
import {
  generateShieldIntent,
  getPrivateBalance,
  getShieldExecutionStatus,
  getShieldQuote,
  getUnshieldQuote,
  submitShieldIntent,
} from "@src/components/DefuseSDK/features/machines/privateIntents"
import { createDepositedBalanceQueryOptions } from "@src/components/DefuseSDK/queries/balanceQueries"
import type {
  BaseTokenInfo,
  TokenInfo,
} from "@src/components/DefuseSDK/types/base"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { AUTH_METHOD_TO_STANDARD } from "@src/components/DefuseSDK/utils/intentStandards"
import { isBaseToken } from "@src/components/DefuseSDK/utils/token"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useState } from "react"

// Map ChainType to AuthMethod
const CHAIN_TYPE_TO_AUTH_METHOD: Record<ChainType, AuthMethod> = {
  [ChainType.EVM]: "evm",
  [ChainType.Near]: "near",
  [ChainType.Solana]: "solana",
  [ChainType.WebAuthn]: "webauthn",
  [ChainType.Ton]: "ton",
  [ChainType.Stellar]: "stellar",
  [ChainType.Tron]: "tron",
}

type OperationStatus =
  | "idle"
  | "authenticating"
  | "getting-quote"
  | "signing"
  | "submitting"
  | "polling"
  | "success"
  | "error"

type TabValue = "shield" | "unshield"

export default function ShieldDemoPage() {
  const { state } = useConnectWallet()
  const signMessage = useWalletAgnosticSignMessage()

  // Tab state
  const [activeTab, setActiveTab] = useState<TabValue>("shield")

  // Private balance state
  const [privateBalance, setPrivateBalance] =
    useState<GetBalanceResponseDto | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)

  // Token selection state
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null)
  const [amount, setAmount] = useState("")
  const [showTokenList, setShowTokenList] = useState(false)

  // Operation state
  const [operationStatus, setOperationStatus] =
    useState<OperationStatus>("idle")
  const [operationError, setOperationError] = useState<string | null>(null)
  const [lastTxStatus, setLastTxStatus] = useState<string | null>(null)

  const isConnected = state.address != null
  const authMethod = state.chainType
    ? CHAIN_TYPE_TO_AUTH_METHOD[state.chainType]
    : null

  // Get intents user ID
  const intentsUserId = useMemo(
    () =>
      state.address && authMethod
        ? authIdentity.authHandleToIntentsUserId(state.address, authMethod)
        : null,
    [state.address, authMethod]
  )

  // Token list
  const tokenList = useTokenList(LIST_TOKENS, true)

  // Public balance query
  const tokenIds = useMemo(
    () =>
      tokenList
        .filter((t): t is BaseTokenInfo => isBaseToken(t))
        .map((t) => t.defuseAssetId),
    [tokenList]
  )

  const { data: publicBalances } = useQuery({
    ...createDepositedBalanceQueryOptions(
      { userId: intentsUserId, tokenIds },
      isConnected
    ),
  })

  // Tokens with public balance for shield
  const tokensWithPublicBalance = useMemo(() => {
    if (!publicBalances) return []
    return tokenList
      .filter((token): token is BaseTokenInfo => {
        if (!isBaseToken(token)) return false
        const balance = publicBalances[token.defuseAssetId]
        return balance != null && balance > 0n
      })
      .map((token) => ({
        token,
        balance: publicBalances[token.defuseAssetId] ?? 0n,
      }))
      .sort((a, b) => (b.balance > a.balance ? 1 : -1))
  }, [tokenList, publicBalances])

  // Tokens with private balance for unshield
  const tokensWithPrivateBalance = useMemo(() => {
    if (!privateBalance?.balances)
      return [] as { token: BaseTokenInfo; balance: bigint }[]
    const result: { token: BaseTokenInfo; balance: bigint }[] = []
    for (const [tokenId, balance] of Object.entries(privateBalance.balances)) {
      if (BigInt(balance) <= 0n) continue
      const token = tokenList.find(
        (t) => isBaseToken(t) && t.defuseAssetId === tokenId
      )
      if (token && isBaseToken(token)) {
        result.push({ token, balance: BigInt(balance) })
      }
    }
    return result.sort((a, b) => (b.balance > a.balance ? 1 : -1))
  }, [privateBalance, tokenList])

  // Fetch private balance
  const fetchPrivateBalance = useCallback(async () => {
    setBalanceLoading(true)
    try {
      const result = await getPrivateBalance()
      if ("ok" in result) {
        setPrivateBalance(result.ok)
      }
    } finally {
      setBalanceLoading(false)
    }
  }, [])

  // Auto-fetch private balance on mount
  useEffect(() => {
    void fetchPrivateBalance()
  }, [fetchPrivateBalance])

  // Reset selection when tab changes
  const handleTabChange = useCallback((tab: TabValue) => {
    setActiveTab(tab)
    setSelectedToken(null)
    setAmount("")
    setOperationError(null)
    setLastTxStatus(null)
  }, [])

  // Get selected token balance
  const selectedTokenBalance = useMemo(() => {
    if (!selectedToken || !isBaseToken(selectedToken)) return null

    if (activeTab === "shield") {
      return publicBalances?.[selectedToken.defuseAssetId] ?? null
    }
    if (activeTab === "unshield" && privateBalance?.balances) {
      const balance = privateBalance.balances[selectedToken.defuseAssetId]
      return balance != null ? BigInt(balance) : null
    }
    return null
  }, [selectedToken, activeTab, publicBalances, privateBalance])

  // Handle max button
  const handleMax = useCallback(() => {
    if (!selectedToken || !isBaseToken(selectedToken) || !selectedTokenBalance)
      return
    const formatted = formatTokenValue(
      selectedTokenBalance,
      selectedToken.decimals,
      { fractionDigits: selectedToken.decimals }
    )
    setAmount(formatted)
  }, [selectedToken, selectedTokenBalance])

  // Parse amount to smallest units
  const amountInSmallestUnits = useMemo(() => {
    if (!amount || !selectedToken || !isBaseToken(selectedToken)) return null
    try {
      const parts = amount.split(".")
      const intPart = parts[0] ?? "0"
      const decPart = (parts[1] ?? "")
        .padEnd(selectedToken.decimals, "0")
        .slice(0, selectedToken.decimals)
      return BigInt(intPart + decPart)
    } catch {
      return null
    }
  }, [amount, selectedToken])

  // Shield operation
  const handleShield = useCallback(async () => {
    if (
      !state.address ||
      !authMethod ||
      !intentsUserId ||
      !selectedToken ||
      !isBaseToken(selectedToken) ||
      !amountInSmallestUnits
    )
      return

    setOperationStatus("getting-quote")
    setOperationError(null)
    setLastTxStatus(null)

    try {
      const deadline = new Date(Date.now() + 5 * 60 * 1000).toISOString()

      const quoteResult = await getShieldQuote({
        amount: amountInSmallestUnits.toString(),
        asset: selectedToken.defuseAssetId,
        userAddress: state.address,
        authMethod,
        deadline,
        slippageTolerance: 100,
      })

      if ("err" in quoteResult) {
        setOperationError(quoteResult.err)
        setOperationStatus("error")
        return
      }

      const depositAddress = quoteResult.ok.quote.depositAddress
      if (!depositAddress) {
        setOperationError("No deposit address in quote")
        setOperationStatus("error")
        return
      }

      const standard = AUTH_METHOD_TO_STANDARD[authMethod]
      const generateResult = await generateShieldIntent({
        depositAddress,
        signerId: intentsUserId,
        standard,
      })

      if ("err" in generateResult) {
        setOperationError(generateResult.err ?? "Generate intent failed")
        setOperationStatus("error")
        return
      }

      setOperationStatus("signing")
      const walletMessage = wrapPayloadAsWalletMessage(generateResult.ok.intent)
      const signatureResult = await signMessage(walletMessage)

      setOperationStatus("submitting")
      const signedIntent = prepareBroadcastRequest.prepareSwapSignedData(
        signatureResult,
        { userAddress: state.address, userChainType: authMethod }
      ) as MultiPayload

      const submitResult = await submitShieldIntent({ signedIntent })

      if ("err" in submitResult) {
        setOperationError(submitResult.err ?? "Submit intent failed")
        setOperationStatus("error")
        return
      }

      setOperationStatus("polling")
      await pollExecutionStatus(depositAddress)

      setOperationStatus("success")
      setLastTxStatus("Shield completed!")
      setAmount("")
      await fetchPrivateBalance()
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : String(error))
      setOperationStatus("error")
    }
  }, [
    state.address,
    authMethod,
    intentsUserId,
    selectedToken,
    amountInSmallestUnits,
    signMessage,
    fetchPrivateBalance,
  ])

  // Unshield operation
  const handleUnshield = useCallback(async () => {
    if (
      !state.address ||
      !authMethod ||
      !intentsUserId ||
      !selectedToken ||
      !isBaseToken(selectedToken) ||
      !amountInSmallestUnits
    )
      return

    setOperationStatus("getting-quote")
    setOperationError(null)
    setLastTxStatus(null)

    try {
      const deadline = new Date(Date.now() + 5 * 60 * 1000).toISOString()

      const quoteResult = await getUnshieldQuote({
        amount: amountInSmallestUnits.toString(),
        asset: selectedToken.defuseAssetId,
        userAddress: state.address,
        authMethod,
        deadline,
        slippageTolerance: 100,
      })

      if ("err" in quoteResult) {
        setOperationError(quoteResult.err)
        setOperationStatus("error")
        return
      }

      const depositAddress = quoteResult.ok.quote.depositAddress
      if (!depositAddress) {
        setOperationError("No deposit address in quote")
        setOperationStatus("error")
        return
      }

      const standard = AUTH_METHOD_TO_STANDARD[authMethod]
      const generateResult = await generateShieldIntent({
        depositAddress,
        signerId: intentsUserId,
        standard,
      })

      if ("err" in generateResult) {
        setOperationError(generateResult.err ?? "Generate intent failed")
        setOperationStatus("error")
        return
      }

      setOperationStatus("signing")
      const walletMessage = wrapPayloadAsWalletMessage(generateResult.ok.intent)
      const signatureResult = await signMessage(walletMessage)

      setOperationStatus("submitting")
      const signedIntent = prepareBroadcastRequest.prepareSwapSignedData(
        signatureResult,
        { userAddress: state.address, userChainType: authMethod }
      ) as MultiPayload

      const submitResult = await submitShieldIntent({ signedIntent })

      if ("err" in submitResult) {
        setOperationError(submitResult.err ?? "Submit intent failed")
        setOperationStatus("error")
        return
      }

      setOperationStatus("polling")
      await pollExecutionStatus(depositAddress)

      setOperationStatus("success")
      setLastTxStatus("Unshield completed!")
      setAmount("")

      await fetchPrivateBalance()
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : String(error))
      setOperationStatus("error")
    }
  }, [
    state.address,
    authMethod,
    intentsUserId,
    selectedToken,
    amountInSmallestUnits,
    signMessage,
    fetchPrivateBalance,
  ])

  async function pollExecutionStatus(depositAddress: string) {
    let attempts = 0
    const maxAttempts = 120

    while (attempts < maxAttempts) {
      const statusResult = await getShieldExecutionStatus(depositAddress)

      if ("ok" in statusResult && statusResult.ok) {
        const status = statusResult.ok.status
        setLastTxStatus(`Status: ${status}`)

        if (status === "SUCCESS") return
        if (status === "FAILED" || status === "REFUNDED") {
          throw new Error(`Operation failed: ${status}`)
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
      attempts++
    }

    throw new Error("Timeout")
  }

  const isOperating =
    operationStatus !== "idle" &&
    operationStatus !== "success" &&
    operationStatus !== "error"

  const canSubmit =
    selectedToken &&
    amount &&
    amountInSmallestUnits &&
    amountInSmallestUnits > 0n &&
    !isOperating

  // Available tokens based on active tab
  const availableTokens: { token: BaseTokenInfo; balance: bigint }[] =
    activeTab === "shield" ? tokensWithPublicBalance : tokensWithPrivateBalance

  return (
    <Paper>
      <div className="space-y-4 p-1">
        {/* Header */}
        <div className="text-center pt-2">
          <h1 className="text-xl font-bold text-gray-12">Private Balance</h1>
        </div>

        {/* Tabs */}
        <Tabs.Root
          value={activeTab}
          onValueChange={(v) => handleTabChange(v as TabValue)}
        >
          <Tabs.List className="w-full">
            <Tabs.Trigger value="shield" className="flex-1">
              Shield
            </Tabs.Trigger>
            <Tabs.Trigger value="unshield" className="flex-1">
              Unshield
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>

        {/* Not connected */}
        {!isConnected && (
          <div className="rounded-xl bg-gray-3 p-6 text-center">
            <p className="text-gray-11">Connect wallet to continue</p>
          </div>
        )}

        {/* Main content */}
        {isConnected && (
          <div className="space-y-4">
            {/* Token Input Card */}
            <div className="rounded-xl bg-gray-3 p-4 space-y-3">
              <div className="flex justify-between items-center text-sm text-gray-11">
                <span>
                  {activeTab === "shield" ? "From Public" : "From Private"}
                </span>
                {selectedTokenBalance != null &&
                  selectedToken &&
                  isBaseToken(selectedToken) && (
                    <button
                      type="button"
                      onClick={handleMax}
                      className="hover:text-gray-12 transition-colors"
                    >
                      Balance:{" "}
                      {formatTokenValue(
                        selectedTokenBalance,
                        selectedToken.decimals,
                        { fractionDigits: 6 }
                      )}
                    </button>
                  )}
              </div>

              <div className="flex items-center gap-3">
                {/* Amount input */}
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 bg-transparent text-2xl font-medium outline-none min-w-0"
                />

                {/* Token selector */}
                <button
                  type="button"
                  onClick={() => setShowTokenList(!showTokenList)}
                  className="flex items-center gap-2 bg-gray-1 rounded-full px-3 py-2 hover:bg-gray-2 transition-colors"
                >
                  {selectedToken ? (
                    <>
                      <AssetComboIcon
                        icon={selectedToken.icon}
                        name={selectedToken.name}
                        chainName={
                          isBaseToken(selectedToken)
                            ? selectedToken.originChainName
                            : undefined
                        }
                      />
                      <span className="font-medium">
                        {selectedToken.symbol}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-11">Select</span>
                  )}
                  <CaretDownIcon />
                </button>
              </div>

              <div className="text-sm text-gray-10">
                → {activeTab === "shield" ? "To Private" : "To Public"}
              </div>
            </div>

            {/* Token List Dropdown */}
            {showTokenList && (
              <div className="rounded-xl bg-gray-2 border border-gray-6 max-h-64 overflow-y-auto">
                {availableTokens.length === 0 ? (
                  <div className="p-4 text-center text-gray-11 text-sm">
                    {balanceLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Spinner size="1" /> Loading...
                      </div>
                    ) : (
                      "No tokens available"
                    )}
                  </div>
                ) : (
                  availableTokens.map((item) => (
                    <button
                      key={item.token.defuseAssetId}
                      type="button"
                      onClick={() => {
                        setSelectedToken(item.token)
                        setShowTokenList(false)
                      }}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-3 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <AssetComboIcon
                          icon={item.token.icon}
                          name={item.token.name}
                          chainName={item.token.originChainName}
                        />
                        <div className="text-left">
                          <div className="font-medium">{item.token.symbol}</div>
                          <div className="text-xs text-gray-10">
                            {item.token.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono text-sm">
                        {formatTokenValue(item.balance, item.token.decimals, {
                          fractionDigits: 6,
                        })}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Error */}
            {operationError && (
              <div className="rounded-lg bg-red-100 p-3 text-sm text-red-600">
                {operationError}
              </div>
            )}

            {/* Status */}
            {lastTxStatus && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  operationStatus === "success"
                    ? "bg-green-100 text-green-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {lastTxStatus}
              </div>
            )}

            {/* Action Button */}
            <Button
              className="w-full"
              size="3"
              onClick={activeTab === "shield" ? handleShield : handleUnshield}
              disabled={!canSubmit}
            >
              {isOperating ? (
                <>
                  <Spinner size="1" /> {getStatusText(operationStatus)}
                </>
              ) : activeTab === "shield" ? (
                "Shield"
              ) : (
                "Unshield"
              )}
            </Button>
          </div>
        )}
      </div>
    </Paper>
  )
}

function getStatusText(status: OperationStatus): string {
  switch (status) {
    case "authenticating":
      return "Authenticating..."
    case "getting-quote":
      return "Getting quote..."
    case "signing":
      return "Sign in wallet..."
    case "submitting":
      return "Submitting..."
    case "polling":
      return "Processing..."
    default:
      return ""
  }
}
