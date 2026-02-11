import { PlusIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"
import EmptyState from "@src/components/EmptyState"
import ListItemsSkeleton from "@src/components/ListItemsSkeleton"
import type { SignerCredentials } from "../../../../core/formatters"
import type { TokenInfo } from "../../../../types/base"
import { useGiftInfos } from "../../hooks/useGiftInfos"
import type { GiftMakerHistory } from "../../stores/giftMakerHistory"
import type { GenerateLink } from "../../types/sharedTypes"
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

  if (loading) {
    return <ListItemsSkeleton count={3} loading className="mt-6" />
  }

  if (!signerCredentials) {
    return (
      <EmptyState className="mt-6">
        <EmptyState.Title>Connect your wallet</EmptyState.Title>
        <EmptyState.Description>
          Connect your wallet to create and manage gift links
        </EmptyState.Description>
      </EmptyState>
    )
  }

  if (giftInfos.length === 0) {
    return (
      <EmptyState className="mt-6">
        <EmptyState.Title>No gifts yet</EmptyState.Title>
        <EmptyState.Description>
          Create a gift and send it to your friends
        </EmptyState.Description>
        <Button href="/gifts/new" size="xl" className="mt-4">
          <PlusIcon className="size-5 shrink-0" />
          Create a gift
        </Button>
      </EmptyState>
    )
  }

  return (
    <section className="mt-6 space-y-1">
      {giftInfos?.map((giftInfo, index) => (
        <GiftMakerHistoryItem
          key={giftInfo.secretKey ?? giftInfo.iv ?? `gift-${index}`}
          giftInfo={giftInfo}
          generateLink={generateLink}
          signerCredentials={signerCredentials}
        />
      ))}
    </section>
  )
}
