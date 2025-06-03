import { LIST_TOKENS } from "@src/constants/tokens"
import { supabase } from "@src/libs/supabase"
import type {
  LastLiquidityCheckStatus,
  MaxLiquidity,
  Pairs,
} from "@src/types/interfaces"
import { logger } from "@src/utils/logger"
import {
  getPairsPerToken,
  joinAddresses,
  splitAddresses,
} from "@src/utils/tokenUtils"

export const LIST_TOKEN_PAIRS = getPairsPerToken(LIST_TOKENS)

export const setMaxLiquidityData = async (
  address_from: string,
  address_to: string,
  tokenPairsLiquidity: MaxLiquidity
): Promise<MaxLiquidity | null> => {
  if (tokenPairsLiquidity == null) {
    return null
  }

  const { error } = await supabase
    .from("solver_liquidity")
    .update({
      amount: tokenPairsLiquidity.amount,
      validated_amount: tokenPairsLiquidity.validated_amount,
      last_step_size: tokenPairsLiquidity.last_step_size,
      last_liquidity_check: tokenPairsLiquidity.last_liquidity_check,
    })
    .eq("address_from", address_from)
    .eq("address_to", address_to)

  if (error) {
    logger.error(`Could not update solver_liquidity supabase table ${error}`)
    return null
  }

  return tokenPairsLiquidity
}

export const getMaxLiquidityData = async (): Promise<Record<
  string,
  MaxLiquidity
> | null> => {
  try {
    const { data, error: errorConnecting } = await supabase
      .from("solver_liquidity")
      .select("*")

    if (errorConnecting) {
      logger.error(
        `Could not connect to solver_liquidity supabase table ${errorConnecting}`
      )

      return null
    }

    if (data?.length) {
      return data.reduce((acc: Record<string, MaxLiquidity>, cur) => {
        acc[joinAddresses([cur.address_from, cur.address_to])] = {
          amount: cur.amount,
          validated_amount: cur.validated_amount,
          last_step_size: cur.last_step_size,
          last_liquidity_check:
            cur.last_liquidity_check as LastLiquidityCheckStatus | null,
        }
        return acc
      }, {})
    }

    const pairs: {
      address_from: string
      address_to: string
      validated_amount: string
      amount: string
    }[] = []

    for (const pair of LIST_TOKEN_PAIRS) {
      pairs.push({
        address_from: pair.in.defuseAssetId,
        address_to: pair.out.defuseAssetId,
        validated_amount: pair.maxLiquidity.validated_amount.toString(),
        amount: pair.maxLiquidity.amount.toString(),
      })
    }

    const { error: errorInserting } = await supabase
      .from("solver_liquidity")
      .insert(pairs)

    if (errorInserting) {
      logger.error(
        `Could not insert into solver_liquidity supabase table ${errorInserting}`
      )
    }

    return pairs.reduce((acc: Record<string, MaxLiquidity>, cur) => {
      acc[joinAddresses([cur.address_from, cur.address_to])] = {
        amount: cur.amount,
        validated_amount: cur.validated_amount,
      }
      return acc
    }, {})
  } catch (error) {
    return null
  }
}

export const cleanUpInvalidatedTokens = async (
  tokenPairs: NonNullable<Pairs>,
  tokenPairsLiquidity: Record<string, MaxLiquidity>
) => {
  const mostFreshTokenPairs: Record<string, boolean> = {}
  for (const token of tokenPairs) {
    const joinedAddressesKey = joinAddresses([
      token.in.defuseAssetId,
      token.out.defuseAssetId,
    ])
    mostFreshTokenPairs[joinedAddressesKey] = true
  }

  for (const [tokenPair] of Object.entries(tokenPairsLiquidity)) {
    if (!mostFreshTokenPairs[tokenPair]) {
      const tokenPairs = splitAddresses(tokenPair)
      const { error } = await supabase
        .from("solver_liquidity")
        .delete()
        .eq("address_from", tokenPairs[0])
        .eq("address_to", tokenPairs[1])

      if (error) {
        logger.error(`Could not delete into solver_liquidity for ${tokenPairs}`)
      }
    }
  }
}
