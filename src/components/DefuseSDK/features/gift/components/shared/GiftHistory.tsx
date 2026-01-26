import Button from "@src/components/Button"
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
  const { giftInfos, loading } = useGiftInfos(gifts, tokenList)
  const { visibleGiftItems, hasMore, showMore } = useGiftPagination(giftInfos)

  if (!signerCredentials) {
    return <GiftHistoryNotLoggedIn />
  }

  if (loading) {
    return <GiftHistorySkeleton />
  }

  if (giftInfos.length === 0) {
    return <GiftHistoryEmpty />
  }

  return (
    <GiftClaimActorProvider signerCredentials={signerCredentials}>
      <section className="mt-6 space-y-1">
        {visibleGiftItems?.map((giftInfo) => (
          <GiftMakerHistoryItem
            key={giftInfo.secretKey ?? giftInfo.iv ?? crypto.randomUUID()}
            giftInfo={giftInfo}
            generateLink={generateLink}
            signerCredentials={signerCredentials}
          />
        ))}
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
