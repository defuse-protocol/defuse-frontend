import type { FinalExecutionStatus } from "near-api-js/lib/providers/provider"
import { nearClient } from "../../constants/nearClient"

function isSuccessStatus(
  status: unknown
): status is FinalExecutionStatus & { SuccessValue: string } {
  return (
    typeof status === "object" && status !== null && "SuccessValue" in status
  )
}

export const getNearTxSuccessValue = async ({
  txHash,
  senderAccountId,
}: {
  txHash: string
  senderAccountId: string
}): Promise<bigint> => {
  try {
    const response = await nearClient.txStatus(
      txHash,
      senderAccountId,
      "EXECUTED"
    )

    if (isSuccessStatus(response.status)) {
      const decodedValue = Buffer.from(
        response.status.SuccessValue,
        "base64"
      ).toString("utf-8")
      // Parse the JSON string and convert to BigInt
      return BigInt(JSON.parse(decodedValue))
    }
    return 0n
  } catch (err: unknown) {
    throw new Error("Error fetching tx status", { cause: err })
  }
}
