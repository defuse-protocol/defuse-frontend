import type {
  BaseTokenInfo,
  UnifiedTokenInfo,
} from "@src/components/DefuseSDK/types"
import { isBaseToken } from "@src/components/DefuseSDK/utils"
import { DEPRECATED_TOKENS } from "@src/constants/tokens"
import type { PairItem, Pairs } from "@src/types/interfaces"

export const joinAddresses = (addresses: string[]): string =>
  addresses.join("#")

export const splitAddresses = (addresses: string): string[] =>
  addresses.split("#")

const generatePairs = (arr: PairItem[]): NonNullable<Pairs> => {
  const pairs: NonNullable<Pairs> = []
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      if (i !== j) {
        const defaultAmount = BigInt(
          `1${"0".repeat(Math.min(arr[i].decimals, arr[j].decimals))}`
        )

        pairs.push({
          in: arr[i],
          out: arr[j],
          maxLiquidity: {
            amount: defaultAmount.toString(),
            validated_amount: defaultAmount.toString(),
          },
        })
      }
    }
  }

  return pairs
}

export const getPairsPerToken = (
  tokenList: (BaseTokenInfo | UnifiedTokenInfo)[]
): NonNullable<Pairs> => {
  const getPairsPerToken: NonNullable<Pairs>[] = []

  tokenList.map((token) => {
    if (isBaseToken(token)) {
      return
    }

    const defuseAssetIds = token.groupedTokens.reduce(
      (acc: Record<string, PairItem>, curr) => {
        if (DEPRECATED_TOKENS[curr.defuseAssetId]) {
          return acc
        }

        acc[curr.defuseAssetId] = {
          defuseAssetId: curr.defuseAssetId,
          decimals: curr.decimals,
        }
        return acc
      },
      {}
    )

    if (Object.keys(defuseAssetIds).length === 1) {
      return
    }

    getPairsPerToken.push(generatePairs(Object.values(defuseAssetIds)))
  })

  return getPairsPerToken.flat()
}
