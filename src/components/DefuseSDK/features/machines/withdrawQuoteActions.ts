import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { getAuroraEngineContractId } from "../../constants/aurora"
import { settings } from "../../constants/settings"
import type {
  BaseTokenInfo,
  TokenDeployment,
  TokenInfo,
} from "../../types/base"
import { isAuroraVirtualChain } from "../../utils/blockchain"
import { computeTotalBalanceDifferentDecimals } from "../../utils/tokenUtils"
import { resolveWithdrawRecipient } from "../withdraw/components/WithdrawForm/utils"
import { isNearFullBalance } from "../withdraw/utils/exactOutBudget"
import { getSiblingCandidates } from "../withdraw/utils/withdrawQuoteUtils"
import type { WithdrawQuote1csInput } from "./backgroundWithdraw1csQuoterMachine"
import type { BalanceMapping } from "./depositedBalanceMachine"
import { selectQuoteInputToken } from "./withdrawTokenSelection"

type WithdrawFormContext = {
  parsedAmount: { amount: bigint; decimals: number } | null
  parsedRecipient: string | null
  parsedDestinationMemo?: string | null
  blockchain: Parameters<typeof resolveWithdrawRecipient>[1]
  tokenIn: TokenInfo
  tokenOut: BaseTokenInfo
  tokenOutDeployment: TokenDeployment
}

type QuotePrerequisitesInput = {
  formContext: WithdrawFormContext
  userAddress: string | null
  userChainType: AuthMethod | null
}

export function getQuotePrerequisites({
  formContext,
  userAddress,
  userChainType,
}: QuotePrerequisitesInput): {
  formContext: WithdrawFormContext
  userAddress: string
  userChainType: AuthMethod
} | null {
  if (
    formContext.parsedAmount == null ||
    formContext.parsedAmount.amount === 0n ||
    formContext.parsedRecipient == null ||
    userAddress == null ||
    userChainType == null
  ) {
    return null
  }

  return { formContext, userAddress, userChainType }
}

export function resolveQuoteInput(params: {
  formContext: WithdrawFormContext
  balances: BalanceMapping
  tokenList: TokenInfo[]
}): {
  tokenIn: BaseTokenInfo
  amount: { amount: bigint; decimals: number }
} | null {
  const { formContext, balances, tokenList } = params
  if (formContext.parsedAmount == null) return null
  return selectQuoteInputToken({
    tokenIn: formContext.tokenIn,
    parsedAmount: formContext.parsedAmount,
    balances,
    siblingCandidates: getSiblingCandidates(formContext.tokenIn, tokenList),
  })
}

export function resolveWithdrawQuoteRecipient(params: {
  formContext: WithdrawFormContext
}): {
  recipient: string
  recipientType: QuoteRequest.recipientType
  destinationChainName: string
  isAurora: boolean
} {
  const { formContext } = params
  if (formContext.parsedRecipient == null) {
    throw new Error("parsedRecipient is required to resolve quote recipient")
  }

  const resolved = resolveWithdrawRecipient(
    formContext.parsedRecipient,
    formContext.blockchain
  )
  const destinationChainName = formContext.tokenOutDeployment.chainName
  const isAurora = isAuroraVirtualChain(destinationChainName)

  const recipient = isAurora
    ? getAuroraEngineContractId(destinationChainName)
    : resolved.recipient
  const recipientType = isAurora
    ? QuoteRequest.recipientType.DESTINATION_CHAIN
    : resolved.recipientType

  return { recipient, recipientType, destinationChainName, isAurora }
}

type PlanWithdrawQuoteRequestInput = {
  formContext: WithdrawFormContext
  userAddress: string | null
  userChainType: AuthMethod | null
  tokenList: TokenInfo[]
  balances: BalanceMapping
  amountMode: QuoteRequest.swapType
  slippageBasisPoints: number
  nowMs?: number
}

type QuotePlanResult =
  | { type: "skip" }
  | { type: "error"; reason: "INSUFFICIENT_BALANCE" }
  | { type: "fallback_exact_in" }
  | { type: "quote"; payload: WithdrawQuote1csInput }

export function planWithdrawQuoteRequest(
  input: PlanWithdrawQuoteRequestInput
): QuotePlanResult {
  const prerequisites = getQuotePrerequisites({
    formContext: input.formContext,
    userAddress: input.userAddress,
    userChainType: input.userChainType,
  })
  if (prerequisites == null) return { type: "skip" }

  const { formContext, userAddress, userChainType } = prerequisites
  const quoteInput = resolveQuoteInput({
    formContext,
    balances: input.balances,
    tokenList: input.tokenList,
  })
  if (quoteInput == null) {
    return { type: "error", reason: "INSUFFICIENT_BALANCE" }
  }

  const { tokenIn: resolvedTokenIn, amount: adjustedAmount } = quoteInput
  if (
    input.amountMode === QuoteRequest.swapType.EXACT_OUTPUT &&
    isNearFullBalance(
      adjustedAmount,
      computeTotalBalanceDifferentDecimals(resolvedTokenIn, input.balances),
      input.slippageBasisPoints
    )
  ) {
    return { type: "fallback_exact_in" }
  }

  const { recipient, recipientType, destinationChainName, isAurora } =
    resolveWithdrawQuoteRecipient({ formContext })

  const nowMs = input.nowMs ?? Date.now()
  return {
    type: "quote",
    payload: {
      tokenIn: resolvedTokenIn,
      tokenOut: formContext.tokenOut,
      amount: adjustedAmount,
      swapType: input.amountMode,
      slippageBasisPoints: input.slippageBasisPoints,
      defuseUserId: userAddress,
      deadline: new Date(nowMs + settings.swapExpirySec * 1000).toISOString(),
      userAddress,
      userChainType,
      recipient,
      recipientType,
      ...(formContext.parsedDestinationMemo
        ? { destinationMemo: formContext.parsedDestinationMemo }
        : {}),
      ...(isAurora
        ? { virtualChainRecipient: formContext.parsedRecipient ?? undefined }
        : {}),
      destinationChainName,
    },
  }
}

type RequestWithdrawQuoteInput = {
  backgroundQuoterRef: {
    send: (event: {
      type: "NEW_QUOTE_INPUT"
      params: WithdrawQuote1csInput
    }) => void
  } | null
  formContext: WithdrawFormContext
  userAddress: string | null
  userChainType: AuthMethod | null
  tokenList: TokenInfo[]
  balances: BalanceMapping
  amountMode: QuoteRequest.swapType
  slippageBasisPoints: number
  onQuoteError: (reason: string) => void
  onFallbackExactIn: () => void
}

export function requestWithdrawQuote(input: RequestWithdrawQuoteInput): void {
  if (!input.backgroundQuoterRef) {
    input.onQuoteError("Unable to initialize quote engine. Please try again.")
    return
  }

  const quotePlan = planWithdrawQuoteRequest({
    formContext: input.formContext,
    userAddress: input.userAddress,
    userChainType: input.userChainType,
    tokenList: input.tokenList,
    balances: input.balances,
    amountMode: input.amountMode,
    slippageBasisPoints: input.slippageBasisPoints,
  })

  if (quotePlan.type === "skip") return
  if (quotePlan.type === "error") {
    input.onQuoteError(quotePlan.reason)
    return
  }
  if (quotePlan.type === "fallback_exact_in") {
    input.onFallbackExactIn()
    return
  }

  input.backgroundQuoterRef.send({
    type: "NEW_QUOTE_INPUT",
    params: quotePlan.payload,
  })
}
