import type { authHandle } from "@defuse-protocol/internal-utils"
import { ArrowsDownUp } from "@phosphor-icons/react"
import type { ModalSelectAssetsPayload } from "@src/components/DefuseSDK/components/Modal/ModalSelectAssets"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { useActorRef, useSelector } from "@xstate/react"
import clsx from "clsx"
import { useEffect, useMemo } from "react"
import type { ActorRefFrom, SnapshotFrom } from "xstate"
import { AuthGate } from "../../../components/AuthGate"
import { BlockMultiBalances } from "../../../components/Block/BlockMultiBalances"
import { ButtonCustom } from "../../../components/Button/ButtonCustom"
import { SelectAssets } from "../../../components/SelectAssets"
import { SWAP_TOKEN_FLAGS } from "../../../constants/swap"
import type { SignerCredentials } from "../../../core/formatters"
import { useTokensUsdPrices } from "../../../hooks/useTokensUsdPrices"
import { useModalStore } from "../../../providers/ModalStoreProvider"
import { ModalType } from "../../../stores/modalStore"
import type { RenderHostAppLink } from "../../../types/hostAppLink"
import { assert } from "../../../utils/assert"
import { formatTokenValue, formatUsdAmount } from "../../../utils/format"
import getTokenUsdPrice from "../../../utils/getTokenUsdPrice"
import { TokenAmountInputCard } from "../../deposit/components/DepositForm/TokenAmountInputCard"
import { balanceAllSelector } from "../../machines/depositedBalanceMachine"
import type { SendNearTransaction } from "../../machines/publicKeyVerifierMachine"
import { usePublicKeyModalOpener } from "../../swap/hooks/usePublicKeyModalOpener"
import type { otcMakerConfigLoadActor } from "../actors/otcMakerConfigLoadActor"
import { formValuesSelector } from "../actors/otcMakerFormMachine"
import type { otcMakerReadyOrderActor } from "../actors/otcMakerReadyOrderActor"
import { otcMakerRootMachine } from "../actors/otcMakerRootMachine"
import type { otcMakerSignMachine } from "../actors/otcMakerSignActor"
import { ErrorReason } from "./shared/ErrorReason"

import type {
  CreateOtcTrade,
  GenerateLink,
  SignMessage,
} from "../types/sharedTypes"
import { OtcMakerReadyOrderDialog } from "./OtcMakerReadyOrderDialog"

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
  const { configRef, readyOrderRef } = useSelector(rootActorRef, (s) => ({
    configRef: s.context.otcMakerConfigLoadRef as unknown as
      | undefined
      | ActorRefFrom<typeof otcMakerConfigLoadActor>,
    readyOrderRef: s.children.readyOrderRef as unknown as
      | undefined
      | ActorRefFrom<typeof otcMakerReadyOrderActor>,
  }))

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

  const handleSetHalfValue = async (
    fieldName: typeof SWAP_TOKEN_FLAGS.IN | typeof SWAP_TOKEN_FLAGS.OUT
  ) => {
    if (fieldName === SWAP_TOKEN_FLAGS.IN) {
      if (tokenInBalance != null) {
        formValuesRef.trigger.updateAmountIn({
          value: formatTokenValue(
            tokenInBalance.amount / 2n,
            tokenInBalance.decimals
          ),
        })
      }
    } else if (fieldName === SWAP_TOKEN_FLAGS.OUT) {
      if (tokenOutBalance != null) {
        formValuesRef.trigger.updateAmountOut({
          value: formatTokenValue(
            tokenOutBalance.amount / 2n,
            tokenOutBalance.decimals
          ),
        })
      }
    }
  }

  const balanceAmountIn = tokenInBalance?.amount ?? 0n
  const balanceAmountOut = tokenOutBalance?.amount ?? 0n
  const disabledIn = tokenInBalance?.amount === 0n
  const disabledOut = tokenOutBalance?.amount === 0n

  const error = rootSnapshot.context.error

  return (
    <div className="flex flex-col">
      {rootSnapshot.matches("signed") &&
        configRef != null &&
        readyOrderRef != null &&
        signerCredentials != null && (
          <OtcMakerReadyOrderDialog
            configRef={configRef}
            readyOrderRef={readyOrderRef}
            signerCredentials={signerCredentials}
            signMessage={signMessage}
            generateLink={generateLink}
          />
        )}

      <form
        onSubmit={(e) => {
          e.preventDefault()

          if (signerCredentials != null) {
            rootActorRef.send({
              type: "REQUEST_SIGN",
              signMessage,
              signerCredentials,
            })
          }
        }}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col items-center">
          <div className="flex flex-col gap-3">
            <TokenAmountInputCard
              variant="2"
              labelSlot={
                <label
                  htmlFor="otc-maker-amount-in"
                  className="font-bold text-label text-sm"
                >
                  Sell
                </label>
              }
              inputSlot={
                <TokenAmountInputCard.Input
                  id="otc-maker-amount-in"
                  name="amountIn"
                  value={formValues.amountIn}
                  onChange={(e) =>
                    formValuesRef.trigger.updateAmountIn({
                      value: e.target.value,
                    })
                  }
                />
              }
              tokenSlot={
                <SelectAssets
                  selected={formValues.tokenIn ?? undefined}
                  handleSelect={() =>
                    openModalSelectAssets(
                      SWAP_TOKEN_FLAGS.IN,
                      formValues.tokenIn
                    )
                  }
                />
              }
              balanceSlot={
                <BlockMultiBalances
                  balance={balanceAmountIn}
                  decimals={tokenInBalance?.decimals ?? 0}
                  className={clsx(
                    "!static",
                    tokenInBalance == null && "invisible"
                  )}
                  maxButtonSlot={
                    <BlockMultiBalances.DisplayMaxButton
                      onClick={() => handleSetMaxValue(SWAP_TOKEN_FLAGS.IN)}
                      balance={balanceAmountIn}
                      disabled={disabledIn}
                    />
                  }
                  halfButtonSlot={
                    <BlockMultiBalances.DisplayHalfButton
                      onClick={() => handleSetHalfValue(SWAP_TOKEN_FLAGS.IN)}
                      balance={balanceAmountIn}
                      disabled={disabledIn}
                    />
                  }
                />
              }
              priceSlot={
                <TokenAmountInputCard.DisplayPrice>
                  {usdAmountIn !== null && usdAmountIn > 0
                    ? formatUsdAmount(usdAmountIn)
                    : null}
                </TokenAmountInputCard.DisplayPrice>
              }
            />
          </div>

          <button
            type="button"
            // mousedown event is used to prevent the button from stealing focus
            onMouseDown={(e) => {
              e.preventDefault()
              formValuesRef.trigger.switchTokens()
            }}
            className="size-10 -my-3.5 rounded-[10px] bg-accent-1 flex items-center justify-center z-10"
          >
            <ArrowsDownUp className="size-5" weight="bold" />
          </button>

          <div className="flex flex-col gap-3">
            <TokenAmountInputCard
              variant="2"
              labelSlot={
                <label
                  htmlFor="otc-maker-amount-out"
                  className="font-bold text-label text-sm"
                >
                  Buy
                </label>
              }
              inputSlot={
                <TokenAmountInputCard.Input
                  id="otc-maker-amount-out"
                  name="amountOut"
                  value={formValues.amountOut}
                  onChange={(e) =>
                    formValuesRef.trigger.updateAmountOut({
                      value: e.target.value,
                    })
                  }
                />
              }
              tokenSlot={
                <SelectAssets
                  selected={formValues.tokenOut ?? undefined}
                  handleSelect={() =>
                    openModalSelectAssets(
                      SWAP_TOKEN_FLAGS.OUT,
                      formValues.tokenOut
                    )
                  }
                />
              }
              balanceSlot={
                <BlockMultiBalances
                  balance={balanceAmountOut}
                  decimals={tokenOutBalance?.decimals ?? 0}
                  className={clsx(
                    "!static",
                    tokenOutBalance == null && "invisible"
                  )}
                  maxButtonSlot={
                    <BlockMultiBalances.DisplayMaxButton
                      onClick={() => handleSetMaxValue(SWAP_TOKEN_FLAGS.OUT)}
                      balance={balanceAmountOut}
                      disabled={disabledOut}
                    />
                  }
                  halfButtonSlot={
                    <BlockMultiBalances.DisplayHalfButton
                      onClick={() => handleSetHalfValue(SWAP_TOKEN_FLAGS.OUT)}
                      balance={balanceAmountOut}
                      disabled={disabledOut}
                    />
                  }
                />
              }
              priceSlot={
                <TokenAmountInputCard.DisplayPrice>
                  {usdAmountOut !== null && usdAmountOut > 0
                    ? formatUsdAmount(usdAmountOut)
                    : null}
                </TokenAmountInputCard.DisplayPrice>
              }
            />
          </div>

          <div className="w-full flex items-center justify-between gap-3 mt-4">
            <label htmlFor="otc-maker-expiry" className="text-gray-11 text-sm">
              Order expires in
            </label>
            <select
              id="otc-maker-expiry"
              name="expiry"
              value={formValues.expiry}
              onChange={(e) => {
                formValuesRef.trigger.updateExpiry({ value: e.target.value })
              }}
              className="bg-gray-1 border border-gray-7 rounded-full text-sm px-3 py-1 font-medium outline-none appearance-none cursor-pointer"
            >
              <option value="5m">5 Minutes</option>
              <option value="30m">30 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="12h">12 Hours</option>
              <option value="1d">1 Day</option>
              <option value="3d">3 Days</option>
              <option value="7d">7 Days</option>
              <option value="30d">1 Month</option>
              <option value="365d">1 Year (max)</option>
            </select>
          </div>
        </div>

        <AuthGate
          renderHostAppLink={renderHostAppLink}
          shouldRender={isLoggedIn}
        >
          {renderSubmitButton(rootSnapshot)}
        </AuthGate>
      </form>
      {error != null && (
        <div className="mt-2">
          <ErrorReason reason={error.reason} />
        </div>
      )}
    </div>
  )
}

function renderSubmitButton(
  snapshot: SnapshotFrom<typeof otcMakerRootMachine>
) {
  let caption = "Create swap link"

  switch (true) {
    case snapshot.matches("editing"):
      caption = "Create swap link"
      break
    case snapshot.matches("signing"):
      caption = "Confirm in your wallet..."
      break
    case snapshot.matches("signed"):
      caption = "Swap link created!"
      break
  }

  return (
    <ButtonCustom
      type="submit"
      size="lg"
      variant={snapshot.matches("signing") ? "secondary" : "primary"}
      isLoading={snapshot.matches("signing") || snapshot.matches("storing")}
    >
      {caption}
    </ButtonCustom>
  )
}
