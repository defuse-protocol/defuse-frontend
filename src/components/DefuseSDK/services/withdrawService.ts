import type { Intent } from "@defuse-protocol/contract-types"
import {
  type FeeEstimation,
  FeeExceedsAmountError,
  type RouteConfig,
  RouteEnum,
  TrustlineNotFoundError,
  type WithdrawalParams,
  createDefaultRoute,
  createInternalTransferRoute,
  createNearWithdrawalRoute,
  createOmniBridgeRoute,
  createVirtualChainRoute,
} from "@defuse-protocol/intents-sdk"
import { getCAIP2 } from "@src/components/DefuseSDK/utils/caip2"
import { logger } from "@src/utils/logger"
import { Err, Ok, type Result } from "@thames/monads"
import { type ActorRefFrom, waitFor } from "xstate"
import { getAuroraEngineContractId } from "../constants/aurora"
import { bridgeSDK } from "../constants/bridgeSdk"
import type { QuoteInput } from "../features/machines/backgroundQuoterMachine"
import {
  type BalanceMapping,
  balancesSelector,
  type depositedBalanceMachine,
} from "../features/machines/depositedBalanceMachine"
import type { poaBridgeInfoActor } from "../features/machines/poaBridgeInfoActor"
import { getPOABridgeInfo } from "../features/machines/poaBridgeInfoActor"
import { calcWithdrawAmount } from "../features/machines/swapIntentMachine"
import type { State as WithdrawFormContext } from "../features/machines/withdrawFormReducer"
import { isNearIntentsNetwork } from "../features/withdraw/components/WithdrawForm/utils"
import { calculateSplitAmounts } from "../sdk/aggregatedQuote/calculateSplitAmounts"
import type { BaseTokenInfo, TokenInfo, TokenValue } from "../types/base"
import { assert } from "../utils/assert"
import { isAuroraVirtualChain } from "../utils/blockchain"
import { findError } from "../utils/errors"
import { isBaseToken } from "../utils/token"
import {
  adjustDecimalsTokenValue,
  compareAmounts,
  computeTotalBalanceDifferentDecimals,
  getUnderlyingBaseTokenInfos,
  maxAmounts,
  minAmounts,
  netDownAmount,
  subtractAmounts,
  truncateTokenValue,
} from "../utils/tokenUtils"
import {
  type AggregatedQuoteParams,
  type QuoteResult,
  queryQuote,
} from "./quoteService"

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
        | "ERR_CANNOT_MAKE_WITHDRAWAL_INTENT"
    }
  | {
      reason: "ERR_AMOUNT_TOO_LOW"
      shortfall: TokenValue
      receivedAmount: bigint
      minWithdrawalAmount: bigint
      token: BaseTokenInfo
    }
  | {
      reason: "ERR_STELLAR_NO_TRUSTLINE"
      token: BaseTokenInfo
    }

export type PreparedWithdrawReturnType = {
  directWithdrawAvailable: TokenValue
  swap: SwapRequirement | null
  feeEstimation: FeeEstimation
  receivedAmount: TokenValue
  prebuiltWithdrawalIntents: Intent[]
  withdrawalParams: WithdrawalParams
  baseBridgeFee?: bigint // Base bridge fee before additional direction fee
}

export type PreparationOutput =
  | { tag: "ok"; value: PreparedWithdrawReturnType }
  | { tag: "err"; value: PrepareWithdrawErrorType }

export async function prepareWithdraw(
  {
    formValues,
    depositedBalanceRef,
    poaBridgeInfoRef,
    appFeeRecipient,
  }: {
    formValues: WithdrawFormContext
    depositedBalanceRef: ActorRefFrom<typeof depositedBalanceMachine>
    poaBridgeInfoRef: ActorRefFrom<typeof poaBridgeInfoActor>
    appFeeRecipient?: string
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
    const swapParams: AggregatedQuoteParams = {
      amountIn: swapNeeded.amount,
      tokensIn: swapNeeded.tokens,
      tokenOut: formValues.tokenOut,
      balances: balances,
      appFeeBps: 0, // no app fee for withdrawals
      waitMs: 5_000, // it is good enough for most solvers
    }

    const swapQuote = await queryQuote(swapParams, { signal })

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
    formValues.tokenOutDeployment.chainName
  )
    ? createVirtualChainRoute(
        getAuroraEngineContractId(formValues.tokenOutDeployment.chainName),
        null // TODO: provide the correct value once you know it
      )
    : formValues.tokenOutDeployment.chainName === "near"
      ? createNearWithdrawalRoute()
      : formValues.tokenOutDeployment.bridge === "near_omni"
        ? createOmniBridgeRoute(
            getCAIP2(formValues.tokenOutDeployment.chainName)
          )
        : createDefaultRoute()

  const baseWithdrawalParams: WithdrawalParams = {
    assetId: formValues.tokenOut.defuseAssetId,
    amount: 0n,
    destinationAddress: formValues.parsedRecipient,
    destinationMemo: formValues.parsedDestinationMemo ?? undefined,
    feeInclusive: false,
    routeConfig,
  }

  const feeEstimation = await estimateFee({
    withdrawalParams: baseWithdrawalParams,
  })
  if (feeEstimation.isErr()) {
    return { tag: "err", value: feeEstimation.unwrapErr() }
  }

  // Add 1% additional fee for Near to Solana withdrawals
  // Check if token originated from Near and is being withdrawn to Solana
  const isNearToSolana =
    formValues.tokenOut.originChainName === "near" &&
    formValues.tokenOutDeployment.chainName === "solana"
  const isZecToSolana =
    formValues.tokenOut.originChainName === "zcash" &&
    formValues.tokenOutDeployment.chainName === "solana"

  const baseFeeEstimation = feeEstimation.unwrap()
  const baseBridgeFeeAmount = baseFeeEstimation.amount
  let totalFeeAmount = baseBridgeFeeAmount
  if (isNearToSolana || isZecToSolana) {
    // Calculate 1% fee (10,000 basis points) on totalWithdrawn
    const onePercentFeeBps = 10_000 // 1% = 10,000 basis points
    const additionalFee =
      totalWithdrawn.amount -
      netDownAmount(totalWithdrawn.amount, onePercentFeeBps)
    totalFeeAmount += additionalFee
  }

  const receivedAmount = subtractAmounts(totalWithdrawn, {
    amount: totalFeeAmount,
    // Fee estimations are always in the decimals of the token on NEAR chain,
    // even if on the destination chain the token has different decimals.
    decimals: formValues.tokenOut.decimals,
  })

  if (compareAmounts(receivedAmount, minWithdrawal) === -1) {
    return {
      tag: "err",
      value: {
        reason: "ERR_AMOUNT_TOO_LOW",
        shortfall: subtractAmounts(minWithdrawal, receivedAmount),
        // todo: provide decimals too
        receivedAmount: receivedAmount.amount,
        // todo: provide decimals too
        minWithdrawalAmount: minWithdrawal.amount,
        token: formValues.tokenOut,
      },
    }
  }

  const withdrawalParams: WithdrawalParams = {
    ...baseWithdrawalParams,
    amount: receivedAmount.amount,
  }

  let withdrawalIntents: Intent[]
  try {
    withdrawalIntents = await bridgeSDK.createWithdrawalIntents({
      withdrawalParams,
      feeEstimation: baseFeeEstimation,
    })
  } catch (err: unknown) {
    const trustlineNotFoundErr = findError(err, TrustlineNotFoundError)
    if (trustlineNotFoundErr != null) {
      return {
        tag: "err",
        value: {
          reason: "ERR_STELLAR_NO_TRUSTLINE",
          token: formValues.tokenOut,
        },
      }
    }

    logger.error(err)
    return {
      tag: "err",
      value: { reason: "ERR_CANNOT_MAKE_WITHDRAWAL_INTENT" },
    }
  }
  // Create a separate transfer intent for the 1% fee for Near to Solana withdrawals
  if ((isNearToSolana || isZecToSolana) && appFeeRecipient) {
    const additionalFee = totalFeeAmount - baseBridgeFeeAmount
    if (additionalFee > 0n) {
      const feeIntent: Intent = {
        intent: "transfer",
        receiver_id: appFeeRecipient,
        tokens: {
          [formValues.tokenOut.defuseAssetId]: additionalFee.toString(),
        },
      }
      withdrawalIntents.push(feeIntent)
    }
  }

  // Update fee estimation to include additional fee for Near to Solana withdrawals
  const finalFeeEstimation =
    isNearToSolana || isZecToSolana
      ? {
          ...baseFeeEstimation,
          amount: totalFeeAmount,
        }
      : baseFeeEstimation

  return {
    tag: "ok",
    value: {
      directWithdrawAvailable: directWithdrawAvailable,
      swap: swapRequirement,
      feeEstimation: finalFeeEstimation,
      receivedAmount: receivedAmount,
      prebuiltWithdrawalIntents: withdrawalIntents,
      withdrawalParams,
      baseBridgeFee:
        isNearToSolana || isZecToSolana ? baseBridgeFeeAmount : undefined,
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
  let minWithdrawal: TokenValue

  if (formValues.tokenOutDeployment.bridge !== "poa") {
    // All other bridges have no minimum amount
    minWithdrawal = {
      amount: 1n,
      // Use the minimum decimals between NEAR and destination chains to ensure
      // we never require fractional atomic units (which are impossible).
      //
      // Example: NEAR (18 decimals) → Solana (9 decimals)
      //   min(18, 9) = 9 ✓ Valid on both chains
      //   max(18, 9) = 18 ✗ Requires fractional Solana units
      decimals: Math.min(
        formValues.tokenOut.decimals,
        formValues.tokenOutDeployment.decimals
      ),
    }
  } else {
    const poaBridgeInfoState = await waitFor(
      poaBridgeInfoRef,
      (state) => state.matches("success"),
      { signal } // todo: add timeout and error handling
    )

    // Check minimum withdrawal amount
    const poaBridgeInfo = getPOABridgeInfo(
      poaBridgeInfoState,
      formValues.tokenOut.defuseAssetId
    )
    assert(poaBridgeInfo != null, "poaBridgeInfo is null")

    minWithdrawal = {
      amount: poaBridgeInfo.minWithdrawal,
      // note: PoA-bridged tokens on NEAR have the exact same decimals as on an origin chain
      decimals: formValues.tokenOutDeployment.decimals,
    }
  }

  // This is a special case for withdrawals to Hyperliquid chain
  if (formValues.minReceivedAmount != null) {
    return maxAmounts(formValues.minReceivedAmount, minWithdrawal)
  }

  return minWithdrawal
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
  let balances = balancesSelector(depositedBalanceRef.getSnapshot())
  if (Object.keys(balances).length === 0) {
    depositedBalanceRef.send({ type: "REQUEST_BALANCE_REFRESH" })
    const state = await waitFor(
      depositedBalanceRef,
      (state) => state.matches("authenticated"),
      { signal } // todo: add timeout and error handling
    )
    balances = balancesSelector(state)
  }

  return {
    tag: "ok",
    value: balances,
  }
}

async function estimateFee({
  withdrawalParams,
}: {
  withdrawalParams: WithdrawalParams
}): Promise<Result<FeeEstimation, { reason: "ERR_WITHDRAWAL_FEE_FETCH" }>> {
  return bridgeSDK
    .estimateWithdrawalFee({ withdrawalParams })
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
  tokenIn: TokenInfo,
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

  const withdrawalParams: WithdrawalParams[] = Object.entries(amounts).map(
    ([defuseAssetId, amount]) => {
      assert(formValues.parsedRecipient != null, "parsedRecipient is null")

      return {
        assetId: defuseAssetId,
        amount: amount,
        destinationAddress: formValues.parsedRecipient,
        destinationMemo: undefined, // Destination memo is only used for XRP Ledger withdrawals
        feeInclusive: false,
        routeConfig: createInternalTransferRoute(),
      }
    }
  )

  const intents = (
    await Promise.all(
      withdrawalParams.map((wp) => {
        return bridgeSDK.createWithdrawalIntents({
          withdrawalParams: wp,
          feeEstimation: {
            amount: 0n,
            quote: null,
            underlyingFees: {
              [RouteEnum.InternalTransfer]: null,
            },
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
      feeEstimation: {
        amount: 0n,
        quote: null,
        underlyingFees: {
          [RouteEnum.InternalTransfer]: null,
        },
      },
      receivedAmount: formValues.parsedAmount,
      prebuiltWithdrawalIntents: intents,
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      withdrawalParams: withdrawalParams[0]!,
    },
  }
}
