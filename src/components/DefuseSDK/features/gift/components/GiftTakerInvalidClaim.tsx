import { ActionIcon } from "./shared/ActionIcon"
import { ErrorReason } from "./shared/ErrorReason"
import { GiftDescription } from "./shared/GiftDescription"
import { GiftHeader } from "./shared/GiftHeader"

export function GiftTakerInvalidClaim({ error }: { error: string }) {
  return (
    <>
      <GiftHeader title="Oops!" icon={<ActionIcon type="error" />}>
        <GiftDescription
          description="Looks like this gift is no longer valid — it has either been claimed
            or revoked by the sender."
        />
        <GiftDescription description="Check back with the sender for an update." />
      </GiftHeader>

      {/* Error Section */}
      {error != null && <ErrorReason reason={error} />}
    </>
  )
}
