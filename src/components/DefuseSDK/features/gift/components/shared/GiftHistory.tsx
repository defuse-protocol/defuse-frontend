import Button from "@src/components/Button"
import { useEffect, useState } from "react"
import type { SignerCredentials } from "../../../../core/formatters"
import type { TokenInfo } from "../../../../types/base"
import { useGiftInfos } from "../../hooks/useGiftInfos"
import { useGiftPagination } from "../../hooks/useGiftPagination"
import { GiftClaimActorProvider } from "../../providers/GiftClaimActorProvider"
import type { GiftMakerHistory } from "../../stores/giftMakerHistory"
import type { GenerateLink } from "../../types/sharedTypes"
import { GiftHistoryEmpty, GiftHistoryNotLoggedIn } from "./GiftHistoryEmpty"
import { GiftHistorySkeleton } from "./GiftHistorySkeleton"
import { GiftMakerHistoryItem } from "./GiftMakerHistoryItem"

export type GiftHistoryProps = {
  signerCredentials: SignerCredentials | null
  tokenList: TokenInfo[]
  generateLink: GenerateLink
  gifts: GiftMakerHistory[] | undefined
}

export function GiftHistory({
  signerCredentials,
  tokenList,
  generateLink,
  gifts,
}: GiftHistoryProps) {
  const [mounted, setMounted] = useState(false)
  const { giftInfos, loading } = useGiftInfos(gifts, tokenList)
  const { visibleGiftItems, hasMore, showMore } = useGiftPagination(giftInfos)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Always show skeleton until mounted to prevent SSR/hydration mismatch
  if (!mounted || loading) {
    return <GiftHistorySkeleton />
  }

  if (!signerCredentials) {
    return <GiftHistoryNotLoggedIn />
  }

  if (giftInfos.length === 0) {
    return <GiftHistoryEmpty />
  }

  return (
    <GiftClaimActorProvider signerCredentials={signerCredentials}>
      <section className="mt-6">
        <div className="rounded-2xl border border-gray-200 overflow-hidden px-4">
          {visibleGiftItems?.map((giftInfo, index) => (
            <div
              key={giftInfo.secretKey ?? giftInfo.iv ?? `gift-${index}`}
              className="border-b border-gray-100 last:border-b-0"
            >
              <GiftMakerHistoryItem
                giftInfo={giftInfo}
                generateLink={generateLink}
                signerCredentials={signerCredentials}
              />
            </div>
          ))}
        </div>
        {hasMore && (
          <Button
            type="button"
            size="md"
            variant="secondary"
            onClick={showMore}
            fullWidth
            className="mt-3"
          >
            Show more
          </Button>
        )}
      </section>
    </GiftClaimActorProvider>
  )
}
