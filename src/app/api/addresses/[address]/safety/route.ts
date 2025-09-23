import { isBannedNearAddress } from "@src/utils/bannedNearAddress"

export const dynamic = "force-static"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params

  return Response.json({
    safetyStatus: isBannedNearAddress(address) ? "unsafe" : "safe",
  })
}
