import type { authHandle } from "@defuse-protocol/internal-utils"
import Alert from "@src/components/Alert"
import Button from "@src/components/Button"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { useActorRef, useSelector } from "@xstate/react"
import { useCallback, useEffect, useMemo } from "react"
import type { ActorRefFrom, PromiseActorLogic } from "xstate"
import { AuthGate } from "../../../components/AuthGate"
import type { ModalSelectAssetsPayload } from "../../../components/Modal/ModalSelectAssets"
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
import { useGiftUsdMode } from "../hooks/useGiftUsdMode"
import type {
  CreateGiftIntent,
  GenerateLink,
  SignMessage,
} from "../types/sharedTypes"
import { checkInsufficientBalance, getButtonText } from "../utils/makerForm"
import { GiftMakerReadyDialog } from "./GiftMakerReadyDialog"
import { GiftMessageInput } from "./GiftMessageInput"

export type GiftMakerWidgetProps = {
  tokenList: TokenInfo[]
  userAddress: authHandle.AuthHandle["identifier"] | undefined
  chainType: authHandle.AuthHandle["method"] | undefined
  initialToken?: TokenInfo
  signMessage: SignMessage
  sendNearTransaction: SendNearTransaction
  createGiftIntent: CreateGiftIntent
  generateLink: GenerateLink
  theme?: "dark" | "light"
  referral?: string
  renderHostAppLink: RenderHostAppLink
  onSuccess?: () => void
}

const MAX_MESSAGE_LENGTH = 500

export function GiftMakerForm({
  tokenList,
  userAddress,
  chainType,
  initialToken,
  signMessage,
  sendNearTransaction,
  generateLink,
  referral,
  renderHostAppLink,
  createGiftIntent,
  onSuccess,
}: GiftMakerWidgetProps) {
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

  const depositedBalanceRef = useSelector(
    rootActorRef,
    (s) => s.context.depositedBalanceRef
  )
  const { tokenBalance } = useSelector(
    depositedBalanceRef,
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

  const handleAmountChange = useCallback(
    (value: string) => {
      formValuesRef.trigger.updateAmount({ value })
    },
    [formValuesRef]
  )

  const {
    isUsdMode,
    usdValue,
    tokenPrice,
    handleToggle: handleToggleUsdMode,
    handleUsdInputChange,
    setTokenAmount,
  } = useGiftUsdMode({
    token: formValues.token,
    tokenAmount: formValues.amount,
    tokensUsdPriceData,
    onAmountChange: handleAmountChange,
  })

  const canToggleUsd = tokenPrice != null && tokenPrice > 0

  const { setModalType, payload } = useModalStore((state) => state)

  const openModalSelectAssets = (
    fieldName: string,
    token: TokenInfo | undefined
  ) => {
    setModalType(ModalType.MODAL_SELECT_ASSETS, {
      ...(payload as ModalSelectAssetsPayload),
      fieldName,
      [fieldName]: token,
      isHoldingsEnabled: true,
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

  const amountEmpty = useMemo(() => {
    const amount = formValues.amount.trim()
    if (!amount) return true
    const num = Number.parseFloat(amount.replace(",", "."))
    return Number.isNaN(num) || num <= 0
  }, [formValues.amount])

  const editing = rootSnapshot.matches("editing")
  const processing =
    rootSnapshot.matches("signing") ||
    rootSnapshot.matches("saving") ||
    rootSnapshot.matches("publishing") ||
    rootSnapshot.matches("updating") ||
    rootSnapshot.matches("settling") ||
    rootSnapshot.matches("removing")

  const error = rootSnapshot.context.error

  const signRef = useSelector(
    rootActorRef,
    (state) =>
      state.children.signRef as
        | undefined
        | ActorRefFrom<typeof giftMakerSignActor>
  )

  const innerSignRef = useSelector(signRef, (state) => {
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
  })

  const publicKeyVerifierRef = useSelector(innerSignRef, (state) => {
    if (state) {
      return (
        state as unknown as {
          children: {
            publicKeyVerifierRef: ActorRefFrom<typeof publicKeyVerifierMachine>
          }
        }
      ).children.publicKeyVerifierRef
    }
  })

  usePublicKeyModalOpener(publicKeyVerifierRef, sendNearTransaction)

  const handleSetMaxValue = () => {
    if (tokenBalance != null) {
      setTokenAmount(
        formatTokenValue(tokenBalance.amount, tokenBalance.decimals, {
          fractionDigits: 6,
        })
      )
    }
  }

  return (
    <>
      {rootSnapshot.matches("settled") &&
        readyGiftRef != null &&
        signerCredentials != null && (
          <GiftMakerReadyDialog
            readyGiftRef={readyGiftRef}
            generateLink={generateLink}
            signerCredentials={signerCredentials}
            onClose={onSuccess}
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
      >
        <TokenInputCard
          balance={tokenBalance?.amount ?? 0n}
          decimals={tokenBalance?.decimals ?? 0}
          symbol={formValues.token?.symbol ?? ""}
          usdAmount={usdAmount}
          loading={processing}
          selectedToken={formValues.token ?? undefined}
          tokens={tokenList}
          handleSetMax={handleSetMaxValue}
          handleSelectToken={() =>
            openModalSelectAssets("token", formValues.token)
          }
          onToggleUsdMode={canToggleUsd ? handleToggleUsdMode : undefined}
          isUsdMode={isUsdMode}
          tokenPrice={tokenPrice}
          tokenAmount={formValues.amount}
          registration={{
            name: "amount",
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              if (isUsdMode) {
                handleUsdInputChange(e.target.value)
              } else {
                formValuesRef.trigger.updateAmount({
                  value: e.target.value,
                })
              }
            },
            value: isUsdMode ? usdValue : formValues.amount,
          }}
        />

        <GiftMessageInput
          name="message"
          value={formValues.message}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(e) =>
            formValuesRef.trigger.updateMessage({
              value: e.target.value,
            })
          }
        />

        <AuthGate
          renderHostAppLink={renderHostAppLink}
          shouldRender={isLoggedIn}
        >
          <Button
            type="submit"
            size="xl"
            variant="primary"
            className="mt-5"
            fullWidth
            loading={processing}
            disabled={amountEmpty || balanceInsufficient || processing}
          >
            {getButtonText(
              balanceInsufficient,
              editing,
              processing,
              amountEmpty
            )}
          </Button>
        </AuthGate>
      </form>

      {error != null && (
        <Alert variant="error" className="mt-2">
          {error.reason}
        </Alert>
      )}
    </>
  )
}
