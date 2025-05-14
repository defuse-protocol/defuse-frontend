import { Redis } from "@upstash/redis"

import { serialize } from "@defuse-protocol/defuse-sdk/utils"
import { LIST_TOKENS } from "@src/constants/tokens"
import type {
  MaxLiquidity,
  MaxLiquidityInJson,
  Pairs,
} from "@src/types/interfaces"
import { getPairsPerToken } from "@src/utils/tokenUtils"

const redis = Redis.fromEnv()

export class SolverLiquidityService {
  private constructor() {}

  private static pairs: Pairs = null

  public static getPairs = () => {
    if (!SolverLiquidityService.hasPairs()) {
      SolverLiquidityService.generatePairs()
    }

    return SolverLiquidityService.pairs
  }

  public static generatePairs = (): NonNullable<Pairs> => {
    SolverLiquidityService.pairs = getPairsPerToken(LIST_TOKENS)

    return SolverLiquidityService.pairs
  }

  public static hasPairs = (): boolean => {
    return SolverLiquidityService.pairs != null
  }

  public static getMaxLiquidityData = async (): Promise<Record<
    string,
    MaxLiquidityInJson
  > | null> => {
    if (SolverLiquidityService.pairs == null) {
      return null
    }

    const exists = await redis.exists("tokenPairsLiquidity")
    if (!exists) {
      const pairs = SolverLiquidityService.pairs.reduce(
        (acc: Record<string, MaxLiquidity>, pair) => {
          acc[`${pair.in.defuseAssetId}#${pair.out.defuseAssetId}`] =
            pair.maxLiquidity
          return acc
        },
        {}
      )

      await SolverLiquidityService.setMaxLiquidityData(pairs)
      return JSON.parse(serialize(pairs))
    }

    return await redis.get("tokenPairsLiquidity")
  }

  public static setMaxLiquidityData = async (
    tokenPairsLiquidity: Record<
      string,
      MaxLiquidity | MaxLiquidityInJson
    > | null
  ): Promise<Record<string, MaxLiquidityInJson> | null> => {
    if (tokenPairsLiquidity == null) {
      return null
    }

    await redis.set("tokenPairsLiquidity", serialize(tokenPairsLiquidity))

    return await redis.get("tokenPairsLiquidity")
  }
}
