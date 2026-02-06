import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import PageHeader from "@src/components/PageHeader"
import { useSelector } from "@xstate/react"
import { useCallback } from "react"
import type { ActorRefFrom } from "xstate"
import type { SignerCredentials } from "../../../core/formatters"
import { assert } from "../../../utils/assert"
import { formatTokenValue } from "../../../utils/format"
import {
  computeTotalBalanceDifferentDecimals,
  getUnderlyingBaseTokenInfos,
} from "../../../utils/tokenUtils"
import type { giftTakerRootMachine } from "../actors/giftTakerRootMachine"
import type { GiftInfo } from "../actors/shared/getGiftInfo"
import type { giftClaimActor } from "../actors/shared/giftClaimActor"

export type GiftTakerFormProps = {
  giftInfo: GiftInfo
  signerCredentials: SignerCredentials | null
  giftTakerRootRef: ActorRefFrom<typeof giftTakerRootMachine>
  intentHashes: string[] | null
}

export function GiftTakerForm({
  giftInfo,
  signerCredentials,
  giftTakerRootRef,
  intentHashes,
}: GiftTakerFormProps) {
  const amount = computeTotalBalanceDifferentDecimals(
    getUnderlyingBaseTokenInfos(giftInfo.token),
    giftInfo.tokenDiff,
    { strict: false }
  )
  const giftTakerClaimRef = useSelector(
    giftTakerRootRef,
    (state) =>
      state.children.giftTakerClaimRef as
        | ActorRefFrom<typeof giftClaimActor>
        | undefined
  )

  const isInClaimingState = useSelector(giftTakerRootRef, (state) =>
    state.matches("claiming")
  )

  const claimGift = useCallback(() => {
    if (signerCredentials != null && isInClaimingState) {
      giftTakerClaimRef?.send({
        type: "CONFIRM_CLAIM",
        params: {
          giftInfo,
          signerCredentials,
        },
      })
    }
  }, [signerCredentials, isInClaimingState, giftTakerClaimRef, giftInfo])

  const snapshot = useSelector(giftTakerClaimRef, (state) => state)

  const processing =
    snapshot?.matches("claiming") ||
    (intentHashes != null && intentHashes.length > 0)
  assert(amount != null)

  return (
    <>
      <PageHeader
        title="You've received a gift!"
        subtitle="Sign in to claim it, no hidden fees or strings attached."
      />

      <div className="p-5 pt-12 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-200 mt-7 gap-7">
        <div className="flex flex-col items-center gap-5">
          <AssetComboIcon {...giftInfo.token} sizeClassName="size-13" />
          <div className="text-2xl/7 font-bold text-gray-900 tracking-tight">
            {formatTokenValue(amount.amount, amount.decimals, {
              fractionDigits: 6,
            })}{" "}
            {giftInfo.token.symbol}
          </div>
        </div>

        {giftInfo.message?.length > 0 && (
          <div className="w-full border border-gray-200 rounded-3xl flex gap-3 p-3 items-center">
            <div className="bg-gray-100 rounded-full size-10 shrink-0 flex items-center justify-center">
              <ChatBubbleBottomCenterTextIcon className="size-5 text-gray-500" />
            </div>
            <div className="sr-only">Message</div>
            <div className="text-base font-semibold text-gray-600">
              {giftInfo.message}
            </div>
          </div>
        )}

        <Button
          onClick={claimGift}
          type="button"
          size="xl"
          variant="primary"
          fullWidth
          loading={processing}
          disabled={processing || signerCredentials == null}
        >
          {processing
            ? "Claiming..."
            : signerCredentials == null
              ? "Sign in to claim"
              : "Claim gift"}
        </Button>
      </div>
    </>
  )
}
