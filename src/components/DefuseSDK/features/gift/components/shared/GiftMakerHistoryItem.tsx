import { CheckCircleIcon, ClockIcon } from "@phosphor-icons/react"
import type { SignerCredentials } from "@src/components/DefuseSDK/core/formatters"
import ListItem from "@src/components/ListItem"
import { useMemo, useState } from "react"
import { createActor } from "xstate"
import AssetComboIcon from "../../../../components/Asset/AssetComboIcon"
import type { TokenValue } from "../../../../types/base"
import { formatTokenValue } from "../../../../utils/format"
import {
  computeTotalBalanceDifferentDecimals,
  getUnderlyingBaseTokenInfos,
} from "../../../../utils/tokenUtils"
import { giftMakerReadyActor } from "../../actors/giftMakerReadyActor"
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
  const amount = computeTotalBalanceDifferentDecimals(
    getUnderlyingBaseTokenInfos(giftInfo.token),
    giftInfo.tokenDiff,
    { strict: false }
  )

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

  return (
    <>
      <ListItem onClick={() => setShowDialog(true)}>
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
          {giftInfo.status === "claimed" ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircleIcon weight="fill" className="size-3.5" />
              <span className="text-xs font-semibold">Claimed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
              <ClockIcon weight="bold" className="size-3.5" />
              <span className="text-xs font-semibold">Not revealed</span>
            </div>
          )}
        </ListItem.Content>
      </ListItem>
      {showDialog && (
        <GiftMakerReadyDialog
          readyGiftRef={readyGiftRef}
          generateLink={generateLink}
          signerCredentials={signerCredentials}
          onClose={() => setShowDialog(false)}
          isClaimed={giftInfo.status === "claimed"}
        />
      )}
    </>
  )
}
