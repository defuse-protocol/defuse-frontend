import { type NextRequest, NextResponse } from "next/server"

import type {
  Event,
  EventsResponse,
} from "@src/app/api/integrations/gecko-terminal/types"
import { clickHouseClient } from "@src/clickhouse/clickhouse"

import { EVENTS_QUERY } from "../queries"
import { addDecimalPoint, calculatePriceWithMaxPrecision } from "../utils"

interface RawEvent {
  blockNumber: number
  blockTimestamp: number
  eventType: "swap"
  txnId: string
  txnIndex: number
  eventIndex: number
  maker: string
  pairId: string
  asset0In: string
  asset1Out: string
  priceNative: string
  reserveAsset0: string
  reserveAsset1: string
  asset0Decimals: number
  asset1Decimals: number
}

/**
 * Fetches swap events within a specified block range.
 *
 * The `fromBlock` and `toBlock` parameters are both inclusive.
 *
 * test:
 * http://localhost:3000/api/integrations/gecko-terminal/events?fromBlock=150777201&toBlock=150777222
 *
 * @param request - The incoming Next.js request, containing the fromBlock and toBlock in the query parameters.
 * @returns A response containing a list of events.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<EventsResponse | { error: string }>> {
  const { searchParams } = new URL(request.url)

  const fromBlock = searchParams.get("fromBlock")

  if (!fromBlock) {
    return NextResponse.json(
      { error: "Missing fromBlock parameter" },
      { status: 400 }
    )
  }

  const toBlock = searchParams.get("toBlock")

  if (!toBlock) {
    return NextResponse.json(
      { error: "Missing toBlock parameter" },
      { status: 400 }
    )
  }

  const { data: rawEvents } = await clickHouseClient
    .query({
      query: EVENTS_QUERY,
      query_params: {
        fromBlock: Number.parseInt(fromBlock),
        toBlock: Number.parseInt(toBlock),
      },
    })
    .then((res) =>
      res.json<
        Omit<RawEvent, "priceNative"> & {
          asset0Decimals: number
          asset1Decimals: number
        }
      >()
    )

  const events = rawEvents.map((rawEvent): Event => {
    const asset0In = addDecimalPoint(rawEvent.asset0In, rawEvent.asset0Decimals)
    const asset1Out = addDecimalPoint(
      rawEvent.asset1Out,
      rawEvent.asset1Decimals
    )

    const priceNative = calculatePriceWithMaxPrecision(
      rawEvent.asset0In,
      rawEvent.asset1Out,
      rawEvent.asset0Decimals,
      rawEvent.asset1Decimals
    )

    return {
      block: {
        blockNumber: rawEvent.blockNumber,
        blockTimestamp: rawEvent.blockTimestamp,
      },
      eventType: rawEvent.eventType,
      txnId: rawEvent.txnId,
      txnIndex: rawEvent.txnIndex,
      eventIndex: rawEvent.eventIndex,
      maker: rawEvent.maker,
      pairId: rawEvent.pairId,
      asset0In,
      asset1Out,
      priceNative,
      reserves: {
        asset0: asset0In,
        asset1: asset1Out,
      },
    }
  })

  return NextResponse.json({ events })
}
