import { Clock as ClockIcon } from "@phosphor-icons/react"
import { ActionIcon } from "./shared/ActionIcon"
import { ErrorReason } from "./shared/ErrorReason"
import { GiftDescription } from "./shared/GiftDescription"
import { GiftHeader } from "./shared/GiftHeader"

export function GiftTakerInvalidClaim({ error }: { error: string }) {
  const isExpired = error === "GIFT_EXPIRED"

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <GiftHeader
        title={isExpired ? "Gift Expired" : "Oops!"}
        icon={
          isExpired ? (
            <div className="w-16 h-16 rounded-full bg-amber-3 flex justify-center items-center">
              <ClockIcon weight="bold" className="size-8 text-amber-11" />
            </div>
          ) : (
            <ActionIcon type="error" />
          )
        }
      >
        {isExpired ? (
          <>
            <GiftDescription description="This gift has expired and can no longer be claimed." />
            <GiftDescription description="The sender may have set an expiration date. Contact them for a new gift link." />
          </>
        ) : (
          <>
            <GiftDescription description="Looks like this gift is no longer valid — it has either been claimed or revoked by the sender." />
            <GiftDescription description="Check back with the sender for an update." />
          </>
        )}
      </GiftHeader>

      {error != null && !isExpired && <ErrorReason reason={error} />}
    </div>
  )
}
