import { GiftIcon } from "@phosphor-icons/react"
import Button from "@src/components/Button"
import { useSelector } from "@xstate/react"
import { useCallback, useState } from "react"
import type { ActorRefFrom } from "xstate"
import { AuthGate } from "../../../components/AuthGate"
import type { SignerCredentials } from "../../../core/formatters"
import type { RenderHostAppLink } from "../../../types/hostAppLink"
import { assert } from "../../../utils/assert"
import { formatTokenValue } from "../../../utils/format"
import {
  computeTotalBalanceDifferentDecimals,
  getUnderlyingBaseTokenInfos,
} from "../../../utils/tokenUtils"
import type { giftTakerRootMachine } from "../actors/giftTakerRootMachine"
import type { GiftInfo } from "../actors/shared/getGiftInfo"
import type { giftClaimActor } from "../actors/shared/giftClaimActor"
import { clearGiftRevealState } from "./GiftRevealCard"
import { GiftStrip } from "./GiftStrip"
import { ErrorReason } from "./shared/ErrorReason"
import { GiftClaimedMessage } from "./shared/GiftClaimedMessage"
import { GiftDescription } from "./shared/GiftDescription"
import { GiftHeader } from "./shared/GiftHeader"

export type GiftTakerFormProps = {
  giftId: string
  giftInfo: GiftInfo
  signerCredentials: SignerCredentials | null
  giftTakerRootRef: ActorRefFrom<typeof giftTakerRootMachine>
  intentHashes: string[] | null
  renderHostAppLink: RenderHostAppLink
  onReset?: () => void
}

export function GiftTakerForm({
  giftId,
  giftInfo,
  signerCredentials,
  giftTakerRootRef,
  intentHashes,
  renderHostAppLink,
  onReset,
}: GiftTakerFormProps) {
  const isLoggedIn = signerCredentials != null
  const [isHiding, setIsHiding] = useState(false)
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

  const handleIconClick = useCallback(() => {
    if (isHiding) return
    setIsHiding(true)
    setTimeout(() => {
      clearGiftRevealState(giftId, "local")
      onReset?.()
      setIsHiding(false)
    }, 400)
  }, [isHiding, giftId, onReset])

  const snapshot = useSelector(giftTakerClaimRef, (state) => state)

  const processing =
    snapshot?.matches("claiming") ||
    (intentHashes != null && intentHashes.length > 0)
  assert(amount != null)

  return (
    <div
      className="flex flex-col transition-all duration-400 ease-out"
      style={{
        transform: isHiding ? "rotateY(90deg) scale(0.95)" : "rotateY(0deg)",
        opacity: isHiding ? 0 : 1,
        transformStyle: "preserve-3d",
      }}
    >
      <GiftHeader
        title="You've received a gift!"
        icon={
          <button
            type="button"
            onClick={handleIconClick}
            className="size-16 rounded-full bg-emerald-100 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-emerald-200"
          >
            <GiftIcon weight="fill" className="size-8 text-emerald-600" />
          </button>
        }
      >
        <GiftDescription description="Sign in to claim it, no hidden fees or strings attached." />
      </GiftHeader>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <GiftStrip
            token={giftInfo.token}
            amountSlot={
              <GiftStrip.Amount
                token={giftInfo.token}
                amount={amount}
                className="text-xl font-bold text-gray-900"
              />
            }
          />
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {formatTokenValue(amount.amount, amount.decimals, {
                fractionDigits: 6,
              })}
            </div>
            <div className="text-sm text-gray-500">{giftInfo.token.symbol}</div>
          </div>
        </div>

        {giftInfo.message.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Message</div>
            <div className="text-base text-gray-900 font-medium">
              "{giftInfo.message}"
            </div>
          </div>
        )}
      </div>

      {snapshot?.context.error != null &&
        typeof snapshot.context.error?.reason === "string" && (
          <div className="mt-4">
            <ErrorReason reason={snapshot.context.error?.reason} />
          </div>
        )}

      <div className="mt-6">
        <AuthGate
          renderHostAppLink={renderHostAppLink}
          shouldRender={isLoggedIn}
        >
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
        </AuthGate>
        {processing && <GiftClaimedMessage />}
      </div>
    </div>
  )
}
