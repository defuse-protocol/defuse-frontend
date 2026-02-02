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
            <span className="inline-flex items-center gap-x-1.5 rounded-lg bg-green-100 group-hover:outline-1 group-hover:outline-green-200 px-2 py-1 text-xs font-semibold text-green-700">
              <span className="size-1.5 rounded-full bg-green-500 shrink-0" />
              Claimed
            </span>
          ) : (
            <span className="inline-flex items-center gap-x-1.5 rounded-lg bg-blue-100 group-hover:outline-1 group-hover:outline-blue-200 px-2 py-1 text-xs font-semibold text-blue-700">
              <span className="size-1.5 rounded-full bg-blue-500 shrink-0" />
              Not revealed
            </span>
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
