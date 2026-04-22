import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import type { SnapshotFrom } from "xstate"
import { getAuroraEngineContractId } from "../../../constants/aurora"
import type { BaseTokenInfo, TokenInfo } from "../../../types/base"
import { isAuroraVirtualChain } from "../../../utils/blockchain"
import { getTokenAid, isBaseToken } from "../../../utils/token"
import { adjustDecimalsTokenValue } from "../../../utils/tokenUtils"
import type { WithdrawQuote1csInput } from "../../machines/backgroundWithdraw1csQuoterMachine"
import type { BalanceMapping } from "../../machines/depositedBalanceMachine"
import type { withdrawFormReducer } from "../../machines/withdrawFormReducer"
import { selectQuoteInputToken } from "../../machines/withdrawTokenSelection"
import { resolveWithdrawRecipient } from "../components/WithdrawForm/utils"

type WithdrawFormContext = SnapshotFrom<typeof withdrawFormReducer>["context"]

export function getSiblingCandidates(
  tokenIn: TokenInfo,
  tokenList: TokenInfo[]
): BaseTokenInfo[] | undefined {
  if (!isBaseToken(tokenIn)) return undefined
  return tokenList.filter((token): token is BaseTokenInfo => {
    if (!isBaseToken(token)) return false
    if (token.defuseAssetId === tokenIn.defuseAssetId) return true
    const tokenInAid = getTokenAid(tokenIn)
    const tokenAid = getTokenAid(token)
    if (tokenInAid != null && tokenAid != null) return tokenInAid === tokenAid
    return token.symbol === tokenIn.symbol
  })
}

export function matchesWithdrawQuoteInput(params: {
  formContext: WithdrawFormContext
  quoteInput: WithdrawQuote1csInput
  userAddress: string | null
  userChainType: AuthMethod | null
  tokenList: TokenInfo[]
  balances: BalanceMapping
}): boolean {
  const {
    formContext,
    quoteInput,
    userAddress,
    userChainType,
    tokenList,
    balances,
  } = params

  if (
    formContext.parsedAmount == null ||
    formContext.parsedAmount.amount === 0n ||
    formContext.parsedRecipient == null ||
    userAddress == null ||
    userChainType == null
  ) {
    return false
  }

  const resolved = resolveWithdrawRecipient(
    formContext.parsedRecipient,
    formContext.blockchain
  )

  const isAurora = isAuroraVirtualChain(
    formContext.tokenOutDeployment.chainName
  )
  const recipient = isAurora
    ? getAuroraEngineContractId(formContext.tokenOutDeployment.chainName)
    : resolved.recipient
  const recipientType = isAurora
    ? QuoteRequest.recipientType.DESTINATION_CHAIN
    : resolved.recipientType

  const destinationMemo = formContext.parsedDestinationMemo ?? null
  const quoteDestinationMemo = quoteInput.destinationMemo ?? null

  const amountInQuoteDecimals = adjustDecimalsTokenValue(
    formContext.parsedAmount,
    quoteInput.amount.decimals
  )

  const resolvedInput = selectQuoteInputToken({
    tokenIn: formContext.tokenIn,
    parsedAmount: amountInQuoteDecimals,
    balances,
    siblingCandidates: getSiblingCandidates(formContext.tokenIn, tokenList),
  })

  if (
    resolvedInput == null ||
    resolvedInput.tokenIn.defuseAssetId !== quoteInput.tokenIn.defuseAssetId
  ) {
    return false
  }

  return (
    quoteInput.userAddress === userAddress &&
    quoteInput.userChainType === userChainType &&
    quoteInput.recipient === recipient &&
    quoteInput.recipientType === recipientType &&
    quoteInput.tokenOut.defuseAssetId === formContext.tokenOut.defuseAssetId &&
    amountInQuoteDecimals.amount === quoteInput.amount.amount &&
    destinationMemo === quoteDestinationMemo
  )
}
