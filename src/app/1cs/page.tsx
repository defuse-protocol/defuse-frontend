"use client"
import {
  QuoteRequest,
  type QuoteResponse,
  type TokenResponse,
} from "@defuse-protocol/one-click-sdk-typescript"
import * as Accordion from "@radix-ui/react-accordion"
import {
  CaretDownIcon,
  CheckIcon,
  CopyIcon,
  MagicWandIcon,
  PersonIcon,
} from "@radix-ui/react-icons"
import {
  Button,
  Callout,
  Flex,
  IconButton,
  Spinner,
  TextField,
} from "@radix-ui/themes"
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
import { HAS_ACTIVE_DEPOSIT } from "@src/components/DefuseSDK/services/depositService"
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
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  type UseFormGetValues,
  type UseFormRegister,
  type UseFormSetValue,
  useFormContext,
} from "react-hook-form"
import { FieldComboInput } from "./FieldComboInput"
import { getBalance } from "./getBalance"

const SWAP_STRATEGIES = ["BEST", "ATOMIC", "STREAMING", "DCA"] as const

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

const DEBOUNCE_DELAY = 500

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
  const [slippageTolerance, setSlippageTolerance] = useState(3)
  const [quoteWaitingTimeSeconds, setQuoteWaitingTimeSeconds] = useState(3)
  const [deadline, setDeadline] = useState(() => {
    // Default to 5 minutes from now
    return dayjs().add(5, "minutes").format("YYYY-MM-DDTHH:mm")
  })
  const [swapStrategy, setSwapStrategy] =
    useState<(typeof SWAP_STRATEGIES)[number]>("BEST")
  const activeDeposit =
    state.chainType && tokenIn?.blockchain
      ? HAS_ACTIVE_DEPOSIT[state.chainType][tokenIn.blockchain]
      : false

  useEffect(() => {
    if (tokenList && (!tokenIn || !tokenOut)) {
      setTokenIn(
        tokenList.find((token) => token.assetId === initialTokenIn) ??
          tokenList[0]
      )
      setTokenOut(
        tokenList.find((token) => token.assetId === initialTokenOut) ??
          tokenList[1]
      )
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
    const { amountOut } = getValues()
    setValue("amountIn", amountOut)
    setValue("amountOut", "")
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

  const debouncedAmountIn = useDebounce(amountIn, DEBOUNCE_DELAY)
  const debouncedRecipient = useDebounce(recipient, DEBOUNCE_DELAY)
  const debouncedSlippageTolerance = useDebounce(
    slippageTolerance,
    DEBOUNCE_DELAY
  )
  const debouncedQuoteWaitingTimeSeconds = useDebounce(
    quoteWaitingTimeSeconds,
    DEBOUNCE_DELAY
  )

  const getQuoteArg = useMemo((): QuoteRequest => {
    const amount =
      debouncedAmountIn && tokenIn?.decimals
        ? parseUnits(debouncedAmountIn, tokenIn.decimals).toString()
        : "0"

    const deadlineISO = dayjs(deadline).toISOString()

    return {
      // @ts-expect-error - TODO: remove ts-expect-error when sdk is updated
      swapStrategy,
      dry: true,
      swapType: QuoteRequest.swapType.EXACT_INPUT,
      slippageTolerance: Math.round(debouncedSlippageTolerance * 100),
      quoteWaitingTimeMs: debouncedQuoteWaitingTimeSeconds * 1000,
      originAsset: tokenIn?.assetId ?? "",
      depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
      destinationAsset: tokenOut?.assetId ?? "",
      amount,
      refundTo: (activeDeposit ? userAddress : getValues("refundTo")) ?? "",
      refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
      recipient: debouncedRecipient ?? "",
      recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
      deadline: deadlineISO,
      referral,
    }
  }, [
    tokenIn,
    tokenOut,
    debouncedAmountIn,
    debouncedRecipient,
    debouncedSlippageTolerance,
    debouncedQuoteWaitingTimeSeconds,
    swapStrategy,
    userAddress,
    referral,
    getValues,
    activeDeposit,
    deadline,
  ])

  const quoteTimeError = useMemo(() => {
    if (quoteWaitingTimeSeconds === 0) {
      return "Quote waiting time must be greater than 0"
    }
    if (quoteWaitingTimeSeconds > 24) {
      return "Quote waiting time cannot exceed 24 seconds"
    }
    if (quoteWaitingTimeSeconds < 0) {
      return "Quote waiting time must be a positive number"
    }
    return null
  }, [quoteWaitingTimeSeconds])

  const slippageError = useMemo(() => {
    if (slippageTolerance === 0) {
      return "Slippage tolerance must be greater than 0"
    }
    if (slippageTolerance < 0) {
      return "Slippage tolerance must be a positive number"
    }
    return null
  }, [slippageTolerance])

  const deadlineError = useMemo(() => {
    const selectedDeadline = dayjs(deadline)
    const now = dayjs()

    if (selectedDeadline.isBefore(now) || selectedDeadline.isSame(now)) {
      return "Deadline must be in the future"
    }
    return null
  }, [deadline])

  const isRequestEnabled = !!(
    getQuoteArg.amount !== "0" &&
    getQuoteArg.originAsset &&
    getQuoteArg.destinationAsset &&
    getQuoteArg.refundTo &&
    getQuoteArg.recipient &&
    !quoteTimeError &&
    !slippageError &&
    !deadlineError
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
    staleTime: 1000,
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
    staleTime: 1000,
    retry: false,
    refetchOnWindowFocus: false,
  })

  // Determine which data to show based on user action
  const data = shouldExecuteSwap ? swapData : quoteData
  const isLoading = shouldExecuteSwap ? isSwapLoading : isQuoteLoading

  // Fetch balance for amountIn field
  const { data: balanceData } = useQuery({
    queryKey: ["balance", tokenIn?.assetId, userAddress],
    queryFn: async () => {
      if (!tokenIn || !userAddress) return null
      const balanceAmount = await getBalance(tokenIn, userAddress)
      if (balanceAmount === null) return null
      return {
        amount: balanceAmount,
        decimals: tokenIn.decimals,
      }
    },
    enabled: !!tokenIn && !!userAddress,
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Check if data contains an error response
  const hasError = data && "error" in data
  const currentError = hasError ? data : (swapError ?? quoteError)

  // Check if user has insufficient balance
  const hasInsufficientBalance = useMemo(() => {
    if (!balanceData || !debouncedAmountIn || !tokenIn?.decimals) return false

    try {
      const amountInBigInt = parseUnits(debouncedAmountIn, tokenIn.decimals)
      return balanceData.amount < amountInBigInt
    } catch {
      return false
    }
  }, [balanceData, debouncedAmountIn, tokenIn?.decimals])

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
              balance={balanceData ?? undefined}
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

            {!activeDeposit && (
              <AddressInput
                register={register}
                userAddress={userAddress}
                getValues={getValues}
                setValue={setValue}
                fieldName="refundTo"
                placeholder="Enter from wallet address"
              />
            )}

            <AddressInput
              register={register}
              userAddress={userAddress}
              getValues={getValues}
              setValue={setValue}
              fieldName="recipient"
              placeholder="Enter to wallet address"
            />

            <Settings
              swapStrategy={swapStrategy}
              setSwapStrategy={setSwapStrategy}
              slippageError={slippageError}
              setSlippageTolerance={setSlippageTolerance}
              quoteTimeError={quoteTimeError}
              setQuoteWaitingTimeSeconds={setQuoteWaitingTimeSeconds}
              deadline={deadline}
              setDeadline={setDeadline}
              deadlineError={deadlineError}
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
                  disabled={isSwapLoading || hasInsufficientBalance}
                  isLoading={isSwapLoading}
                >
                  {isSwapLoading
                    ? "Creating Swap..."
                    : hasInsufficientBalance
                      ? "Insufficient Balance"
                      : "Swap"}
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
            {data && !hasError && shouldExecuteSwap && tokenIn && (
              <DepositHint token={tokenIn} />
            )}
          </Form>
        </div>
      </Island>
    </Paper>
  )
}

function Settings({
  swapStrategy,
  setSwapStrategy,
  slippageError,
  setSlippageTolerance,
  quoteTimeError,
  setQuoteWaitingTimeSeconds,
  deadline,
  setDeadline,
  deadlineError,
}: {
  swapStrategy: string
  setSwapStrategy: Dispatch<
    SetStateAction<"BEST" | "ATOMIC" | "STREAMING" | "DCA">
  >
  slippageError: string | null
  setSlippageTolerance: Dispatch<SetStateAction<number>>
  quoteTimeError: string | null
  setQuoteWaitingTimeSeconds: Dispatch<SetStateAction<number>>
  deadline: string
  setDeadline: Dispatch<SetStateAction<string>>
  deadlineError: string | null
}) {
  return (
    <Accordion.Root type="single" collapsible className="mb-5">
      <Accordion.Item
        value="settings"
        className="border border-gray-4 rounded-lg"
      >
        <Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-11 hover:bg-gray-2 transition-colors rounded-lg data-[state=open]:rounded-b-none">
          <span>Settings</span>
          <CaretDownIcon className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
        </Accordion.Trigger>
        <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="px-4 pb-3 pt-2">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="swapStrategy"
                  className="text-xs font-medium text-gray-11"
                >
                  Swap Strategy
                </label>
                <select
                  id="swapStrategy"
                  value={swapStrategy}
                  onChange={(e) =>
                    setSwapStrategy(
                      e.target.value as (typeof SWAP_STRATEGIES)[number]
                    )
                  }
                  className="w-full px-3 py-2 rounded-md bg-gray-1 dark:bg-gray-2 border border-gray-4 dark:border-gray-6 text-gray-12 dark:text-gray-11 text-sm"
                >
                  {SWAP_STRATEGIES.map((strategy) => (
                    <option key={strategy} value={strategy}>
                      {strategy}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-10">
                  Choose the strategy for executing your swap.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="slippageTolerance"
                  className="text-xs font-medium text-gray-11 mt-2"
                >
                  Slippage Tolerance (%)
                </label>
                <TextField.Root
                  id="slippageTolerance"
                  type="number"
                  inputMode="decimal"
                  min="0.1"
                  step="0.1"
                  defaultValue="3"
                  className={`w-full [&>input]:!bg-gray-1 [&>input]:dark:!bg-gray-2 [&>input]:!border [&>input]:!border-gray-4 [&>input]:dark:!border-gray-6 [&>input]:!text-gray-12 [&>input]:dark:!text-gray-11 [&>input]:!rounded-md [&>input]:!px-3 [&>input]:!py-2 ${
                    slippageError
                      ? "[&>input]:!border-red-500 [&>input]:dark:!border-red-400"
                      : ""
                  }`}
                  onChange={(e) => {
                    setSlippageTolerance(Number.parseFloat(e.target.value) || 0)
                  }}
                />
                {slippageError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {slippageError}
                  </p>
                )}
                <p className="text-xs text-gray-10">
                  Your transaction will revert if the price changes unfavorably
                  by more than this percentage.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="quoteWaitingTimeSeconds"
                  className="text-xs font-medium text-gray-11 mt-2"
                >
                  Quote Waiting Time (seconds)
                </label>
                <TextField.Root
                  id="quoteWaitingTimeSeconds"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  max="24"
                  step="1"
                  defaultValue="3"
                  className={`w-full [&>input]:!bg-gray-1 [&>input]:dark:!bg-gray-2 [&>input]:!border [&>input]:!border-gray-4 [&>input]:dark:!border-gray-6 [&>input]:!text-gray-12 [&>input]:dark:!text-gray-11 [&>input]:!rounded-md [&>input]:!px-3 [&>input]:!py-2 ${
                    quoteTimeError
                      ? "[&>input]:!border-red-500 [&>input]:dark:!border-red-400"
                      : ""
                  }`}
                  onChange={(e) => {
                    setQuoteWaitingTimeSeconds(
                      Number.parseFloat(e.target.value) || 0
                    )
                  }}
                />
                {quoteTimeError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {quoteTimeError}
                  </p>
                )}
                <p className="text-xs text-gray-10">
                  The maximum time to wait for a quote before considering it
                  expired.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="deadline"
                  className="text-xs font-medium text-gray-11 mt-2"
                >
                  Deadline
                </label>
                <input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => {
                    const selectedDate = dayjs(e.target.value)
                    const now = dayjs()

                    if (selectedDate.isAfter(now)) {
                      setDeadline(e.target.value)
                    }
                  }}
                  min={dayjs().add(1, "minute").format("YYYY-MM-DDTHH:mm")}
                  className={`w-full px-3 py-2 rounded-md bg-gray-1 dark:bg-gray-2 border border-gray-4 dark:border-gray-6 text-gray-12 dark:text-gray-11 text-sm ${
                    deadlineError ? "!border-red-500 dark:!border-red-400" : ""
                  }`}
                />
                {deadlineError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {deadlineError}
                  </p>
                )}
                <p className="text-xs text-gray-10">
                  The deadline by which your swap must be completed. Only future
                  dates are allowed.
                </p>
              </div>
            </div>
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
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

function DepositHint({ token }: { token: TokenResponse }) {
  return (
    <div className="flex flex-col gap-4">
      <Callout.Root className="bg-warning px-3 py-2 text-warning-foreground">
        <Callout.Text className="text-xs">
          <span className="font-bold">
            Only deposit {token.symbol}
            {token.contractAddress ? ` (${token.contractAddress}) ` : ""}
            from the {token.blockchain} network.
          </span>{" "}
          <span>
            Depositing other assets or using a different network will result in
            loss of funds.
          </span>
        </Callout.Text>
      </Callout.Root>
    </div>
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
