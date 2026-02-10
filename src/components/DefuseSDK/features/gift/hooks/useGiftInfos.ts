import { logger } from "@src/utils/logger"
import { useEffect, useState } from "react"
import type { TokenInfo } from "../../../types/base"
import type { GiftMakerHistory } from "../stores/giftMakerHistory"
import { type GiftInfo, parseGiftInfos } from "../utils/parseGiftInfos"

type UseGiftInfosReturn = {
  giftInfos: GiftInfo[]
  loading: boolean
}

export function useGiftInfos(
  gifts: GiftMakerHistory[] | undefined,
  tokenList: TokenInfo[]
): UseGiftInfosReturn {
  const [giftInfos, setGiftInfos] = useState<GiftInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (gifts === undefined) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    parseGiftInfos(tokenList, gifts).then((giftsResult) => {
      if (cancelled) return
      if (giftsResult.isErr()) {
        logger.error("Failed to parse gift infos", {
          error: giftsResult.unwrapErr(),
        })
        setGiftInfos([])
        setLoading(false)
        return
      }
      const filteredGifts = giftsResult
        .unwrap()
        .filter((gift) => gift.status !== "draft")
      setGiftInfos(filteredGifts)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [gifts, tokenList])

  return {
    giftInfos,
    loading,
  }
}
