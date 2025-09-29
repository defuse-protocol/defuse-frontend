import {
  CheckCircle,
  Check as CheckIcon,
  Copy as CopyIcon,
  Eye as EyeIcon,
  Trash as TrashIcon,
} from "@phosphor-icons/react"
import { IconButton } from "@radix-ui/themes"
import type { SignerCredentials } from "@src/components/DefuseSDK/core/formatters"
import { logger } from "@src/utils/logger"
import { useCallback, useContext, useState } from "react"
import { createActor } from "xstate"
import { Copy } from "../../../../components/IntentCard/CopyButton"
import type { TokenValue } from "../../../../types/base"
import { assert } from "../../../../utils/assert"
import {
  computeTotalBalanceDifferentDecimals,
  getUnderlyingBaseTokenInfos,
} from "../../../../utils/tokenUtils"
import { giftMakerReadyActor } from "../../actors/giftMakerReadyActor"
import { GiftClaimActorContext } from "../../providers/GiftClaimActorProvider"
import { giftMakerHistoryStore } from "../../stores/giftMakerHistory"
import type { GenerateLink } from "../../types/sharedTypes"
import type { GiftInfo } from "../../utils/parseGiftInfos"
import { GiftMakerReadyDialog } from "../GiftMakerReadyDialog"
import { GiftStrip } from "../GiftStrip"

export function GiftMakerHistoryItem({
  giftInfo,
  generateLink,
  signerCredentials,
}: {
  giftInfo: GiftInfo
  generateLink: GenerateLink
  signerCredentials: SignerCredentials
}) {
  const [showDialog, setShowDialog] = useState(false)
  const amount = computeTotalBalanceDifferentDecimals(
    getUnderlyingBaseTokenInfos(giftInfo.token),
    giftInfo.tokenDiff,
    { strict: false }
  )

  const { cancelGift } = useContext(GiftClaimActorContext)

  const readyGiftRef = createActor(giftMakerReadyActor, {
    input: {
      giftInfo,
      signerCredentials,
      parsed: {
        token: giftInfo.token,
        amount: amount as TokenValue,
        message: giftInfo.message,
      },
      iv: giftInfo.iv,
    },
  }).start()

  const handleCloseDialog = useCallback(() => {
    setShowDialog(false)
  }, [])

  const cancellationOrRemoval = useCallback(async () => {
    if (giftInfo.status === "claimed") {
      await removeClaimedGiftFromStore({ giftInfo, signerCredentials })
    } else {
      await cancelGift({ giftInfo, signerCredentials })
    }
  }, [giftInfo, signerCredentials, cancelGift])

  return (
    <>
      <div className="py-2.5 flex items-center justify-between gap-2.5">
        {amount != null && (
          <GiftStrip
            token={giftInfo.token}
            amountSlot={
              <GiftStrip.Amount
                token={giftInfo.token}
                amount={amount}
                className="text-gray-12"
              />
            }
            dateSlot={<GiftStrip.Date updatedAt={giftInfo.updatedAt} />}
          />
        )}
        <div className="flex gap-2 items-center">
          {giftInfo.status === "pending" && (
            <>
              <IconButton
                type="button"
                variant="outline"
                color="gray"
                className="rounded-lg"
                onClick={() => setShowDialog(true)}
              >
                <EyeIcon weight="bold" />
              </IconButton>
              <Copy
                text={() =>
                  generateLink({
                    secretKey: giftInfo.secretKey,
                    message: giftInfo.message,
                    iv: giftInfo.iv,
                  })
                }
              >
                {(copied) => (
                  <IconButton
                    type="button"
                    variant="outline"
                    color="gray"
                    className="rounded-lg"
                  >
                    <div className="flex gap-2 items-center">
                      {copied ? (
                        <CheckIcon weight="bold" />
                      ) : (
                        <CopyIcon weight="bold" />
                      )}
                    </div>
                  </IconButton>
                )}
              </Copy>
            </>
          )}
          {giftInfo.status === "claimed" && (
            <div className="flex gap-1 items-center">
              <CheckCircle width={12} height={12} className="text-accent-11" />
              <span className="text-xs font-medium text-accent-11">
                Claimed
              </span>
            </div>
          )}
          <IconButton
            type="button"
            onClick={cancellationOrRemoval}
            variant="outline"
            color="gray"
            className="rounded-lg"
          >
            <TrashIcon weight="bold" />
          </IconButton>
        </div>
      </div>
      {showDialog && (
        <GiftMakerReadyDialog
          readyGiftRef={readyGiftRef}
          generateLink={generateLink}
          signerCredentials={signerCredentials}
          onClose={handleCloseDialog}
        />
      )}
    </>
  )
}

async function removeClaimedGiftFromStore({
  giftInfo,
  signerCredentials,
}: {
  giftInfo: GiftInfo
  signerCredentials: SignerCredentials
}) {
  assert(giftInfo.secretKey, "giftInfo.secretKey is not set")
  const result = await giftMakerHistoryStore
    .getState()
    .removeGift(giftInfo.secretKey, signerCredentials)
  if (result.tag === "err") {
    logger.error(new Error("Failed to remove gift", { cause: result.reason }))
  }
}
