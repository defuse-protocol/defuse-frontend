import type { NetworkToken } from "@src/types/interfaces"

export default function isSameToken(
  token: NetworkToken,
  checkToken: NetworkToken
): boolean {
  return token.defuse_asset_id === checkToken?.defuse_asset_id
}
