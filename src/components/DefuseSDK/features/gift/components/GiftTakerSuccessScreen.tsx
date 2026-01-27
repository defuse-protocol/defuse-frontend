import { solverRelay } from "@defuse-protocol/internal-utils"
import { Button } from "@radix-ui/themes"
import {
  computeTotalBalanceDifferentDecimals,
  getUnderlyingBaseTokenInfos,
} from "@src/components/DefuseSDK/utils/tokenUtils"
import { useQuery } from "@tanstack/react-query"
import { CopyButton } from "../../../components/IntentCard/CopyButton"
import type { RenderHostAppLink } from "../../../types/hostAppLink"
import { assert } from "../../../utils/assert"
import type { GiftInfo } from "../actors/shared/getGiftInfo"
import { GiftStrip } from "./GiftStrip"
import { ActionIcon } from "./shared/ActionIcon"
import { GiftDescription } from "./shared/GiftDescription"
import { GiftHeader } from "./shared/GiftHeader"

const NEAR_EXPLORER = "https://nearblocks.io"

export function GiftTakerSuccessScreen({
  giftInfo,
  intentHashes,
  renderHostAppLink,
}: {
  giftInfo: GiftInfo
  intentHashes: string[]
  renderHostAppLink: RenderHostAppLink
}) {
  const amount = computeTotalBalanceDifferentDecimals(
    getUnderlyingBaseTokenInfos(giftInfo.token),
    giftInfo.tokenDiff,
    { strict: false }
  )

  assert(amount != null)

  const intentStatus = useQuery({
    queryKey: ["intents_status", intentHashes],
    queryFn: async ({ signal }) => {
      const intentHash = intentHashes[0]
      assert(intentHash != null)
      return solverRelay.waitForIntentSettlement({ signal, intentHash })
    },
  })

  const txUrl =
    intentStatus.data?.txHash != null
      ? `${NEAR_EXPLORER}/txns/${intentStatus.data.txHash}`
      : null

  return (
    <>
      <GiftHeader title="Gift claimed!" icon={<ActionIcon type="success" />}>
        <GiftDescription description="The funds are now in your account. Use them for trading or withdraw to your wallet." />
      </GiftHeader>

      <div className="flex flex-col text-xs mt-4 bg-gray-4 rounded-lg">
        <div className="flex flex-row border-b border-gray-6 p-3">
          <GiftStrip
            token={giftInfo.token}
            amountSlot={
              <GiftStrip.Amount
                token={giftInfo.token}
                amount={amount}
                className="text-gray-12"
              />
            }
          />
        </div>
        <div className="flex flex-col gap-3.5 text-xs p-3">
          <div className="flex justify-between items-center">
            <div className="text-gray-11 font-medium">Intents</div>
            <div className="flex gap-2.5">
              {intentHashes.map((intentHash) => (
                <div
                  key={intentHash}
                  className="flex flex-row items-center gap-1 text-gray-12 font-medium"
                >
                  <span className="text-gray-12 font-medium">
                    {truncateHash(intentHash)}
                  </span>
                  <CopyButton text={intentHash} ariaLabel="Copy intent hash" />
                </div>
              ))}
            </div>
          </div>
          {txUrl != null && (
            <div className="flex justify-between items-center">
              <div className="text-gray-11 font-medium">Transaction hash</div>
              {intentStatus.data?.txHash && (
                <div className="flex flex-row items-center gap-1 text-blue-c11 font-medium">
                  <a href={txUrl} rel="noopener noreferrer" target="_blank">
                    {truncateHash(intentStatus.data.txHash)}
                  </a>
                  <CopyButton
                    text={intentStatus.data.txHash}
                    ariaLabel="Copy intent hash"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-center gap-3 mt-5">
        {renderHostAppLink(
          "account",
          <Button asChild size="4" className="w-full h-14 font-bold">
            <div>Go to account</div>
          </Button>,
          { className: "w-full" }
        )}
        {renderHostAppLink(
          "withdraw",
          <Button
            asChild
            size="4"
            className="w-full h-14 font-bold"
            variant="outline"
            color="gray"
          >
            <div>Withdraw</div>
          </Button>,
          { className: "w-full" }
        )}
      </div>
    </>
  )
}

function truncateHash(hash: string) {
  return `${hash.slice(0, 5)}...${hash.slice(-5)}`
}
