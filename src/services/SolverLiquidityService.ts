import { Redis } from "@upstash/redis"

import { serialize } from "@defuse-protocol/defuse-sdk/utils"
import { LIST_TOKENS } from "@src/constants/tokens"
import type { MaxLiquidity, MaxLiquidityInJson } from "@src/types/interfaces"
import { redisEnvVariables } from "@src/utils/environment"
import { getPairsPerToken } from "@src/utils/tokenUtils"

const redis = new Redis(redisEnvVariables)

export const LIST_TOKEN_PAIRS = getPairsPerToken(LIST_TOKENS)

const STORAGE_KEY = `tokenPairsLiquidity_${process.env.NODE_ENV}`

export const setMaxLiquidityData = async (
  tokenPairsLiquidity: Record<string, MaxLiquidity | MaxLiquidityInJson> | null
): Promise<Record<string, MaxLiquidityInJson> | null> => {
  if (tokenPairsLiquidity == null) {
    return null
  }

  await redis.set(STORAGE_KEY, serialize(tokenPairsLiquidity))

  return serialize(tokenPairsLiquidity)
}

export const getMaxLiquidityData = async (): Promise<Record<
  string,
  MaxLiquidityInJson
> | null> => {
  try {
    const exists = await redis.exists(STORAGE_KEY)
    if (!exists) {
      const pairs = LIST_TOKEN_PAIRS.reduce(
        (acc: Record<string, MaxLiquidity>, pair) => {
          acc[`${pair.in.defuseAssetId}#${pair.out.defuseAssetId}`] =
            pair.maxLiquidity
          return acc
        },
        {}
      )

      await setMaxLiquidityData(pairs)

      return JSON.parse(serialize(pairs))
    }

    return await redis.get(STORAGE_KEY)
  } catch (error) {
    return null
  }
}
