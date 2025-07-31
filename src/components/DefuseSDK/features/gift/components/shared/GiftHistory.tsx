import { ButtonCustom } from "../../../../components/Button/ButtonCustom"
import { Island } from "../../../../components/Island"
import type { SignerCredentials } from "../../../../core/formatters"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../../../../types/base"
import { useGiftInfos } from "../../hooks/useGiftInfos"
import { useGiftPagination } from "../../hooks/useGiftPagination"
import { GiftClaimActorProvider } from "../../providers/GiftClaimActorProvider"
import type { GiftMakerHistory } from "../../stores/giftMakerHistory"
import type { GenerateLink } from "../../types/sharedTypes"
import { GiftHistoryEmpty } from "./GiftHistoryEmpty"
import { GiftHistorySkeleton } from "./GiftHistorySkeleton"
import { GiftMakerHistoryItem } from "./GiftMakerHistoryItem"

export type GiftHistoryProps = {
  signerCredentials: SignerCredentials | null
  tokenList: (BaseTokenInfo | UnifiedTokenInfo)[]
  generateLink: GenerateLink
  gifts: GiftMakerHistory[] | undefined
}

export function GiftHistory(props: GiftHistoryProps) {
  return (
    <Island className="py-4">
      <Content {...props} />
    </Island>
  )
}

function Content({
  signerCredentials,
  tokenList,
  generateLink,
  gifts,
}: GiftHistoryProps) {
  const { giftInfos, loading } = useGiftInfos(gifts, tokenList)
  const { visibleGiftItems, hasMore, showMore } = useGiftPagination(giftInfos)

  if (loading) {
    return <GiftHistorySkeleton />
  }

  if (!signerCredentials || giftInfos.length === 0) {
    return <GiftHistoryEmpty />
  }

  return (
    <GiftClaimActorProvider signerCredentials={signerCredentials}>
      <div className="text-sm font-bold text-gray-12 pb-1.5">Your gifts</div>
      {visibleGiftItems?.map((giftInfo) => (
        <GiftMakerHistoryItem
          key={crypto.randomUUID()}
          giftInfo={giftInfo}
          generateLink={generateLink}
          signerCredentials={signerCredentials}
        />
      ))}
      {hasMore && (
        <ButtonCustom
          type="submit"
          size="sm"
          variant="secondary"
          onClick={showMore}
          className="w-full mt-2.5"
        >
          Show more
        </ButtonCustom>
      )}
    </GiftClaimActorProvider>
  )
}
