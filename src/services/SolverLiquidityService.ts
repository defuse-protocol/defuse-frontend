import { LIST_TOKENS } from "@src/constants/tokens"
import { supabase } from "@src/libs/supabase"
import type {
  LastLiquidityCheckStatus,
  MaxLiquidity,
} from "@src/types/interfaces"
import { logger } from "@src/utils/logger"
import { getPairsPerToken } from "@src/utils/tokenUtils"

export const LIST_TOKEN_PAIRS = getPairsPerToken(LIST_TOKENS)

export const setMaxLiquidityData = async (
  address_from_to: string,
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
    .eq("address_from_to", address_from_to)

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
        acc[cur.address_from_to] = {
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
      address_from_to: string
      validated_amount: string
      amount: string
    }[] = []

    for (const pair of LIST_TOKEN_PAIRS) {
      const fromTo = `${pair.in.defuseAssetId}#${pair.out.defuseAssetId}`
      pairs.push({
        address_from_to: fromTo,
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
      acc[cur.address_from_to] = {
        amount: cur.amount,
        validated_amount: cur.validated_amount,
      }
      return acc
    }, {})
  } catch (error) {
    return null
  }
}
