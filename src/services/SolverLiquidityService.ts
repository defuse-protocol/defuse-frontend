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
  private STORAGE_KEY = "tokenPairsLiquidity"

  private pairs: Pairs = null

  public getPairs = () => {
    if (!this.hasPairs()) {
      this.generatePairs()
    }

    return this.pairs
  }

  public generatePairs = (): NonNullable<Pairs> => {
    this.pairs = getPairsPerToken(LIST_TOKENS)

    return this.pairs
  }

  public hasPairs = (): boolean => {
    return this.pairs != null
  }

  public getMaxLiquidityData = async (): Promise<Record<
    string,
    MaxLiquidityInJson
  > | null> => {
    if (this.pairs == null) {
      return null
    }

    const exists = await redis.exists(this.STORAGE_KEY)
    if (!exists) {
      const pairs = this.pairs.reduce(
        (acc: Record<string, MaxLiquidity>, pair) => {
          acc[`${pair.in.defuseAssetId}#${pair.out.defuseAssetId}`] =
            pair.maxLiquidity
          return acc
        },
        {}
      )

      await this.setMaxLiquidityData(pairs)
      return JSON.parse(serialize(pairs))
    }

    return await redis.get(this.STORAGE_KEY)
  }

  public setMaxLiquidityData = async (
    tokenPairsLiquidity: Record<
      string,
      MaxLiquidity | MaxLiquidityInJson
    > | null
  ): Promise<Record<string, MaxLiquidityInJson> | null> => {
    if (tokenPairsLiquidity == null) {
      return null
    }

    await redis.set(this.STORAGE_KEY, serialize(tokenPairsLiquidity))

    return serialize(tokenPairsLiquidity)
  }
}
