import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { useSelector } from "@xstate/react"
import { useCallback, useMemo } from "react"
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
  const loginUrl = useMemo(() => {
    if (typeof window === "undefined") return "/login"
    const hash = window.location.hash
    return `/login?redirect=${encodeURIComponent(`/gift${hash}`)}`
  }, [])

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

  const loggedIn = signerCredentials != null

  return (
    <>
      <h1 className="text-2xl/7 md:text-4xl/10 text-balance font-bold tracking-tight">
        You‘ve received a gift of
        <span className="flex items-center gap-1 md:gap-2">
          <AssetComboIcon
            {...giftInfo.token}
            sizeClassName="shrink-0 size-6 md:size-8"
          />
          <span>
            {formatTokenValue(amount.amount, amount.decimals, {
              fractionDigits: 6,
            })}{" "}
            {giftInfo.token.symbol}
          </span>
        </span>
      </h1>

      {giftInfo.message?.length > 0 && (
        <div className="mt-5 w-full border border-gray-200 rounded-3xl flex gap-3 p-2 md:p-3 items-start">
          <div className="bg-gray-100 rounded-full size-10 shrink-0 flex items-center justify-center">
            <ChatBubbleBottomCenterTextIcon className="size-5 text-gray-500" />
          </div>
          <div className="sr-only">Message</div>
          <div className="text-base font-semibold text-gray-600 min-h-10 flex items-center">
            {giftInfo.message}
          </div>
        </div>
      )}

      <div className="mt-8 md:mt-12">
        {loggedIn ? (
          <Button
            onClick={claimGift}
            type="button"
            size="xl"
            variant="primary"
            fullWidth
            loading={processing}
            disabled={processing}
          >
            {processing ? "Claiming..." : "Claim gift"}
          </Button>
        ) : (
          <>
            <Button
              href={loginUrl}
              type="button"
              size="xl"
              variant="primary"
              fullWidth
            >
              Sign in to claim
            </Button>
            <p className="mt-3 text-sm text-gray-500 font-medium text-center text-balance">
              No hidden fees or strings attached.
            </p>
          </>
        )}
      </div>
    </>
  )
}
