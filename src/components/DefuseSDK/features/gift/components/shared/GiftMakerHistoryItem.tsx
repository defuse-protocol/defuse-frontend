import type { SignerCredentials } from "@src/components/DefuseSDK/core/formatters"
import ListItem from "@src/components/ListItem"
import { useCallback, useEffect, useRef, useState } from "react"
import { type ActorRefFrom, createActor } from "xstate"
import AssetComboIcon from "../../../../components/Asset/AssetComboIcon"
import type { TokenValue } from "../../../../types/base"
import { formatTokenValue } from "../../../../utils/format"
import {
  computeTotalBalanceDifferentDecimals,
  getUnderlyingBaseTokenInfos,
} from "../../../../utils/tokenUtils"
import {
  type giftMakerReadyActor,
  giftMakerReadyActor as giftMakerReadyActorMachine,
} from "../../actors/giftMakerReadyActor"
import type { GenerateLink } from "../../types/sharedTypes"
import { formatGiftDate } from "../../utils/formattedDate"
import type { GiftInfo } from "../../utils/parseGiftInfos"
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
  const actorRef = useRef<ActorRefFrom<typeof giftMakerReadyActor> | null>(null)

  const amount = computeTotalBalanceDifferentDecimals(
    getUnderlyingBaseTokenInfos(giftInfo.token),
    giftInfo.tokenDiff,
    { strict: false }
  )

  const openDialog = useCallback(() => {
    actorRef.current?.stop()
    actorRef.current = createActor(giftMakerReadyActorMachine, {
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
    setShowDialog(true)
  }, [giftInfo, signerCredentials, amount])

  const closeDialog = useCallback(() => {
    actorRef.current?.stop()
    actorRef.current = null
    setShowDialog(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (actorRef.current) {
        actorRef.current.stop()
        actorRef.current = null
      }
    }
  }, [])

  return (
    <>
      <ListItem onClick={openDialog}>
        <AssetComboIcon {...giftInfo.token} />
        <ListItem.Content>
          <ListItem.Title>
            {amount != null &&
              `${formatTokenValue(amount.amount, amount.decimals, { fractionDigits: 6 })} ${giftInfo.token.symbol}`}
          </ListItem.Title>
          <ListItem.Subtitle>
            {formatGiftDate(giftInfo.updatedAt)}
          </ListItem.Subtitle>
        </ListItem.Content>
        <ListItem.Content align="end">
          {giftInfo.status === "claimed" && (
            <span className="inline-flex items-center gap-x-1.5 rounded-lg bg-green-100 group-hover:outline-1 group-hover:outline-green-200 px-2 py-1 text-xs font-semibold text-green-700">
              <span className="size-1.5 rounded-full bg-green-600 shrink-0" />
              Claimed
            </span>
          )}
        </ListItem.Content>
      </ListItem>

      {showDialog && actorRef.current && (
        <GiftMakerReadyDialog
          readyGiftRef={actorRef.current}
          generateLink={generateLink}
          signerCredentials={signerCredentials}
          onClose={closeDialog}
          isClaimed={giftInfo.status === "claimed"}
        />
      )}
    </>
  )
}
