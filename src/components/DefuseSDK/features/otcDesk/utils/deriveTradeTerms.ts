import type { MultiPayload } from "@defuse-protocol/contract-types"
import { logger } from "@src/utils/logger"
import { Err, Ok, type Result } from "@thames/monads"
import type { BaseTokenInfo, TokenInfo } from "../../../types/base"
import { isBaseToken } from "../../../utils/token"
import { grossUpAmount, netDownAmount } from "../../../utils/tokenUtils"
import { type ParseTradeTermsErr, parseTradeTerms } from "./parseTradeTerms"

export type TradeTerms = {
  deadline: string
  makerUserId: string
  makerTokenDiff: Record<BaseTokenInfo["defuseAssetId"], bigint>
  makerNonceBase64: string
  takerTokenDiff: Record<BaseTokenInfo["defuseAssetId"], bigint>
  makerMultiPayload: MultiPayload
}

export type DeriveTradeTermsErr = ParseTradeTermsErr

export function deriveTradeTerms(
  makerMultiPayload: MultiPayload | string,
  protocolFee: number
): Result<TradeTerms, DeriveTradeTermsErr> {
  const makerTermsResult = parseTradeTerms(makerMultiPayload)

  return makerTermsResult.map((makerTerms) => {
    const takerTokenDiff = computeOppositeSideTokenDiff(
      makerTerms.tokenDiff,
      protocolFee
    )

    return {
      deadline: makerTerms.deadline,
      makerUserId: makerTerms.userId,
      makerTokenDiff: makerTerms.tokenDiff,
      makerNonceBase64: makerTerms.nonceBase64,
      takerTokenDiff,
      makerMultiPayload: makerTerms.multiPayload,
    }
  })
}

export type DetermineInvolvedTokensErr = DetermineTokenInAndOutErr

export function determineInvolvedTokens(
  tokenList: TokenInfo[],
  tokenDiff: Record<BaseTokenInfo["defuseAssetId"], bigint>
) {
  const { tokenIdsIn, tokenIdsOut } = getTokenIds(tokenDiff)

  return determineTokenInAndOut(tokenList, tokenIdsIn, tokenIdsOut)
}

export function computeOppositeSideTokenDiff(
  tokenDiff: Record<BaseTokenInfo["defuseAssetId"], bigint>,
  protocolFee: number
) {
  const oppositeTokenDiff: Record<BaseTokenInfo["defuseAssetId"], bigint> = {}

  for (const [tokenId, makerAmount] of Object.entries(tokenDiff)) {
    const takerAmount =
      makerAmount > 0n
        ? -grossUpAmount(makerAmount, protocolFee)
        : netDownAmount(-makerAmount, protocolFee)

    oppositeTokenDiff[tokenId] = takerAmount
  }

  return oppositeTokenDiff
}

function getTokenIds(
  tokenDiff: Record<BaseTokenInfo["defuseAssetId"], bigint>
) {
  const tokenIdsIn: BaseTokenInfo["defuseAssetId"][] = []
  const tokenIdsOut: BaseTokenInfo["defuseAssetId"][] = []

  for (const [tokenId, amount] of Object.entries(tokenDiff)) {
    if (amount > 0n) {
      tokenIdsOut.push(tokenId)
    } else if (amount < 0n) {
      tokenIdsIn.push(tokenId)
    }
  }

  return { tokenIdsIn, tokenIdsOut }
}

function findTokens(
  tokenList: TokenInfo[],
  tokenIds: BaseTokenInfo["defuseAssetId"][]
): (TokenInfo | null)[] {
  const tokens = tokenIds.map((tokenId) => {
    const found = tokenList.find((token) => {
      if (isBaseToken(token)) {
        return token.defuseAssetId === tokenId
      }

      return token.groupedTokens.some(
        (group) => group.defuseAssetId === tokenId
      )
    })

    return found ?? null
  })

  return Array.from(new Set(tokens))
}

type DetermineTokenInAndOutErr =
  | "MULTIPLE_TOKENS_NOT_SUPPORTED"
  | "TOKEN_NOT_FOUND_IN_LIST"

function determineTokenInAndOut(
  tokenList: TokenInfo[],
  tokenIdsIn: BaseTokenInfo["defuseAssetId"][],
  tokenIdsOut: BaseTokenInfo["defuseAssetId"][]
): Result<
  {
    tokenIn: TokenInfo
    tokenOut: TokenInfo
  },
  DetermineTokenInAndOutErr
> {
  const tokensIn = findTokens(tokenList, tokenIdsIn)
  const tokensOut = findTokens(tokenList, tokenIdsOut)

  const tokenIn = tokensIn[0]
  const tokenOut = tokensOut[0]

  if (tokenIn == null || tokenOut == null) {
    logger.error("Couldn't find token in or out in token list", {
      tokens: { in: tokenIdsIn, out: tokenIdsOut },
    })
    return Err("TOKEN_NOT_FOUND_IN_LIST")
  }

  // We need to ensure that each group of tokens are resolved into a single token,
  // otherwise it means user needs to sell multiple tokens or buy multiple tokens
  if (tokensIn.length !== 1 || tokensOut.length !== 1) {
    return Err("MULTIPLE_TOKENS_NOT_SUPPORTED")
  }

  return Ok({ tokenIn, tokenOut })
}
