import type { authHandle } from "@defuse-protocol/internal-utils"
import { ArrowDownIcon } from "@heroicons/react/20/solid"
import Alert from "@src/components/Alert"
import Button from "@src/components/Button"
import ModalActiveDeal from "@src/components/DefuseSDK/components/Modal/ModalActiveDeal"
import ModalReviewDeal from "@src/components/DefuseSDK/components/Modal/ModalReviewDeal"
import type { ModalSelectAssetsPayload } from "@src/components/DefuseSDK/components/Modal/ModalSelectAssets"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { useActorRef, useSelector } from "@xstate/react"
import { useEffect, useMemo, useState } from "react"
import type { ActorRefFrom, SnapshotFrom } from "xstate"
import { AuthGate } from "../../../components/AuthGate"
import { SWAP_TOKEN_FLAGS } from "../../../constants/swap"
import type { SignerCredentials } from "../../../core/formatters"
import {
  type TokenUsdPriceData,
  useTokensUsdPrices,
} from "../../../hooks/useTokensUsdPrices"
import { useModalStore } from "../../../providers/ModalStoreProvider"
import { ModalType } from "../../../stores/modalStore"
import type { RenderHostAppLink } from "../../../types/hostAppLink"
import { assert } from "../../../utils/assert"
import { formatTokenValue } from "../../../utils/format"
import getTokenUsdPrice from "../../../utils/getTokenUsdPrice"
import { isBaseToken, isUnifiedToken } from "../../../utils/token"
import TokenInputCard from "../../deposit/components/DepositForm/TokenInputCard"
import { balanceAllSelector } from "../../machines/depositedBalanceMachine"
import type { SendNearTransaction } from "../../machines/publicKeyVerifierMachine"
import { usePublicKeyModalOpener } from "../../swap/hooks/usePublicKeyModalOpener"
import { formValuesSelector } from "../actors/otcMakerFormMachine"
import type { otcMakerReadyOrderActor } from "../actors/otcMakerReadyOrderActor"
import { otcMakerRootMachine } from "../actors/otcMakerRootMachine"
import type { otcMakerSignMachine } from "../actors/otcMakerSignActor"
import type {
  CreateOtcTrade,
  GenerateLink,
  SignMessage,
} from "../types/sharedTypes"
import { expiryToSeconds, parseExpiry } from "../utils/expiryUtils"

function getTokenRawPrice(
  token: TokenInfo | null,
  tokensUsdPriceData?: TokenUsdPriceData
): number | null {
  if (!tokensUsdPriceData || !token) return null
  if (isBaseToken(token) && tokensUsdPriceData[token.defuseAssetId]) {
    return tokensUsdPriceData[token.defuseAssetId].price
  }
  if (isUnifiedToken(token)) {
    for (const groupedToken of token.groupedTokens) {
      if (
        isBaseToken(groupedToken) &&
        tokensUsdPriceData[groupedToken.defuseAssetId]
      ) {
        return tokensUsdPriceData[groupedToken.defuseAssetId].price
      }
    }
  }
  return null
}

export type OtcMakerWidgetProps = {
  /** List of available tokens for trading */
  tokenList: TokenInfo[]

  /** User's wallet address */
  userAddress: authHandle.AuthHandle["identifier"] | undefined
  chainType: authHandle.AuthHandle["method"] | undefined

  /** Initial tokens for pre-filling the form */
  initialTokenIn?: TokenInfo
  initialTokenOut?: TokenInfo

  /** Sign message callback */
  signMessage: SignMessage

  /** Send NEAR transaction callback */
  sendNearTransaction: SendNearTransaction

  /** Create OTCTrade in the database */
  createOtcTrade: CreateOtcTrade

  /** Function to generate a shareable trade link */
  generateLink: GenerateLink

  /** Theme selection */
  theme?: "dark" | "light"

  /** External navigation */
  renderHostAppLink: RenderHostAppLink

  /** Frontend referral */
  referral?: string

  /** Callback when deal is successfully created and user closes the modal */
  onSuccess?: () => void
}

export function OtcMakerForm({
  tokenList,
  userAddress,
  chainType,
  initialTokenIn,
  initialTokenOut,
  signMessage,
  sendNearTransaction,
  generateLink,
  renderHostAppLink,
  referral,
  createOtcTrade,
  onSuccess,
}: OtcMakerWidgetProps) {
  const signerCredentials: SignerCredentials | null = useMemo(
    () =>
      userAddress != null && chainType != null
        ? {
            credential: userAddress,
            credentialType: chainType,
          }
        : null,
    [userAddress, chainType]
  )
  const isLoggedIn = signerCredentials != null

  const initialTokenIn_ = initialTokenIn ?? tokenList[0]
  const initialTokenOut_ = initialTokenOut ?? tokenList[1]
  assert(initialTokenIn_ !== undefined, "Token list must not be empty")
  assert(
    initialTokenOut_ !== undefined,
    "Token list must have at least two tokens"
  )

  const rootActorRef = useActorRef(otcMakerRootMachine, {
    input: {
      initialTokenIn: initialTokenIn_,
      initialTokenOut: initialTokenOut_,
      tokenList,
      referral,
      createOtcTrade,
    },
  })

  const formRef = useSelector(rootActorRef, (s) => s.context.formRef)
  const formValuesRef = useSelector(formRef, formValuesSelector)
  const formValues = useSelector(formValuesRef, (s) => s.context)

  const { tokenInBalance, tokenOutBalance } = useSelector(
    useSelector(rootActorRef, (s) => s.context.depositedBalanceRef),
    balanceAllSelector({
      tokenInBalance: formValues.tokenIn,
      tokenOutBalance: formValues.tokenOut,
    })
  )

  const rootSnapshot = useSelector(rootActorRef, (s) => s)
  const readyOrderRef = useSelector(
    rootActorRef,
    (s) =>
      s.children.readyOrderRef as unknown as
        | undefined
        | ActorRefFrom<typeof otcMakerReadyOrderActor>
  )

  const readyOrderContext = useSelector(readyOrderRef, (state) =>
    state ? state.context : null
  )

  const { data: tokensUsdPriceData } = useTokensUsdPrices()
  const usdAmountIn = getTokenUsdPrice(
    formValues.amountIn,
    formValues.tokenIn,
    tokensUsdPriceData
  )
  const usdAmountOut = getTokenUsdPrice(
    formValues.amountOut,
    formValues.tokenOut,
    tokensUsdPriceData
  )

  // Track if user has manually edited amountOut (to avoid overwriting their input)
  const [userEditedAmountOut, setUserEditedAmountOut] = useState(false)

  // Reset userEditedAmountOut when tokens change
  // biome-ignore lint/correctness/useExhaustiveDependencies: dependencies are intentional triggers
  useEffect(() => {
    setUserEditedAmountOut(false)
  }, [formValues.tokenIn, formValues.tokenOut])

  // Auto-calculate amountOut based on market prices
  useEffect(() => {
    if (userEditedAmountOut) return
    if (!tokensUsdPriceData) return
    if (!formValues.tokenIn || !formValues.tokenOut) return

    // If amountIn is cleared, also clear amountOut
    if (!formValues.amountIn) {
      if (formValues.amountOut) {
        formValuesRef.trigger.updateAmountOut({ value: "" })
      }
      return
    }

    const amountInNum = Number(formValues.amountIn)
    if (Number.isNaN(amountInNum) || amountInNum <= 0) return

    const tokenInPrice = getTokenRawPrice(
      formValues.tokenIn,
      tokensUsdPriceData
    )
    const tokenOutPrice = getTokenRawPrice(
      formValues.tokenOut,
      tokensUsdPriceData
    )
    if (!tokenInPrice || !tokenOutPrice || tokenOutPrice === 0) return

    const usdValue = amountInNum * tokenInPrice
    const calculatedAmountOut = usdValue / tokenOutPrice

    // Guard against invalid calculations
    if (!Number.isFinite(calculatedAmountOut) || calculatedAmountOut < 0) return

    // Format with reasonable precision (use balance decimals which handles both token types)
    const decimals = tokenOutBalance?.decimals ?? 8
    const precision = Math.min(decimals, 8)
    const formatted = calculatedAmountOut
      .toFixed(precision)
      .replace(/\.?0+$/, "")

    // Only update if value actually changed to prevent loops
    if (formatted === formValues.amountOut) return

    formValuesRef.trigger.updateAmountOut({ value: formatted })
  }, [
    formValues.amountIn,
    formValues.amountOut,
    formValues.tokenIn,
    formValues.tokenOut,
    tokensUsdPriceData,
    userEditedAmountOut,
    formValuesRef,
    tokenOutBalance,
  ])

  useEffect(() => {
    if (signerCredentials == null) {
      rootActorRef.send({ type: "LOGOUT" })
    } else {
      rootActorRef.send({
        type: "LOGIN",
        params: {
          userAddress: signerCredentials.credential,
          userChainType: signerCredentials.credentialType,
        },
      })
    }
  }, [rootActorRef, signerCredentials])

  const { setModalType, payload } = useModalStore((state) => state)

  const openModalSelectAssets = (
    fieldName: string,
    token: TokenInfo | undefined
  ) => {
    setModalType(ModalType.MODAL_SELECT_ASSETS, {
      ...(payload as ModalSelectAssetsPayload),
      fieldName,
      [fieldName]: token,
      onConfirm: (payload: ModalSelectAssetsPayload) => {
        const { fieldName } = payload as ModalSelectAssetsPayload
        const _payload = payload as ModalSelectAssetsPayload
        const token = _payload[fieldName || "token"]

        if (fieldName && token) {
          switch (fieldName) {
            case SWAP_TOKEN_FLAGS.IN:
              if (
                formValues.tokenOut === token &&
                formValues.tokenIn !== null
              ) {
                formValuesRef.trigger.updateTokenOut({
                  value: formValues.tokenIn,
                })
              }
              formValuesRef.trigger.updateTokenIn({ value: token })
              break
            case SWAP_TOKEN_FLAGS.OUT:
              if (
                formValues.tokenIn === token &&
                formValues.tokenOut !== null
              ) {
                formValuesRef.trigger.updateTokenIn({
                  value: formValues.tokenOut,
                })
              }
              formValuesRef.trigger.updateTokenOut({ value: token })
              break
          }
        }
      },
      isHoldingsEnabled: true,
    })
  }

  const publicKeyVerifierRef = useSelector(
    useSelector(
      useSelector(
        rootActorRef,
        (state) =>
          state.children.signRef as
            | undefined
            | ActorRefFrom<typeof otcMakerSignMachine>
      ),
      (state) => {
        if (state) {
          return state.children.signRef
        }
      }
    ),
    (state) => {
      if (state) {
        return state.children.publicKeyVerifierRef
      }
    }
  )

  // @ts-expect-error ???
  usePublicKeyModalOpener(publicKeyVerifierRef, sendNearTransaction)

  const handleSetMaxValue = async (
    fieldName: typeof SWAP_TOKEN_FLAGS.IN | typeof SWAP_TOKEN_FLAGS.OUT
  ) => {
    if (fieldName === SWAP_TOKEN_FLAGS.IN) {
      if (tokenInBalance != null) {
        formValuesRef.trigger.updateAmountIn({
          value: formatTokenValue(
            tokenInBalance.amount,
            tokenInBalance.decimals
          ),
        })
      }
    } else if (fieldName === SWAP_TOKEN_FLAGS.OUT) {
      if (tokenOutBalance != null) {
        formValuesRef.trigger.updateAmountOut({
          value: formatTokenValue(
            tokenOutBalance.amount,
            tokenOutBalance.decimals
          ),
        })
      }
    }
  }

  const balanceAmountIn = tokenInBalance?.amount ?? 0n
  const balanceAmountOut = tokenOutBalance?.amount ?? 0n
  const hasAmountIn = Number(formValues.amountIn) > 0
  const hasAmountOut = Number(formValues.amountOut) > 0

  const balanceInsufficient = useMemo(() => {
    if (!tokenInBalance || !formValues.amountIn) return false
    const parsed = Number.parseFloat(formValues.amountIn)
    if (Number.isNaN(parsed) || parsed <= 0) return false

    try {
      const [intPart, decPart = ""] = formValues.amountIn.split(".")
      const paddedDecimal = decPart
        .slice(0, tokenInBalance.decimals)
        .padEnd(tokenInBalance.decimals, "0")
      return BigInt(intPart + paddedDecimal) > tokenInBalance.amount
    } catch {
      return false
    }
  }, [formValues.amountIn, tokenInBalance])

  // Calculate deviation from market rate
  // Show warning when user has manually set values that differ from market rate
  const marketRateDeviation = useMemo(() => {
    // Only show if user has taken control of the destination amount
    if (!userEditedAmountOut) return null
    if (!usdAmountIn || !usdAmountOut) return null
    if (usdAmountIn === 0) return null

    const deviation = ((usdAmountOut - usdAmountIn) / usdAmountIn) * 100

    // Only warn if deviation is more than 5% in either direction
    if (Math.abs(deviation) <= 5) return null

    return deviation
  }, [userEditedAmountOut, usdAmountIn, usdAmountOut])

  const resetToMarketRate = () => {
    setUserEditedAmountOut(false)
  }

  const error = rootSnapshot.context.error

  const isReviewOpen =
    rootSnapshot.matches({ editing: "reviewing" }) ||
    rootSnapshot.matches("signing") ||
    rootSnapshot.matches("storing") ||
    Boolean(error)

  // Compute the expiry deadline timestamp (same calculation as in otcMakerSignActor)
  const [expiryDeadline, setExpiryDeadline] = useState<Date | null>(null)

  const expiryDateString = useMemo(() => {
    if (!expiryDeadline) return ""
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(expiryDeadline)
  }, [expiryDeadline])

  useEffect(() => {
    const parsedExpiry = parseExpiry(formValues.expiry)
    if (!parsedExpiry) {
      setExpiryDeadline(null)
      return
    }

    const updateDeadline = () => {
      const deadlineMs = Date.now() + expiryToSeconds(parsedExpiry) * 1000
      setExpiryDeadline(new Date(deadlineMs))
    }

    updateDeadline()
    // Update every minute to keep the preview accurate
    const interval = setInterval(updateDeadline, 60_000)
    return () => clearInterval(interval)
  }, [formValues.expiry])

  return (
    <>
      <section className="mt-5">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            rootActorRef.send({ type: "REQUEST_REVIEW" })
          }}
        >
          <TokenInputCard
            balance={balanceAmountIn}
            decimals={tokenInBalance?.decimals ?? 0}
            symbol={formValues.tokenIn?.symbol}
            handleSetMax={() => handleSetMaxValue(SWAP_TOKEN_FLAGS.IN)}
            usdAmount={usdAmountIn}
            selectAssetsTestId="select-assets-sell"
            selectedToken={formValues.tokenIn ?? undefined}
            tokens={tokenList}
            handleSelectToken={() =>
              openModalSelectAssets(SWAP_TOKEN_FLAGS.IN, formValues.tokenIn)
            }
            registration={{
              name: "amountIn",
              value: formValues.amountIn,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                formValuesRef.trigger.updateAmountIn({ value: e.target.value }),
            }}
            hasError={balanceInsufficient}
            error={
              balanceInsufficient
                ? "Amount entered exceeds available balance"
                : undefined
            }
          />

          <div className="flex items-center justify-center -my-3.5">
            <button
              type="button"
              // Keep focus on the input
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => formValuesRef.trigger.switchTokens()}
              className="size-9 flex items-center justify-center bg-surface-card border hover:border-border-strong transition-colors duration-100 border-border rounded-lg text-fg-tertiary hover:text-fg-secondary"
              data-testid="swap-form-switch-tokens-button"
              aria-label="Switch tokens"
            >
              <ArrowDownIcon className="size-5" />
            </button>
          </div>

          <TokenInputCard
            balance={balanceAmountOut}
            decimals={tokenOutBalance?.decimals ?? 0}
            symbol={formValues.tokenOut?.symbol}
            usdAmount={usdAmountOut}
            selectAssetsTestId="select-assets-buy"
            selectedToken={formValues.tokenOut ?? undefined}
            tokens={tokenList}
            handleSelectToken={() =>
              openModalSelectAssets(SWAP_TOKEN_FLAGS.OUT, formValues.tokenOut)
            }
            registration={{
              name: "amountOut",
              value: formValues.amountOut,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                setUserEditedAmountOut(true)
                formValuesRef.trigger.updateAmountOut({
                  value: e.target.value,
                })
              },
            }}
            isOutputField
          />

          {marketRateDeviation !== null && (
            <Alert variant="warning" className="mt-5">
              <p>
                {marketRateDeviation < 0
                  ? `You're receiving ${Math.abs(marketRateDeviation).toFixed(0)}% less value than you're giving.`
                  : `You're asking for ${Math.abs(marketRateDeviation).toFixed(0)}% more value than you're giving.`}
              </p>
              <button
                type="button"
                onClick={resetToMarketRate}
                className="text-yellow-700 underline hover:text-yellow-900"
              >
                Reset to market rate
              </button>
            </Alert>
          )}

          <div className="mt-5 flex justify-between items-center">
            <div>
              <label
                htmlFor="otc-maker-expiry"
                className="text-sm/4 font-semibold text-fg"
              >
                Expires
              </label>
              {expiryDateString && (
                <p className="text-sm/4 font-medium text-fg-secondary">
                  {expiryDateString}
                </p>
              )}
            </div>
            <select
              id="otc-maker-expiry"
              name="expiry"
              value={formValues.expiry}
              onChange={(e) => {
                formValuesRef.trigger.updateExpiry({ value: e.target.value })
              }}
              className="appearance-none rounded-xl py-1.5 bg-surface-card text-base font-medium text-fg outline-1 -outline-offset-1 outline-border border-0 ring-0 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-fg"
            >
              <option value="5m">5 minutes</option>
              <option value="30m">30 minutes</option>
              <option value="1h">1 hour</option>
              <option value="12h">12 hours</option>
              <option value="1d">1 day</option>
              <option value="3d">3 days</option>
              <option value="7d">7 days</option>
              <option value="30d">1 month</option>
              <option value="365d">1 year (max)</option>
            </select>
          </div>

          <AuthGate
            renderHostAppLink={renderHostAppLink}
            shouldRender={isLoggedIn}
          >
            <Button
              className="mt-6"
              type="submit"
              size="xl"
              fullWidth
              variant={
                rootSnapshot.matches("signing") ? "secondary" : "primary"
              }
              disabled={!hasAmountIn || !hasAmountOut}
            >
              {renderSubmitButtonText({
                snapshot: rootSnapshot,
                hasValues: hasAmountIn && hasAmountOut,
              })}
            </Button>
          </AuthGate>
        </form>
      </section>

      <ModalReviewDeal
        open={isReviewOpen}
        onClose={() => rootActorRef.send({ type: "CANCEL_REVIEW" })}
        onConfirm={() => {
          if (signerCredentials != null) {
            rootActorRef.send({
              type: "REQUEST_SIGN",
              signMessage,
              signerCredentials,
            })
          }
        }}
        loading={
          rootSnapshot.matches("signing") || rootSnapshot.matches("storing")
        }
        tokenIn={formValues.tokenIn}
        tokenOut={formValues.tokenOut}
        amountIn={formValues.amountIn}
        amountOut={formValues.amountOut}
        usdAmountIn={usdAmountIn ?? 0}
        usdAmountOut={usdAmountOut ?? 0}
        expiryDateString={expiryDateString}
        errorMessage={error ? renderErrorMessages(error.reason) : undefined}
      />

      {rootSnapshot.matches("signed") &&
        readyOrderContext != null &&
        signerCredentials != null && (
          <ModalActiveDeal
            open={true}
            onClose={() => {
              readyOrderRef?.send({ type: "FINISH" })
              onSuccess?.()
            }}
            tokenIn={readyOrderContext.parsed.tokenIn}
            tokenOut={readyOrderContext.parsed.tokenOut}
            tradeId={readyOrderContext.tradeId}
            pKey={readyOrderContext.pKey}
            iv={readyOrderContext.iv}
            multiPayload={readyOrderContext.multiPayload}
            nonceBase64={readyOrderContext.usedNonceBase64}
            generateLink={generateLink}
            signerCredentials={signerCredentials}
            signMessage={signMessage}
            sendNearTransaction={sendNearTransaction}
          />
        )}
    </>
  )
}

function renderErrorMessages(reason: string): string {
  switch (reason) {
    case "ERR_STORE_FAILED":
      return "Cannot store deal"
    case "ERR_PREPARING_SIGNING_DATA":
      return "Failed to prepare message for your wallet to sign. Please try again."
    case "ERR_USER_DIDNT_SIGN":
      return "It seems the message wasn’t signed in your wallet. Please try again."
    default:
      return reason
  }
}

function renderSubmitButtonText({
  snapshot,
  hasValues,
}: {
  snapshot: SnapshotFrom<typeof otcMakerRootMachine>
  hasValues: boolean
}) {
  if (!hasValues) return "Enter amounts"
  if (snapshot.matches("editing")) return "Review deal"
  return "Review deal"
}
