/**
 * Maps a `defuseAssetId` to the 1CS routing asset id used as the destination
 * asset in withdraw quotes, when the two differ.
 *
 * Example: `nep141:nbtc.bridge.near` is held on Intents as a NEP-141, but 1CS
 * routes BTC withdrawals via the native `1cs_v1:btc:native:coin` asset.
 */
const WITHDRAW_DESTINATION_ASSET_OVERRIDES: Record<string, string> = {
  "nep141:nbtc.bridge.near": "1cs_v1:btc:native:coin",
}

export function getWithdrawDestinationAsset(defuseAssetId: string): string {
  return WITHDRAW_DESTINATION_ASSET_OVERRIDES[defuseAssetId] ?? defuseAssetId
}
