"use client"
import { parseUnits } from "ethers"
import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { type FieldValues, useForm } from "react-hook-form"
import { v4 } from "uuid"

import {
  balanceToBignumberString,
  balanceToDecimal,
} from "@src/app/(home)/SwapForm/service/balanceTo"
import { getBalanceNearAllowedToSwap } from "@src/app/(home)/SwapForm/service/getBalanceNearAllowedToSwap"
import isWalletConnected from "@src/app/(home)/SwapForm/utils/isWalletConnected"
import BlockEvaluatePrice from "@src/components/Block/BlockEvaluatePrice"
import Button from "@src/components/Button/Button"
import ButtonSwitch from "@src/components/Button/ButtonSwitch"
import Form from "@src/components/Form"
import FieldComboInput from "@src/components/Form/FieldComboInput"
import type { ModalConfirmSwapPayload } from "@src/components/Modal/ModalConfirmSwap"
import type {
  ModalSelectAssetsPayload,
  TokenListWithNotSelectableToken,
} from "@src/components/Modal/ModalSelectAssets"
import { CONFIRM_SWAP_LOCAL_KEY } from "@src/constants/contracts"
import { NEAR_TOKEN_META } from "@src/constants/tokens"
import { useCalculateTokenToUsd } from "@src/hooks/useCalculateTokenToUsd"
import { SignInType, useConnectWallet } from "@src/hooks/useConnectWallet"
import { useModalSearchParams } from "@src/hooks/useModalSearchParams"
import useSwapEstimateBot from "@src/hooks/useSwapEstimateBot"
import { useModalStore } from "@src/providers/ModalStoreProvider"
import { useNotificationStore } from "@src/providers/NotificationProvider"
import { useTokensStore } from "@src/providers/TokensStoreProvider"
import { useWalletSelector } from "@src/providers/WalletSelectorProvider"
import { ModalType } from "@src/stores/modalStore"
import { NotificationType } from "@src/stores/notificationStore"
import type {
  NetworkToken,
  NetworkTokenWithSwapRoute,
} from "@src/types/interfaces"
import { debouncePromise } from "@src/utils/debouncePromise"
import { tieNativeToWrapToken } from "@src/utils/tokenList"

import WarnBox from "../WarnBox"

import {
  type EvaluateResultEnum,
  getEvaluateSwapEstimate,
} from "./service/evaluateSwap"
import isForeignChainSwap from "./utils/isForeignChainSwap"
import isSameToken from "./utils/isSameToken"

type FormValues = {
  tokenIn: string
  tokenOut: string
}

type SelectToken = NetworkToken | undefined

type EstimateSwap = {
  tokenIn: string
  name: string
  selectTokenIn: SelectToken
  selectTokenOut: SelectToken
}

enum ErrorEnum {
  INSUFFICIENT_BALANCE = "Insufficient Balance",
  NO_QUOTES = "No Quotes",
  EXCEEDED_NEAR_PER_BYTE_USE = "Not enough Near in wallet for gas fee",
}

const ESTIMATE_BOT_AWAIT_MS = 500

export default function Swap() {
  const [selectTokenIn, setSelectTokenIn] =
    useState<NetworkTokenWithSwapRoute>()
  const [selectTokenOut, setSelectTokenOut] =
    useState<NetworkTokenWithSwapRoute>()
  const [errorSelectTokenIn, setErrorSelectTokenIn] = useState("")
  const [errorSelectTokenOut, setErrorSelectTokenOut] = useState("")
  const { accountId } = useWalletSelector()
  const {
    priceToUsd: priceToUsdTokenIn,
    calculateTokenToUsd: calculateTokenToUsdTokenIn,
  } = useCalculateTokenToUsd()
  const {
    priceToUsd: priceToUsdTokenOut,
    calculateTokenToUsd: calculateTokenToUsdTokenOut,
  } = useCalculateTokenToUsd()
  const { data, isLoading } = useTokensStore((state) => state)
  const { signIn } = useConnectWallet()
  const [priceEvaluation, setPriceEvaluation] =
    useState<EvaluateResultEnum | null>(null)
  const {
    handleSubmit,
    register,
    watch,
    setValue,
    getValues,
    trigger,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({ reValidateMode: "onSubmit" })
  const { setModalType, payload, onCloseModal } = useModalStore(
    (state) => state
  )
  const { bestEstimate, allEstimates, getSwapEstimateBot } =
    useSwapEstimateBot()
  const isProgrammaticUpdate = useRef(false)
  const lastInputValue = useRef("")
  useModalSearchParams()
  const [errorMsg, setErrorMsg] = useState<ErrorEnum>()
  const [isFetchingData, setIsFetchingData] = useState(false)
  const allowableNearAmountRef = useRef<null | string>(null)
  const { setNotification } = useNotificationStore((state) => state)

  const onSubmit = async (values: FieldValues) => {
    if (errorMsg) {
      return
    }
    if (!accountId) {
      return signIn({ id: SignInType.NearWalletSelector })
    }
    let hasUnsetTokens = false
    if (!selectTokenIn) {
      hasUnsetTokens = true
      setErrorSelectTokenIn("Select token is required")
    }
    if (!selectTokenOut) {
      hasUnsetTokens = true
      setErrorSelectTokenOut("Select token is required")
    }

    if (hasUnsetTokens) return

    const accountTo = isWalletConnected(
      selectTokenOut?.defuse_asset_id as string
    )

    const modalType =
      isForeignChainSwap(
        selectTokenIn?.defuse_asset_id as string,
        selectTokenOut?.defuse_asset_id as string
      ) && !accountTo
        ? ModalType.MODAL_CONNECT_NETWORKS
        : ModalType.MODAL_REVIEW_SWAP

    const modalPayload = {
      tokenIn: balanceToBignumberString(
        values.tokenIn,
        selectTokenIn?.decimals ?? 0
      ),
      tokenOut: balanceToBignumberString(
        values.tokenOut,
        selectTokenOut?.decimals ?? 0
      ),
      selectedTokenIn: selectTokenIn,
      selectedTokenOut: selectTokenOut,
      solverId: bestEstimate?.solver_id || "",
      accountTo,
    }

    setModalType(modalType, modalPayload)
  }

  const handleSwitch = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (isFetchingData) {
      return
    }
    setErrorMsg(undefined)
    setPriceEvaluation(null)
    const tempTokenInCopy = Object.assign({}, selectTokenIn)

    if (!selectTokenOut?.routes?.length) {
      setNotification({
        id: v4(),
        message: "This switch not available!",
        type: NotificationType.ERROR,
      })
      return
    }

    setSelectTokenIn(selectTokenOut)
    setSelectTokenOut(tempTokenInCopy)

    const valueTokenIn = getValues("tokenIn")
    const valueTokenOut = getValues("tokenOut")
    setValue("tokenOut", valueTokenIn)
    setValue("tokenIn", valueTokenOut)
  }

  const handleSelect = (fieldName: string, selectToken: SelectToken) => {
    setModalType(ModalType.MODAL_SELECT_ASSETS, { fieldName, selectToken })
  }

  const debouncedGetSwapEstimateBot = useCallback(
    debouncePromise(
      async (data: { tokenIn: string; tokenOut: string; amountIn: string }) =>
        getSwapEstimateBot(data),
      ESTIMATE_BOT_AWAIT_MS
    ),
    []
  )

  const handleEstimateSwap = async ({
    tokenIn,
    name,
    selectTokenIn,
    selectTokenOut,
  }: EstimateSwap): Promise<void> => {
    try {
      setErrorMsg(undefined)
      setPriceEvaluation(null)
      allowableNearAmountRef.current = null
      clearErrors()
      lastInputValue.current = tokenIn

      // Check for empty input
      if (
        (name === "tokenIn" && !tokenIn) ||
        !selectTokenIn ||
        !selectTokenOut
      ) {
        isProgrammaticUpdate.current = true
        setValue("tokenOut", "")
        setIsFetchingData(false)
        return
      }

      const parsedTokenInBigNumber = BigInt(
        balanceToBignumberString(tokenIn, selectTokenIn?.decimals ?? 0)
      )
      const balanceTokenInBigNumber = BigInt(selectTokenIn?.balance ?? "0")

      if (
        selectTokenIn.defuse_asset_id === NEAR_TOKEN_META.defuse_asset_id &&
        accountId
      ) {
        const balanceAllowed = await getBalanceNearAllowedToSwap(accountId)
        const balanceAllowedBigNumber = BigInt(balanceAllowed)
        if (parsedTokenInBigNumber > balanceAllowedBigNumber) {
          setErrorMsg(ErrorEnum.EXCEEDED_NEAR_PER_BYTE_USE)
          allowableNearAmountRef.current = balanceAllowedBigNumber.toString()
        }
      }

      if (parsedTokenInBigNumber > balanceTokenInBigNumber) {
        setErrorMsg(ErrorEnum.INSUFFICIENT_BALANCE)
      }

      setIsFetchingData(true)
      const { bestEstimate } = await debouncedGetSwapEstimateBot({
        tokenIn: selectTokenIn.defuse_asset_id,
        tokenOut: selectTokenOut.defuse_asset_id,
        amountIn: parseUnits(tokenIn, selectTokenIn?.decimals ?? 0).toString(),
      })

      if (lastInputValue.current === tokenIn) {
        // no estimate available
        if (bestEstimate === null) {
          isProgrammaticUpdate.current = true
          setValue("tokenOut", "")
          setErrorMsg(ErrorEnum.NO_QUOTES)
          setIsFetchingData(false)
          return
        }
        getEvaluateSwapEstimate(
          selectTokenIn,
          selectTokenOut,
          tokenIn,
          bestEstimate.amount_out
        )
          .then(({ refFinance }) => {
            if (lastInputValue.current === tokenIn) {
              setPriceEvaluation(refFinance)
            }
          })
          .catch((e) => {
            console.error(e)
          })
        isProgrammaticUpdate.current = true
        const formattedOut =
          bestEstimate.amount_out !== null
            ? balanceToDecimal(bestEstimate.amount_out, selectTokenOut.decimals)
            : "0"
        setValue("tokenOut", formattedOut)
        trigger("tokenOut")

        setIsFetchingData(false)
      }
    } catch (e) {
      console.error(e)
      setIsFetchingData(false)
    }
  }

  const handleHashTokenSelections = (
    selectedTokenIn: NetworkTokenWithSwapRoute,
    selectedTokenOut: NetworkTokenWithSwapRoute
  ) => {
    localStorage.setItem(
      CONFIRM_SWAP_LOCAL_KEY,
      JSON.stringify({
        data: {
          selectedTokenIn,
          selectedTokenOut,
          tokenIn: "0",
          tokenOut: "0",
          estimateQueue: [],
        },
      })
    )
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <reason>
  useEffect(() => {
    if (!selectTokenIn && !selectTokenOut) {
      const getConfirmSwapFromLocal = localStorage.getItem(
        CONFIRM_SWAP_LOCAL_KEY
      )
      if (getConfirmSwapFromLocal) {
        const parsedData: { data: ModalConfirmSwapPayload } = JSON.parse(
          getConfirmSwapFromLocal
        )
        const cleanBalance = {
          balance: "0",
          balanceUsd: 0,
          convertedLast: undefined,
        }
        setSelectTokenIn(
          Object.assign(parsedData.data.selectedTokenIn, cleanBalance)
        )
        setSelectTokenOut(
          Object.assign(parsedData.data.selectedTokenOut, cleanBalance)
        )
        return
      }
      if (data.size) {
        for (const token of data.values()) {
          if (token.address === "near") {
            setSelectTokenIn(token)
          }
          if (token.address === "usdt") {
            setSelectTokenOut(token)
          }
        }
        return
      }
    }
    // Do evaluate usd select tokens prices
    if (data.size && !isLoading) {
      const getAssetList: TokenListWithNotSelectableToken[] = []
      for (const value of data.values()) {
        getAssetList.push(value)
      }
      const tieNativeToWrapAssetList = tieNativeToWrapToken(getAssetList)
      for (const token of tieNativeToWrapAssetList) {
        if (selectTokenIn?.defuse_asset_id === token.defuse_asset_id) {
          setSelectTokenIn(token)
        }
        if (selectTokenOut?.defuse_asset_id === token.defuse_asset_id) {
          setSelectTokenOut(token)
        }
      }
    }
  }, [data, isLoading])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <reason>
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (isProgrammaticUpdate.current) {
        isProgrammaticUpdate.current = false
        return
      }
      handleEstimateSwap({
        tokenIn: String(value.tokenIn),
        name: name as string,
        selectTokenIn,
        selectTokenOut,
      })
    })
    return () => subscription.unsubscribe()
  }, [watch, selectTokenIn, selectTokenOut])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <reason>
  useEffect(() => {
    // Use to calculate when selectTokenIn or selectTokenOut is changed
    const valueTokenIn = getValues("tokenIn")
    const valueTokenOut = getValues("tokenOut")
    calculateTokenToUsdTokenIn(valueTokenIn, selectTokenIn)
    calculateTokenToUsdTokenOut(valueTokenOut, selectTokenOut)

    // Use watch to calculate when input is changed
    const subscription = watch((value) => {
      calculateTokenToUsdTokenIn(value.tokenIn as string, selectTokenIn)
      calculateTokenToUsdTokenOut(value.tokenOut as string, selectTokenOut)
    })
    return () => subscription.unsubscribe()
  }, [watch, selectTokenIn, selectTokenOut])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <reason>
  useEffect(() => {
    if (
      (payload as ModalSelectAssetsPayload)?.modalType !==
      ModalType.MODAL_SELECT_ASSETS
    ) {
      return
    }
    const { modalType, fieldName, token } = payload as ModalSelectAssetsPayload
    if (modalType === ModalType.MODAL_SELECT_ASSETS && fieldName && token) {
      switch (fieldName) {
        case "tokenIn": {
          setSelectTokenIn(token)
          const isSelectTokenOutReset = isSameToken(
            token,
            selectTokenOut as NetworkToken
          )

          if (isSelectTokenOutReset) {
            setSelectTokenOut(undefined)
            setValue("tokenOut", "")
          } else {
            handleEstimateSwap({
              tokenIn: getValues("tokenIn"),
              name: "tokenIn",
              selectTokenIn: token,
              selectTokenOut,
            })
            handleHashTokenSelections(token, selectTokenOut as NetworkToken)
          }
          isProgrammaticUpdate.current = false
          setErrorSelectTokenIn("")
          break
        }
        case "tokenOut": {
          setSelectTokenOut(token)
          const isSelectTokenInReset = isSameToken(
            token,
            selectTokenIn as NetworkToken
          )
          if (isSelectTokenInReset) {
            setSelectTokenIn(undefined)
            setValue("tokenIn", "")
          } else {
            handleEstimateSwap({
              tokenIn: getValues("tokenIn"),
              name: "tokenIn",
              selectTokenIn,
              selectTokenOut: token,
            })
            handleHashTokenSelections(
              selectTokenIn as NetworkTokenWithSwapRoute,
              token
            )
          }
          isProgrammaticUpdate.current = false
          setErrorSelectTokenOut("")
          break
        }
      }
      onCloseModal(undefined)
    }
  }, [payload, selectTokenIn, selectTokenOut])

  return (
    <Form<FormValues> handleSubmit={handleSubmit(onSubmit)} register={register}>
      <FieldComboInput<FormValues>
        fieldName="tokenIn"
        price={priceToUsdTokenIn}
        balance={balanceToDecimal(
          selectTokenIn?.balance ?? "0",
          selectTokenIn?.decimals ?? 0
        )}
        selected={selectTokenIn as NetworkToken}
        handleSelect={() => handleSelect("tokenIn", selectTokenOut)}
        handleSetMaxValue={() => {
          const value = balanceToDecimal(
            selectTokenIn?.balance ?? "0",
            selectTokenIn?.decimals ?? 0
          )
          setValue("tokenIn", value)
        }}
        className="border rounded-t-xl md:max-w-[472px]"
        required="This field is required"
        errors={errors}
        errorSelect={errorSelectTokenIn}
      />
      <div className="relative w-full">
        <ButtonSwitch onClick={handleSwitch} />
      </div>
      <FieldComboInput<FormValues>
        fieldName="tokenOut"
        price={priceToUsdTokenOut}
        label={
          <BlockEvaluatePrice
            priceEvaluation={priceEvaluation}
            priceResults={allEstimates}
            tokenOut={selectTokenOut}
          />
        }
        balance={balanceToDecimal(
          selectTokenOut?.balance ?? "0",
          selectTokenOut?.decimals ?? 0
        )}
        selected={selectTokenOut as NetworkToken}
        handleSelect={() => handleSelect("tokenOut", selectTokenIn)}
        className="border rounded-b-xl mb-5 md:max-w-[472px]"
        required="This field is required"
        errors={errors}
        errorSelect={errorSelectTokenOut}
        disabled={true}
      />
      {selectTokenIn?.defuse_asset_id === NEAR_TOKEN_META.defuse_asset_id &&
        errorMsg !== ErrorEnum.INSUFFICIENT_BALANCE &&
        errorMsg !== ErrorEnum.NO_QUOTES && (
          <WarnBox
            allowableNearAmount={allowableNearAmountRef.current}
            balance={selectTokenIn?.balance ?? "0"}
            decimals={selectTokenIn?.decimals ?? 0}
            setValue={(value: string) => {
              setValue("tokenIn", value)
            }}
          />
        )}
      <Button
        type="submit"
        size="lg"
        fullWidth
        isLoading={isFetchingData}
        disabled={Boolean(errorMsg)}
      >
        {isFetchingData ? "" : errorMsg ? errorMsg : "Swap"}
      </Button>
    </Form>
  )
}
