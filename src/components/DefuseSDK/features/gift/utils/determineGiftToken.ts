import { Err, Ok, type Result } from "@thames/monads"
import { nearClient } from "../../../constants/nearClient"
import { getDepositedBalances } from "../../../services/defuseBalanceService"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../../../types/base"
import { authHandleToIntentsUserId } from "../../../utils/authIdentity"
import { isBaseToken, isUnifiedToken } from "../../../utils/token"
import { getUnderlyingBaseTokenInfos } from "../../../utils/tokenUtils"
import type { EscrowCredentials } from "./generateEscrowCredentials"

type GiftToken = {
  tokenDiff: Record<BaseTokenInfo["defuseAssetId"], bigint>
  token: BaseTokenInfo | UnifiedTokenInfo
}

export type DetermineGiftTokenErr =
  | "NO_TOKEN_OR_GIFT_HAS_BEEN_CLAIMED"
  | "ERR_GETTING_BALANCES"
  | "ERR_GETTING_DERIVED_TOKEN"

export async function determineGiftToken(
  tokenList: (BaseTokenInfo | UnifiedTokenInfo)[],
  escrowCredentials: EscrowCredentials
): Promise<Result<GiftToken, DetermineGiftTokenErr>> {
  try {
    const tokenIds = tokenList
      .flatMap((token) => getUnderlyingBaseTokenInfos(token))
      .map((t) => t.defuseAssetId)

    const balances = await getDepositedBalances(
      authHandleToIntentsUserId(
        escrowCredentials.credential,
        escrowCredentials.credentialType
      ),
      tokenIds,
      nearClient
    )

    const tokenDiff = Object.fromEntries(
      Object.entries(balances).filter(([_, balance]) => balance > 0n)
    )
    let underlyingToken: BaseTokenInfo | UnifiedTokenInfo | null = null
    for (const token of tokenList) {
      if (isBaseToken(token) && tokenDiff[token.defuseAssetId] !== undefined) {
        underlyingToken = token
        break
      }
      if (
        isUnifiedToken(token) &&
        token.groupedTokens.some(
          (t) => tokenDiff[t.defuseAssetId] !== undefined
        )
      ) {
        const validToken = token.groupedTokens.find(
          (t) => tokenDiff[t.defuseAssetId] !== undefined
        )
        if (validToken) {
          underlyingToken = token
          break
        }
      }
    }

    if (!underlyingToken) {
      return Err("NO_TOKEN_OR_GIFT_HAS_BEEN_CLAIMED")
    }

    return Ok({
      tokenDiff,
      token: underlyingToken,
    })
  } catch {
    return Err("ERR_GETTING_BALANCES")
  }
}
