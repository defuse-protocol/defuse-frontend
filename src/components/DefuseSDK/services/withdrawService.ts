import {
  type FeeEstimation,
  FeeExceedsAmountError,
  type RouteConfig,
  createDefaultRoute,
  createInternalTransferRoute,
  createNearWithdrawalRoute,
  createVirtualChainRoute,
} from "@defuse-protocol/bridge-sdk"
import { Err, Ok, type Result } from "@thames/monads"
import { type ActorRefFrom, waitFor } from "xstate"
import { getAuroraEngineContractId } from "../constants/aurora"
import { bridgeSDK } from "../constants/bridgeSdk"
import type {
  QuoteInput,
  backgroundQuoterMachine,
} from "../features/machines/backgroundQuoterMachine"
import type {
  BalanceMapping,
  depositedBalanceMachine,
} from "../features/machines/depositedBalanceMachine"
import type { poaBridgeInfoActor } from "../features/machines/poaBridgeInfoActor"
import { getPOABridgeInfo } from "../features/machines/poaBridgeInfoActor"
import { calcWithdrawAmount } from "../features/machines/swapIntentMachine"
import type { State as WithdrawFormContext } from "../features/machines/withdrawFormReducer"
import { isNearIntentsNetwork } from "../features/withdraw/components/WithdrawForm/utils"
import { logger } from "../logger"
import { calculateSplitAmounts } from "../sdk/aggregatedQuote/calculateSplitAmounts"
import type { BaseTokenInfo, TokenValue, UnifiedTokenInfo } from "../types/base"
import type { Intent } from "../types/defuse-contracts-types"
import { assert } from "../utils/assert"
import { isAuroraVirtualChain } from "../utils/blockchain"
import { findError } from "../utils/errors"
import { isBaseToken } from "../utils/token"
import {
  adjustDecimalsTokenValue,
  compareAmounts,
  computeTotalBalanceDifferentDecimals,
  getUnderlyingBaseTokenInfos,
  minAmounts,
  subtractAmounts,
  truncateTokenValue,
} from "../utils/tokenUtils"
import type { QuoteResult } from "./quoteService"

interface SwapRequirement {
  swapParams: QuoteInput
  swapQuote: QuoteResult
}

export type PrepareWithdrawErrorType =
  | Extract<QuoteResult, { tag: "err" }>["value"]
  | {
      reason:
        | "ERR_BALANCE_FETCH"
        | "ERR_BALANCE_MISSING"
        | "ERR_BALANCE_INSUFFICIENT"
        | "ERR_CANNOT_FETCH_POA_BRIDGE_INFO"
        | "ERR_CANNOT_FETCH_QUOTE"
        | "ERR_WITHDRAWAL_FEE_FETCH"
    }
  | {
      reason: "ERR_AMOUNT_TOO_LOW"
      shortfall: TokenValue
      receivedAmount: bigint
      minWithdrawalAmount: bigint
      token: BaseTokenInfo
    }

export type PreparedWithdrawReturnType = {
  directWithdrawAvailable: TokenValue
  swap: SwapRequirement | null
  feeEstimation: FeeEstimation
  receivedAmount: TokenValue
  prebuiltWithdrawalIntents: Intent[]
}

export type PreparationOutput =
  | { tag: "ok"; value: PreparedWithdrawReturnType }
  | { tag: "err"; value: PrepareWithdrawErrorType }

export async function prepareWithdraw(
  {
    formValues,
    depositedBalanceRef,
    poaBridgeInfoRef,
    backgroundQuoteRef,
  }: {
    formValues: WithdrawFormContext
    depositedBalanceRef: ActorRefFrom<typeof depositedBalanceMachine>
    poaBridgeInfoRef: ActorRefFrom<typeof poaBridgeInfoActor>
    backgroundQuoteRef: ActorRefFrom<typeof backgroundQuoterMachine>
  },
  { signal }: { signal: AbortSignal }
): Promise<PreparationOutput> {
  assert(formValues.parsedAmount != null, "parsedAmount is null")
  assert(formValues.parsedRecipient != null, "parsedRecipient is null")

  let balances: Exclude<
    Awaited<ReturnType<typeof getBalances>>,
    { tag: "err" }
  >["value"]
  try {
    const result = await getBalances({ depositedBalanceRef }, { signal })
    if (result.tag === "err") {
      return result
    }
    balances = result.value
  } catch (err) {
    logger.error(err)
    return {
      tag: "err",
      value: { reason: "ERR_BALANCE_FETCH" },
    }
  }

  const balanceSufficiency = checkBalanceSufficiency({
    formValues,
    balances,
  })
  if (balanceSufficiency.tag === "err") {
    return balanceSufficiency
  }

  if (isNearIntentsNetwork(formValues.blockchain)) {
    return prepareNearIntentsWithdraw({
      formValues,
      balances,
    })
  }

  const breakdown = getWithdrawBreakdown({
    formValues,
    balances,
  })
  if (breakdown.tag === "err") {
    return breakdown
  }

  const { directWithdrawAvailable, swapNeeded } = breakdown.value

  let swapRequirement: null | SwapRequirement = null
  if (swapNeeded.amount.amount > 0n) {
    const swapParams = {
      amountIn: swapNeeded.amount,
      tokensIn: swapNeeded.tokens,
      tokenOut: formValues.tokenOut,
      balances: balances,
      appFeeBps: 0, // no app fee for withdrawals
    }

    const swapQuote = await new Promise<QuoteResult>((resolve) => {
      backgroundQuoteRef.send({
        type: "NEW_QUOTE_INPUT",
        params: swapParams,
      })

      const sub = backgroundQuoteRef.on("NEW_QUOTE", (event) => {
        sub.unsubscribe()
        resolve(event.params.quote)
      })
    })

    swapRequirement = {
      swapParams,
      swapQuote,
    }
  }

  if (swapRequirement && swapRequirement.swapQuote.tag === "err") {
    return { tag: "err", value: swapRequirement.swapQuote.value }
  }

  const minWithdrawal = await getMinWithdrawalAmount(
    {
      formValues,
      poaBridgeInfoRef,
    },
    { signal }
  )

  const { withdrawAmount: totalWithdrawn } = calcWithdrawAmount(
    formValues.tokenOut,
    swapRequirement?.swapQuote?.tag === "ok"
      ? swapRequirement.swapQuote.value
      : null,
    { amount: 0n }, // pass 0 fee, because we just need to compute the total withdrawn amount
    directWithdrawAvailable
  )

  const routeConfig: RouteConfig | undefined = isAuroraVirtualChain(
    formValues.tokenOut.chainName
  )
    ? createVirtualChainRoute(
        getAuroraEngineContractId(formValues.tokenOut.chainName),
        null // TODO: provide the correct value once you know it
      )
    : formValues.tokenOut.chainName === "near"
      ? createNearWithdrawalRoute()
      : createDefaultRoute()

  const feeEstimation = await estimateFee({
    defuseAssetId: formValues.tokenOut.defuseAssetId,
    amount: totalWithdrawn.amount,
    recipient: formValues.parsedRecipient,
    routeConfig,
  })
  if (feeEstimation.isErr()) {
    return { tag: "err", value: feeEstimation.unwrapErr() }
  }

  const receivedAmount = {
    amount: totalWithdrawn.amount - feeEstimation.unwrap().amount,
    decimals: formValues.tokenOut.decimals,
  }

  if (compareAmounts(receivedAmount, minWithdrawal) === -1) {
    return {
      tag: "err",
      value: {
        reason: "ERR_AMOUNT_TOO_LOW",
        shortfall: {
          amount: minWithdrawal.amount - receivedAmount.amount,
          decimals: receivedAmount.decimals,
        },
        // todo: provide decimals too
        receivedAmount: receivedAmount.amount,
        // todo: provide decimals too
        minWithdrawalAmount: minWithdrawal.amount,
        token: formValues.tokenOut,
      },
    }
  }

  const withdrawalIntents = await bridgeSDK.createWithdrawalIntents({
    withdrawalParams: {
      assetId: formValues.tokenOut.defuseAssetId,
      amount: receivedAmount.amount,
      destinationAddress: formValues.parsedRecipient,
      destinationMemo: formValues.parsedDestinationMemo ?? undefined,
      feeInclusive: false,
      routeConfig,
    },
    feeEstimation: feeEstimation.unwrap(),
  })

  return {
    tag: "ok",
    value: {
      directWithdrawAvailable: directWithdrawAvailable,
      swap: swapRequirement,
      feeEstimation: feeEstimation.unwrap(),
      receivedAmount: receivedAmount,
      prebuiltWithdrawalIntents: withdrawalIntents,
    },
  }
}

async function getMinWithdrawalAmount(
  {
    formValues,
    poaBridgeInfoRef,
  }: {
    formValues: WithdrawFormContext
    poaBridgeInfoRef: ActorRefFrom<typeof poaBridgeInfoActor>
  },
  { signal }: { signal: AbortSignal }
): Promise<TokenValue> {
  if (
    // all other bridges have no minimal amount
    formValues.tokenOut.bridge !== "poa"
  ) {
    return { amount: 1n, decimals: formValues.tokenOut.decimals }
  }

  const poaBridgeInfoState = await waitFor(
    poaBridgeInfoRef,
    (state) => state.matches("success"),
    { signal } // todo: add timeout and error handling
  )

  // Check minimum withdrawal amount
  const poaBridgeInfo = getPOABridgeInfo(
    poaBridgeInfoState,
    formValues.tokenOut
  )
  assert(poaBridgeInfo != null, "poaBridgeInfo is null")

  if (formValues.minReceivedAmount != null) {
    return {
      amount:
        formValues.minReceivedAmount.amount > poaBridgeInfo.minWithdrawal
          ? formValues.minReceivedAmount.amount
          : poaBridgeInfo.minWithdrawal,
      decimals: formValues.tokenOut.decimals,
    }
  }

  return {
    amount: poaBridgeInfo.minWithdrawal,
    decimals: formValues.tokenOut.decimals,
  }
}

function checkBalanceSufficiency({
  formValues,
  balances,
}: {
  formValues: WithdrawFormContext
  balances: BalanceMapping
}):
  | { tag: "ok" }
  | {
      tag: "err"
      value: { reason: "ERR_BALANCE_INSUFFICIENT" | "ERR_BALANCE_MISSING" }
    } {
  assert(formValues.parsedAmount != null, "parsedAmount is null")

  const totalBalance = computeTotalBalanceDifferentDecimals(
    formValues.tokenIn,
    balances
  )

  if (totalBalance == null) {
    return { tag: "err", value: { reason: "ERR_BALANCE_MISSING" } }
  }

  if (compareAmounts(totalBalance, formValues.parsedAmount) === -1) {
    return { tag: "err", value: { reason: "ERR_BALANCE_INSUFFICIENT" } }
  }

  return { tag: "ok" }
}

async function getBalances(
  {
    depositedBalanceRef,
  }: {
    depositedBalanceRef: ActorRefFrom<typeof depositedBalanceMachine>
  },
  { signal }: { signal: AbortSignal }
): Promise<
  | { tag: "ok"; value: BalanceMapping }
  | { tag: "err"; value: { reason: "ERR_BALANCE_FETCH" } }
> {
  let balances = depositedBalanceRef.getSnapshot().context.balances
  if (Object.keys(balances).length === 0) {
    depositedBalanceRef.send({ type: "REQUEST_BALANCE_REFRESH" })
    const state = await waitFor(
      depositedBalanceRef,
      (state) => state.matches("authenticated"),
      { signal } // todo: add timeout and error handling
    )
    balances = state.context.balances
  }

  return {
    tag: "ok",
    value: balances,
  }
}

async function estimateFee({
  defuseAssetId,
  amount,
  recipient,
  routeConfig,
}: {
  defuseAssetId: string
  amount: bigint
  recipient: string
  routeConfig: RouteConfig | undefined
}): Promise<Result<FeeEstimation, { reason: "ERR_WITHDRAWAL_FEE_FETCH" }>> {
  return bridgeSDK
    .estimateWithdrawalFee({
      withdrawalParams: {
        assetId: defuseAssetId,
        amount: amount,
        destinationAddress: recipient,
        feeInclusive: true,
        routeConfig,
      },
    })
    .then(Ok, (err) => {
      const feeExceedsAmountError = findError(err, FeeExceedsAmountError)

      if (feeExceedsAmountError) {
        return Ok(feeExceedsAmountError.feeEstimation)
      }

      logger.error(err)
      return Err({
        reason: "ERR_WITHDRAWAL_FEE_FETCH",
      })
    })
}

function getWithdrawBreakdown({
  formValues,
  balances,
}: {
  formValues: WithdrawFormContext
  balances: BalanceMapping
}):
  | {
      tag: "ok"
      value: {
        directWithdrawAvailable: TokenValue
        swapNeeded: {
          tokens: BaseTokenInfo[]
          amount: TokenValue
        }
      }
    }
  | { tag: "err"; value: { reason: "ERR_BALANCE_MISSING" } } {
  assert(formValues.parsedAmount != null, "parsedAmount is null")

  const requiredSwap = getRequiredSwapAmount(
    formValues.tokenIn,
    formValues.tokenOut,
    formValues.parsedAmount,
    balances
  )

  if (requiredSwap == null) {
    return { tag: "err", value: { reason: "ERR_BALANCE_MISSING" } }
  }

  if (requiredSwap.swapParams == null) {
    return {
      tag: "ok",
      value: {
        directWithdrawAvailable: requiredSwap.directWithdrawalAmount,
        swapNeeded: {
          tokens: [],
          amount: { amount: 0n, decimals: 0 },
        },
      },
    }
  }

  return {
    tag: "ok",
    value: {
      directWithdrawAvailable: requiredSwap.directWithdrawalAmount,
      swapNeeded: {
        tokens: requiredSwap.swapParams.tokensIn,
        amount: requiredSwap.swapParams.amountIn,
      },
    },
  }
}

export function getRequiredSwapAmount(
  tokenIn: UnifiedTokenInfo | BaseTokenInfo,
  tokenOut: BaseTokenInfo,
  totalAmountIn: TokenValue,
  balances: Record<BaseTokenInfo["defuseAssetId"], bigint>
) {
  const underlyingTokensIn = isBaseToken(tokenIn)
    ? [tokenIn]
    : // Deduplicate tokens by defuseAssetId
      Array.from(
        new Map(tokenIn.groupedTokens.map((t) => [t.defuseAssetId, t])).values()
      )

  /**
   * It is crucial to know balances of involved tokens, otherwise we can't
   * make informed decisions.
   */
  if (
    underlyingTokensIn.some((t) => balances[t.defuseAssetId] == null) ||
    balances[tokenOut.defuseAssetId] == null
  ) {
    return null
  }

  /**
   * We want to swap only tokens that are not `tokenOut`.
   *
   * For example, user wants to swap USDC to USDC@Solana, we will quote for:
   * - USDC@Near → USDC@Solana
   * - USDC@Base → USDC@Solana
   * - USDC@Ethereum → USDC@Solana
   * We skip from quote:
   * - USDC@Solana → USDC@Solana
   */
  const tokensIn = underlyingTokensIn.filter(
    (t) => tokenOut.defuseAssetId !== t.defuseAssetId
  )

  /**
   * Some portion of the `tokenOut` balance is already available and doesn’t
   * require swapping.
   *
   * For example, in a swap USDC → USDC@Solana, any existing USDC@Solana
   * balance is directly counted towards the total output, reducing the amount
   * we need to quote for.
   */
  let swapAmount = totalAmountIn
  let directWithdrawalAmount = {
    amount: 0n,
    decimals: tokenOut.decimals,
  }
  if (underlyingTokensIn.length !== tokensIn.length) {
    const tokenOutBalance = balances[tokenOut.defuseAssetId]
    // Help Typescript
    assert(tokenOutBalance != null, "Token out balance is missing")

    // Determine the amount that can be directly withdrawn
    directWithdrawalAmount = minAmounts(swapAmount, {
      decimals: tokenOut.decimals,
      amount: tokenOutBalance,
    })

    // The withdrawal is expected to be in `tokenOut` decimals
    directWithdrawalAmount = adjustDecimalsTokenValue(
      directWithdrawalAmount,
      tokenOut.decimals
    )

    // Determine the amount that needs to be swapped
    swapAmount = subtractAmounts(swapAmount, directWithdrawalAmount)

    // The swap amount is expected to be in `amountIn` decimals
    swapAmount = adjustDecimalsTokenValue(swapAmount, totalAmountIn.decimals)

    // Strip dust (if tokenOut has fewer decimals than tokenIn)
    const isOnlyDust =
      truncateTokenValue(swapAmount, tokenOut.decimals).amount === 0n
    if (isOnlyDust) {
      swapAmount = { amount: 0n, decimals: totalAmountIn.decimals }
    }
  }

  return {
    swapParams:
      swapAmount.amount > 0n
        ? { tokensIn, tokenOut, amountIn: swapAmount, balances }
        : null,
    directWithdrawalAmount: directWithdrawalAmount,
    tokenOut,
  }
}

async function prepareNearIntentsWithdraw({
  formValues,
  balances,
}: {
  formValues: WithdrawFormContext
  balances: BalanceMapping
}): Promise<PreparationOutput> {
  assert(formValues.parsedAmount != null, "parsedAmount is null")

  const amounts = calculateSplitAmounts(
    getUnderlyingBaseTokenInfos(formValues.tokenIn),
    formValues.parsedAmount,
    balances
  )

  const intents = (
    await Promise.all(
      Object.entries(amounts).map(([defuseAssetId, amount]) => {
        assert(formValues.parsedRecipient != null, "parsedRecipient is null")

        return bridgeSDK.createWithdrawalIntents({
          withdrawalParams: {
            assetId: defuseAssetId,
            amount: amount,
            destinationAddress: formValues.parsedRecipient,
            destinationMemo: undefined, // Destination memo is only used for XRP Ledger withdrawals
            feeInclusive: false,
            routeConfig: createInternalTransferRoute(),
          },
          feeEstimation: {
            amount: 0n,
            quote: null,
          },
        })
      })
    )
  ).flat()

  return {
    tag: "ok",
    value: {
      directWithdrawAvailable: formValues.parsedAmount,
      swap: null,
      feeEstimation: { amount: 0n, quote: null },
      receivedAmount: formValues.parsedAmount,
      prebuiltWithdrawalIntents: intents,
    },
  }
}
