import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { useActorRef, useSelector } from "@xstate/react"
import clsx from "clsx"
import { useEffect, useMemo } from "react"
import type { ActorRefFrom, PromiseActorLogic } from "xstate"
import { AuthGate } from "../../../components/AuthGate"
import { BlockMultiBalances } from "../../../components/Block/BlockMultiBalances"
import { ButtonCustom } from "../../../components/Button/ButtonCustom"
import type { ModalSelectAssetsPayload } from "../../../components/Modal/ModalSelectAssets"
import { SelectAssets } from "../../../components/SelectAssets"
import type { SignerCredentials } from "../../../core/formatters"
import { useTokensUsdPrices } from "../../../hooks/useTokensUsdPrices"
import { useModalStore } from "../../../providers/ModalStoreProvider"
import { ModalType } from "../../../stores/modalStore"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../../../types/base"
import type { RenderHostAppLink } from "../../../types/hostAppLink"
import type { SwappableToken } from "../../../types/swap"
import { assert } from "../../../utils/assert"
import { formatTokenValue, formatUsdAmount } from "../../../utils/format"
import getTokenUsdPrice from "../../../utils/getTokenUsdPrice"
import { TokenAmountInputCard } from "../../deposit/components/DepositForm/TokenAmountInputCard"
import { balanceAllSelector } from "../../machines/depositedBalanceMachine"
import type { SendNearTransaction } from "../../machines/publicKeyVerifierMachine"
import type { publicKeyVerifierMachine } from "../../machines/publicKeyVerifierMachine"
import { usePublicKeyModalOpener } from "../../swap/hooks/usePublicKeyModalOpener"
import { formValuesSelector } from "../actors/giftMakerFormMachine"
import type { giftMakerReadyActor } from "../actors/giftMakerReadyActor"
import { giftMakerRootMachine } from "../actors/giftMakerRootMachine"
import type { giftMakerSignActor } from "../actors/giftMakerSignActor"
import type {
  GiftMakerSignActorInput,
  GiftMakerSignActorOutput,
} from "../actors/giftMakerSignActor"
import { useBalanceUpdaterSyncWithHistory } from "../hooks/useBalanceUpdaterSyncWithHistory"
import { useCheckSignerCredentials } from "../hooks/useCheckSignerCredentials"
import type {
  CreateGiftIntent,
  GenerateLink,
  SignMessage,
} from "../types/sharedTypes"
import { checkInsufficientBalance, getButtonText } from "../utils/makerForm"
import { GiftMakerReadyDialog } from "./GiftMakerReadyDialog"
import { GiftMessageInput } from "./GiftMessageInput"
import { ErrorReason } from "./shared/ErrorReason"
import { GiftDescription } from "./shared/GiftDescription"
import { GiftHeader } from "./shared/GiftHeader"

export type GiftMakerWidgetProps = {
  /** List of available tokens for trading */
  tokenList: (BaseTokenInfo | UnifiedTokenInfo)[]

  /** User's wallet address */
  userAddress: string | null | undefined
  userChainType: AuthMethod | null | undefined

  /** Initial tokens for pre-filling the form */
  initialToken?: BaseTokenInfo | UnifiedTokenInfo

  /** Sign message callback */
  signMessage: SignMessage

  /** Send NEAR transaction callback */
  sendNearTransaction: SendNearTransaction

  /** Create Gift in the database */
  createGiftIntent: CreateGiftIntent

  /** Function to generate a shareable trade link */
  generateLink: GenerateLink

  /** Theme selection */
  theme?: "dark" | "light"

  /** Frontend referral */
  referral?: string

  renderHostAppLink: RenderHostAppLink
}

const MAX_MESSAGE_LENGTH = 500

export function GiftMakerForm({
  tokenList,
  userAddress,
  userChainType,
  initialToken,
  signMessage,
  sendNearTransaction,
  generateLink,
  referral,
  renderHostAppLink,
  createGiftIntent,
}: GiftMakerWidgetProps) {
  const signerCredentials: SignerCredentials | null = useMemo(
    () =>
      userAddress != null && userChainType != null
        ? {
            credential: userAddress,
            credentialType: userChainType,
          }
        : null,
    [userAddress, userChainType]
  )
  const isLoggedIn = signerCredentials != null

  const initialToken_ = initialToken ?? tokenList[0]
  assert(initialToken_ !== undefined, "Token list must not be empty")

  const rootActorRef = useActorRef(giftMakerRootMachine, {
    input: {
      initialToken: initialToken_,
      tokenList,
      referral,
      createGiftIntent,
    },
  })

  const formRef = useSelector(rootActorRef, (s) => s.context.formRef)
  const formValuesRef = useSelector(formRef, formValuesSelector)
  const formValues = useSelector(formValuesRef, (s) => s.context)

  const { tokenBalance } = useSelector(
    useSelector(rootActorRef, (s) => s.context.depositedBalanceRef),
    balanceAllSelector({
      tokenBalance: formValues.token,
    })
  )

  const rootSnapshot = useSelector(rootActorRef, (s) => s)
  const { readyGiftRef } = useSelector(rootActorRef, (s) => ({
    readyGiftRef: s.children.readyGiftRef as unknown as
      | undefined
      | ActorRefFrom<typeof giftMakerReadyActor>,
  }))

  useCheckSignerCredentials(rootActorRef, signerCredentials)
  useBalanceUpdaterSyncWithHistory(rootActorRef, signerCredentials)

  const { data: tokensUsdPriceData } = useTokensUsdPrices()
  const usdAmount = getTokenUsdPrice(
    formValues.amount,
    formValues.token,
    tokensUsdPriceData
  )

  const depositedBalanceRef = useSelector(
    rootActorRef,
    (state) => state.children.depositedBalanceRef
  )

  const { setModalType, payload } = useModalStore((state) => state)

  const openModalSelectAssets = (
    fieldName: string,
    token: SwappableToken | undefined
  ) => {
    setModalType(ModalType.MODAL_SELECT_ASSETS, {
      ...(payload as ModalSelectAssetsPayload),
      fieldName,
      [fieldName]: token,
      balances: depositedBalanceRef?.getSnapshot().context.balances,
    })
  }

  useEffect(() => {
    if (
      (payload as ModalSelectAssetsPayload)?.modalType !==
      ModalType.MODAL_SELECT_ASSETS
    ) {
      return
    }

    const { modalType, fieldName } = payload as ModalSelectAssetsPayload
    const _payload = payload as ModalSelectAssetsPayload
    const token = _payload[fieldName || "token"]
    if (modalType === ModalType.MODAL_SELECT_ASSETS && fieldName && token) {
      formValuesRef.trigger.updateToken({ value: token })
    }
  }, [payload, formValuesRef])

  const balanceInsufficient = useMemo(() => {
    if (!tokenBalance) {
      return false
    }
    return checkInsufficientBalance(formValues.amount, tokenBalance)
  }, [formValues.amount, tokenBalance])

  const editing = rootSnapshot.matches("editing")
  const processing =
    rootSnapshot.matches("signing") ||
    rootSnapshot.matches("saving") ||
    rootSnapshot.matches("publishing") ||
    rootSnapshot.matches("updating") ||
    rootSnapshot.matches("settling") ||
    rootSnapshot.matches("removing")

  const error = rootSnapshot.context.error

  const publicKeyVerifierRef = useSelector(
    useSelector(
      useSelector(
        rootActorRef,
        (state) =>
          state.children.signRef as
            | undefined
            | ActorRefFrom<typeof giftMakerSignActor>
      ),
      (state) => {
        if (state) {
          return (
            state as unknown as {
              children: {
                signRef: ActorRefFrom<
                  PromiseActorLogic<
                    GiftMakerSignActorOutput,
                    GiftMakerSignActorInput
                  >
                >
              }
            }
          ).children.signRef
        }
      }
    ),
    (state) => {
      if (state) {
        return (
          state as unknown as {
            children: {
              publicKeyVerifierRef: ActorRefFrom<
                typeof publicKeyVerifierMachine
              >
            }
          }
        ).children.publicKeyVerifierRef
      }
    }
  )

  usePublicKeyModalOpener(publicKeyVerifierRef, sendNearTransaction)

  const handleSetMaxValue = async () => {
    if (tokenBalance != null) {
      formValuesRef.trigger.updateAmount({
        value: formatTokenValue(tokenBalance.amount, tokenBalance.decimals),
      })
    }
  }

  const handleSetHalfValue = async () => {
    if (tokenBalance != null) {
      formValuesRef.trigger.updateAmount({
        value: formatTokenValue(
          tokenBalance.amount / 2n,
          tokenBalance.decimals
        ),
      })
    }
  }

  const balanceAmount = tokenBalance?.amount ?? 0n
  const disabled = tokenBalance?.amount === 0n

  return (
    <div className="flex flex-col">
      {rootSnapshot.matches("settled") &&
        readyGiftRef != null &&
        signerCredentials != null && (
          <GiftMakerReadyDialog
            readyGiftRef={readyGiftRef}
            generateLink={generateLink}
            signerCredentials={signerCredentials}
          />
        )}

      <GiftHeader title="Share gift">
        <GiftDescription
          description="Send assets to your friends and help them get started on NEAR
            Intents, hassle-free."
        />
      </GiftHeader>

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
                  htmlFor="gift-amount-in"
                  className="font-bold text-label text-sm"
                >
                  Gift amount
                </label>
              }
              inputSlot={
                <TokenAmountInputCard.Input
                  id="gift-amount-in"
                  name="amount"
                  value={formValues.amount}
                  onChange={(e) =>
                    formValuesRef.trigger.updateAmount({
                      value: e.target.value,
                    })
                  }
                  disabled={processing}
                />
              }
              tokenSlot={
                <SelectAssets
                  selected={formValues.token ?? undefined}
                  handleSelect={() =>
                    openModalSelectAssets("token", formValues.token)
                  }
                />
              }
              balanceSlot={
                <BlockMultiBalances
                  balance={balanceAmount}
                  decimals={tokenBalance?.decimals ?? 0}
                  className={clsx(
                    "!static",
                    tokenBalance == null && "invisible"
                  )}
                  maxButtonSlot={
                    <BlockMultiBalances.DisplayMaxButton
                      onClick={handleSetMaxValue}
                      balance={balanceAmount}
                      disabled={disabled}
                    />
                  }
                  halfButtonSlot={
                    <BlockMultiBalances.DisplayHalfButton
                      onClick={handleSetHalfValue}
                      balance={balanceAmount}
                      disabled={disabled}
                    />
                  }
                />
              }
              priceSlot={
                <TokenAmountInputCard.DisplayPrice>
                  {usdAmount !== null && usdAmount > 0
                    ? formatUsdAmount(usdAmount)
                    : null}
                </TokenAmountInputCard.DisplayPrice>
              }
            />
          </div>
          <div className="w-full mt-4">
            <GiftMessageInput
              inputSlot={
                <GiftMessageInput.Input
                  id="gift-message"
                  name="message"
                  value={formValues.message}
                  onChange={(e) =>
                    formValuesRef.trigger.updateMessage({
                      value: e.target.value,
                    })
                  }
                  maxLength={MAX_MESSAGE_LENGTH}
                />
              }
              countSlot={
                formValues.message.length > 0 ? (
                  <GiftMessageInput.DisplayCount
                    count={MAX_MESSAGE_LENGTH - formValues.message.length}
                  />
                ) : null
              }
            />
          </div>
        </div>

        <AuthGate
          renderHostAppLink={renderHostAppLink}
          shouldRender={isLoggedIn}
        >
          <ButtonCustom
            type="submit"
            size="lg"
            variant={processing ? "secondary" : "primary"}
            isLoading={processing}
            disabled={balanceInsufficient || processing}
          >
            {getButtonText(balanceInsufficient, editing, processing)}
          </ButtonCustom>
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
