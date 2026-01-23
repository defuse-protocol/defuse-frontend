import type { authHandle } from "@defuse-protocol/internal-utils"
import { ArrowDownIcon } from "@heroicons/react/20/solid"
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
import { useTokensUsdPrices } from "../../../hooks/useTokensUsdPrices"
import { useModalStore } from "../../../providers/ModalStoreProvider"
import { ModalType } from "../../../stores/modalStore"
import type { RenderHostAppLink } from "../../../types/hostAppLink"
import { assert } from "../../../utils/assert"
import { formatTokenValue } from "../../../utils/format"
import getTokenUsdPrice from "../../../utils/getTokenUsdPrice"
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

  // Check if entered amount exceeds available balance
  const balanceInsufficient = useMemo(() => {
    if (!tokenInBalance || !formValues.amountIn) return false
    const amountInParsed = Number.parseFloat(formValues.amountIn)
    if (Number.isNaN(amountInParsed) || amountInParsed <= 0) return false

    // Convert amountIn string to bigint with proper decimals
    const [intPart, decPart = ""] = formValues.amountIn.split(".")
    const paddedDecimal = decPart
      .slice(0, tokenInBalance.decimals)
      .padEnd(tokenInBalance.decimals, "0")
    const amountInBigInt = BigInt(intPart + paddedDecimal)

    return amountInBigInt > tokenInBalance.amount
  }, [formValues.amountIn, tokenInBalance])

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
            label="You send"
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
              className="size-9 flex items-center justify-center bg-white border hover:border-gray-300 transition-colors duration-100 border-gray-200 rounded-lg text-gray-400 hover:text-gray-500"
              data-testid="swap-form-switch-tokens-button"
              aria-label="Switch tokens"
            >
              <ArrowDownIcon className="size-5" />
            </button>
          </div>

          <TokenInputCard
            label="You receive"
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
              onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                formValuesRef.trigger.updateAmountOut({
                  value: e.target.value,
                }),
            }}
            isOutputField
          />

          <div className="mt-5 flex justify-between items-center">
            <div>
              <label
                htmlFor="otc-maker-expiry"
                className="text-sm/4 font-semibold text-gray-900"
              >
                Expires
              </label>
              {expiryDateString && (
                <p className="text-sm/4 font-medium text-gray-500">
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
              className="appearance-none rounded-xl py-1.5 bg-white text-base font-medium text-gray-900 outline-1 -outline-offset-1 outline-gray-200 border-0 ring-0 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-gray-900"
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
      return "Cannot store OTC trade"
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
