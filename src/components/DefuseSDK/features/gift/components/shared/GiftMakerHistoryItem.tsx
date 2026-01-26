import {
  CheckCircle,
  Check as CheckIcon,
  Clock as ClockIcon,
  Copy as CopyIcon,
  Eye as EyeIcon,
  PencilSimple as PencilIcon,
  Trash as TrashIcon,
  Warning as WarningIcon,
} from "@phosphor-icons/react"
import Button from "@src/components/Button"
import type { SignerCredentials } from "@src/components/DefuseSDK/core/formatters"
import ListItem from "@src/components/ListItem"
import { logger } from "@src/utils/logger"
import { useCallback, useContext, useMemo, useState } from "react"
import { createActor } from "xstate"
import AssetComboIcon from "../../../../components/Asset/AssetComboIcon"
import { Copy } from "../../../../components/IntentCard/CopyButton"
import type { TokenValue } from "../../../../types/base"
import { assert } from "../../../../utils/assert"
import { formatTokenValue } from "../../../../utils/format"
import {
  computeTotalBalanceDifferentDecimals,
  getUnderlyingBaseTokenInfos,
} from "../../../../utils/tokenUtils"
import { giftMakerReadyActor } from "../../actors/giftMakerReadyActor"
import { GiftClaimActorContext } from "../../providers/GiftClaimActorProvider"
import { giftMakerHistoryStore } from "../../stores/giftMakerHistory"
import type { GenerateLink } from "../../types/sharedTypes"
import { formatGiftDate } from "../../utils/formattedDate"
import type { GiftInfo } from "../../utils/parseGiftInfos"
import { GiftExpirationEditDialog } from "../GiftExpirationEditDialog"
import { GiftMakerReadyDialog } from "../GiftMakerReadyDialog"

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
  const [showExpirationDialog, setShowExpirationDialog] = useState(false)
  const amount = computeTotalBalanceDifferentDecimals(
    getUnderlyingBaseTokenInfos(giftInfo.token),
    giftInfo.tokenDiff,
    { strict: false }
  )

  const { cancelGift } = useContext(GiftClaimActorContext)

  const readyGiftRef = useMemo(
    () =>
      createActor(giftMakerReadyActor, {
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
      }).start(),
    [giftInfo, signerCredentials, amount]
  )

  const handleCloseDialog = useCallback(() => {
    setShowDialog(false)
  }, [])

  const handleCloseExpirationDialog = useCallback(() => {
    setShowExpirationDialog(false)
  }, [])

  const isExpired =
    giftInfo.expiresAt != null && giftInfo.expiresAt < Date.now()

  const cancellationOrRemoval = useCallback(async () => {
    if (giftInfo.status === "claimed") {
      await removeClaimedGiftFromStore({ giftInfo, signerCredentials })
    } else {
      await cancelGift({ giftInfo, signerCredentials })
    }
  }, [giftInfo, signerCredentials, cancelGift])

  const popoverContent = (
    <>
      {giftInfo.status === "pending" && (
        <>
          <Button size="sm" onClick={() => setShowDialog(true)}>
            <EyeIcon weight="bold" className="size-4" />
            View
          </Button>
          <Button size="sm" onClick={() => setShowExpirationDialog(true)}>
            <PencilIcon weight="bold" className="size-4" />
            Edit
          </Button>
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
              <Button size="sm">
                {copied ? (
                  <CheckIcon weight="bold" className="size-4" />
                ) : (
                  <CopyIcon weight="bold" className="size-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
          </Copy>
        </>
      )}
      <Button size="sm" onClick={cancellationOrRemoval}>
        <TrashIcon weight="bold" className="size-4" />
        {giftInfo.status === "claimed" ? "Remove" : "Cancel"}
      </Button>
    </>
  )

  return (
    <>
      <ListItem popoverContent={popoverContent}>
        <AssetComboIcon {...giftInfo.token} />
        <ListItem.Content>
          <ListItem.Title>
            {amount != null &&
              `${formatTokenValue(amount.amount, amount.decimals)} ${giftInfo.token.symbol}`}
          </ListItem.Title>
          <ListItem.Subtitle>
            {formatGiftDate(giftInfo.updatedAt)}
          </ListItem.Subtitle>
        </ListItem.Content>
        <ListItem.Content align="end">
          {giftInfo.status === "claimed" ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle weight="fill" className="size-4" />
              <span className="text-sm font-medium">Claimed</span>
            </div>
          ) : isExpired ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600">
              <WarningIcon weight="bold" className="size-3" />
              <span className="text-xs font-semibold">Expired</span>
            </div>
          ) : giftInfo.expiresAt != null ? (
            <div className="flex items-center gap-1 text-gray-500">
              <ClockIcon weight="bold" className="size-3" />
              <span className="text-xs">
                Expires {formatGiftDate(giftInfo.expiresAt)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">Pending</span>
          )}
        </ListItem.Content>
      </ListItem>
      {showDialog && (
        <GiftMakerReadyDialog
          readyGiftRef={readyGiftRef}
          generateLink={generateLink}
          signerCredentials={signerCredentials}
          onClose={handleCloseDialog}
        />
      )}
      {showExpirationDialog && (
        <GiftExpirationEditDialog
          giftInfo={giftInfo}
          signerCredentials={signerCredentials}
          onClose={handleCloseExpirationDialog}
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
