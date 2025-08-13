"use client"
import {
  QuoteRequest,
  type QuoteResponse,
  type TokenResponse,
} from "@defuse-protocol/one-click-sdk-typescript"
import {
  CheckIcon,
  CopyIcon,
  MagicWandIcon,
  PersonIcon,
} from "@radix-ui/react-icons"
import { Button, Flex, IconButton, Spinner, TextField } from "@radix-ui/themes"
import { pairs } from "@src/app/(home)/_utils/useDeterminePair"
import { getQuote, getTokens } from "@src/app/1cs/1cs"
import { AuthGate } from "@src/components/DefuseSDK/components/AuthGate"
import { ButtonCustom } from "@src/components/DefuseSDK/components/Button/ButtonCustom"
import { ButtonSwitch } from "@src/components/DefuseSDK/components/Button/ButtonSwitch"
import { Form } from "@src/components/DefuseSDK/components/Form"
import { Copy } from "@src/components/DefuseSDK/components/IntentCard/CopyButton"
import { Island } from "@src/components/DefuseSDK/components/Island"
import { ModalContainer } from "@src/components/DefuseSDK/components/Modal/ModalContainer"
import type { ModalSelectTokenPayload } from "@src/components/DefuseSDK/components/Modal/ModalSelectToken"
import { TradeNavigationLinks } from "@src/components/DefuseSDK/components/TradeNavigationLinks"
import { SWAP_TOKEN_FLAGS } from "@src/components/DefuseSDK/constants/swap"
import { SwapFormProvider } from "@src/components/DefuseSDK/features/swap/components/SwapFormProvider"
import { SwapPriceImpact } from "@src/components/DefuseSDK/features/swap/components/SwapPriceImpact"
import { truncateUserAddress } from "@src/components/DefuseSDK/features/withdraw/components/WithdrawForm/utils"
import {
  ModalStoreProvider,
  useModalStore,
} from "@src/components/DefuseSDK/providers/ModalStoreProvider"
import { ModalType } from "@src/components/DefuseSDK/stores/modalStore"
import { parseUnits } from "@src/components/DefuseSDK/utils/parse"
import { Loading } from "@src/components/Loading"
import Paper from "@src/components/Paper"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useDebounce } from "@src/hooks/useDebounce"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import { renderAppLink } from "@src/utils/renderAppLink"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { QRCodeSVG } from "qrcode.react"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
  type UseFormGetValues,
  type UseFormRegister,
  type UseFormSetValue,
  useFormContext,
} from "react-hook-form"
import { FieldComboInput } from "./FieldComboInput"

export default function SwapPage() {
  return (
    <ModalStoreProvider>
      <SwapFormProvider>
        <Swap />
        <ModalContainer />
      </SwapFormProvider>
    </ModalStoreProvider>
  )
}

type SwapFormValues = {
  amountIn: string
  amountOut: string
  recipient: string
  refundTo: string
}

function Swap() {
  const referral = useIntentsReferral()
  const { state } = useConnectWallet()
  const userAddress = state.address

  const { data: tokenList } = useQuery({
    queryKey: ["1click-tokens"],
    queryFn: () => getTokens(),
    refetchOnMount: true,
    retry: false,
  })

  const { whitelabelTemplate } = useContext(FeatureFlagsContext)
  const [initialTokenIn, initialTokenOut] = pairs[whitelabelTemplate]

  const [tokenIn, setTokenIn] = useState<TokenResponse | undefined>(undefined)
  const [tokenOut, setTokenOut] = useState<TokenResponse | undefined>(undefined)

  useEffect(() => {
    if (tokenList && (!tokenIn || !tokenOut)) {
      setTokenIn(tokenList.find((token) => token.assetId === initialTokenIn))
      setTokenOut(tokenList.find((token) => token.assetId === initialTokenOut))
    }
  }, [tokenList, initialTokenIn, initialTokenOut, tokenIn, tokenOut])

  const {
    handleSubmit,
    register,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<SwapFormValues>()

  const switchTokens = useCallback(() => {
    const { amountIn, amountOut } = getValues()
    setValue("amountIn", amountOut)
    setValue("amountOut", amountIn)
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
  }, [tokenIn, tokenOut, getValues, setValue])

  const { setModalType, payload, onCloseModal } = useModalStore(
    (state) => state
  )

  const openModalSelectAssets = (
    fieldName: "tokenIn" | "tokenOut",
    token: TokenResponse | undefined
  ) => {
    setModalType(ModalType.MODAL_SELECT_TOKEN, {
      ...(payload as ModalSelectTokenPayload),
      fieldName,
      [fieldName]: token,
      tokens: tokenList,
      onConfirm(payload) {
        const token = payload[fieldName]
        if (fieldName === SWAP_TOKEN_FLAGS.IN) {
          if (token === tokenOut) {
            setTokenOut(tokenIn)
          }
          setTokenIn(token)
        } else if (fieldName === SWAP_TOKEN_FLAGS.OUT) {
          if (token === tokenIn) {
            setTokenIn(tokenOut)
          }
          setTokenOut(token)
        }
        onCloseModal()
      },
    } satisfies ModalSelectTokenPayload)
  }

  const { watch } = useFormContext<SwapFormValues>()
  const amountIn = watch("amountIn")
  const recipient = watch("recipient")

  const debouncedAmountIn = useDebounce(amountIn, 500)
  const debouncedRecipient = useDebounce(recipient, 500)

  const getQuoteArg = useMemo((): QuoteRequest => {
    const amount =
      debouncedAmountIn && tokenIn?.decimals
        ? parseUnits(debouncedAmountIn, tokenIn.decimals).toString()
        : "0"

    const deadline = dayjs().add(1, "day").toISOString()

    return {
      dry: true,
      swapType: QuoteRequest.swapType.EXACT_INPUT,
      slippageTolerance: 100, // 1%
      originAsset: tokenIn?.assetId ?? "",
      depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
      destinationAsset: tokenOut?.assetId ?? "",
      amount,
      refundTo: userAddress ?? "",
      refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
      recipient: debouncedRecipient ?? "",
      recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
      deadline,
      referral,
    }
  }, [
    tokenIn,
    tokenOut,
    debouncedAmountIn,
    debouncedRecipient,
    userAddress,
    referral,
  ])

  const isRequestEnabled = !!(
    getQuoteArg.amount !== "0" &&
    getQuoteArg.originAsset &&
    getQuoteArg.destinationAsset &&
    getQuoteArg.refundTo &&
    getQuoteArg.recipient
  )

  const [shouldExecuteSwap, setShouldExecuteSwap] = useState(false)

  const onSubmit = useCallback(() => {
    setShouldExecuteSwap(true)
  }, [])

  useEffect(() => {
    if (amountIn && recipient) {
      setShouldExecuteSwap(false)
    }
  }, [amountIn, recipient])

  const {
    data: quoteData,
    isLoading: isQuoteLoading,
    error: quoteError,
  } = useQuery({
    queryKey: ["quote", getQuoteArg],
    queryFn: () => {
      return getQuote(getQuoteArg)
    },
    enabled: !shouldExecuteSwap && isRequestEnabled,
    staleTime: 1000, // 1 second
    retry: false,
  })

  const {
    data: swapData,
    isLoading: isSwapLoading,
    error: swapError,
  } = useQuery({
    queryKey: ["swap", getQuoteArg, shouldExecuteSwap],
    queryFn: () => getQuote({ ...getQuoteArg, dry: false }),
    enabled: shouldExecuteSwap && isRequestEnabled,
    staleTime: 1000, // 1 second
    retry: false,
    refetchOnWindowFocus: false,
  })

  // Determine which data to show based on user action
  const data = shouldExecuteSwap ? swapData : quoteData
  const isLoading = shouldExecuteSwap ? isSwapLoading : isQuoteLoading

  // Check if data contains an error response
  const hasError = data && "error" in data
  const currentError = hasError ? data : (swapError ?? quoteError)

  // Update amountOut when data changes
  useEffect(() => {
    if (data && !hasError && data.quote?.amountOutFormatted) {
      setValue("amountOut", data.quote.amountOutFormatted, {
        shouldValidate: true,
      })
    }
  }, [data, hasError, setValue])

  if (!tokenList) {
    return <Loading />
  }

  return (
    <Paper>
      <Island className="widget-container flex flex-col gap-5">
        <TradeNavigationLinks
          currentRoute="swap"
          renderHostAppLink={renderAppLink}
        />

        <div className="flex flex-col">
          <Form<SwapFormValues>
            handleSubmit={handleSubmit(onSubmit)}
            register={register}
          >
            <FieldComboInput<SwapFormValues>
              fieldName="amountIn"
              selected={tokenIn}
              handleSelect={() => {
                openModalSelectAssets(SWAP_TOKEN_FLAGS.IN, tokenIn)
              }}
              className="border border-gray-4 rounded-t-xl"
              required
              errors={errors}
              usdAmount={
                data && !hasError && data.quote?.amountInUsd
                  ? `~$${data.quote.amountInUsd}`
                  : undefined
              }
            />

            <div className="relative w-full">
              <ButtonSwitch onClick={switchTokens} />
            </div>

            <FieldComboInput<SwapFormValues>
              fieldName="amountOut"
              selected={tokenOut}
              handleSelect={() => {
                openModalSelectAssets(SWAP_TOKEN_FLAGS.OUT, tokenOut)
              }}
              className="border border-gray-4 rounded-b-xl mb-5"
              errors={errors}
              disabled={true}
              isLoading={isLoading}
              usdAmount={
                data && !hasError && data.quote?.amountOutUsd
                  ? `~$${data.quote.amountOutUsd}`
                  : undefined
              }
            />

            <AddressInput
              register={register}
              userAddress={userAddress}
              getValues={getValues}
              setValue={setValue}
              fieldName="refundTo"
              placeholder="Enter from wallet address"
            />

            <AddressInput
              register={register}
              userAddress={userAddress}
              getValues={getValues}
              setValue={setValue}
              fieldName="recipient"
              placeholder="Enter to wallet address"
            />

            {currentError && (
              <div className="mb-5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
                <p className="font-medium">Error:</p>
                <p>
                  {hasError && "error" in currentError
                    ? currentError.error
                    : (currentError as Error).message || "An error occurred"}
                </p>
              </div>
            )}

            <Flex align="stretch" direction="column">
              <AuthGate
                renderHostAppLink={renderAppLink}
                shouldRender={state.isVerified}
              >
                <ButtonCustom
                  type="submit"
                  size="lg"
                  fullWidth
                  disabled={isSwapLoading}
                  isLoading={isSwapLoading}
                >
                  {isSwapLoading ? "Creating Swap..." : "Swap"}
                </ButtonCustom>
              </AuthGate>
            </Flex>

            <div className="mt-5">
              <SwapPriceImpact
                amountIn={
                  data && !hasError && data.quote?.amountInUsd
                    ? Number(data.quote.amountInUsd)
                    : null
                }
                amountOut={
                  data && !hasError && data.quote?.amountOutUsd
                    ? Number(data.quote.amountOutUsd)
                    : null
                }
              />
            </div>
            {data && !hasError && shouldExecuteSwap && <QR data={data} />}
          </Form>
        </div>
      </Island>
    </Paper>
  )
}
function QR({ data }: { data: QuoteResponse }) {
  return (
    <>
      <div className="font-bold text-label text-sm">
        Send tokens to this deposit address
      </div>

      <div className="mt-1 text-sm">
        <a
          href={`https://explorer.near-intents.org/transactions/${data.quote.depositAddress}`}
          rel="noopener noreferrer"
          target="_blank"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
        >
          Check transaction progress on explorer
        </a>
      </div>

      <div className="my-6 flex items-center justify-center">
        <div className="flex size-36 items-center justify-center rounded-lg border border-border p-2">
          {data.quote?.depositAddress != null ? (
            <QRCodeSVG value={data.quote.depositAddress} />
          ) : (
            <Spinner loading={true} />
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center rounded-lg bg-gray-3 px-4 py-2">
        <div className="flex flex-1 justify-center">
          <span className="relative">
            {/* Visible truncated address */}
            <span className="pointer-events-none font-medium font-mono text-label text-sm">
              {truncateUserAddress(data.quote.depositAddress ?? "")}
            </span>

            {/* Hidden full address for copy functionality */}
            <input
              type="text"
              value={data.quote.depositAddress ?? ""}
              readOnly
              style={{
                // It's easier to make the input transparent using CSS instead of Tailwind
                all: "unset",
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                color: "transparent",
                outline: "none",
              }}
            />
          </span>
        </div>

        <div className="shrink-0">
          <Copy text={data.quote.depositAddress ?? ""}>
            {(copied) => (
              <Button
                type="button"
                size="4"
                variant="solid"
                className="box-border size-8 p-0"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </Button>
            )}
          </Copy>
        </div>
      </div>
    </>
  )
}

function AddressInput({
  register,
  userAddress,
  getValues,
  setValue,
  fieldName,
  placeholder,
}: {
  register: UseFormRegister<SwapFormValues>
  userAddress: string | undefined
  getValues: UseFormGetValues<SwapFormValues>
  setValue: UseFormSetValue<SwapFormValues>
  fieldName: "recipient" | "refundTo"
  placeholder: string
}) {
  return (
    <div className="flex gap-2">
      <TextField.Root
        size="3"
        className="mb-5 flex-grow"
        {...register(fieldName, {
          validate: {
            // TODO: add validation
            // pattern: (value) => {
            //   const error = validateAddressSoft(
            //     value,
            //     tokenOut?.blockchain ?? "",
            //     userAddress ?? "",
            //     chainType
            //   )
            //   return error ? error : true
            // },
          },
        })}
        placeholder={placeholder}
      >
        <TextField.Slot>
          <PersonIcon height="16" width="16" />
        </TextField.Slot>
      </TextField.Root>

      {userAddress !== undefined && getValues(fieldName) !== userAddress && (
        <IconButton
          type="button"
          onClick={() => {
            setValue(fieldName, userAddress, {
              shouldValidate: true,
            })
          }}
          variant="outline"
          size="3"
          title={`Autofill with your address ${truncateUserAddress(
            userAddress
          )}`}
          aria-label={`Autofill with your address ${truncateUserAddress(
            userAddress
          )}`}
        >
          <MagicWandIcon />
        </IconButton>
      )}
    </div>
  )
}
