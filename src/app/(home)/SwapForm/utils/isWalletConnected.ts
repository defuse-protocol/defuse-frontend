import {
  CONNECTOR_BTC_MAINNET,
  CONNECTOR_ETH_BASE,
} from "@src/constants/contracts"
import { MapsEnum } from "@src/libs/de-sdk/utils/maps"
import parseDefuseAsset from "@src/utils/parseDefuseAsset"

export default function isWalletConnected(defuse_asset_id: string): string {
  const to = parseDefuseAsset(defuse_asset_id)
  const toNetworkId = `${to?.blockchain}:${to?.network}` as MapsEnum
  const noAccountId = ""

  switch (toNetworkId) {
    case MapsEnum.EVM_BASE: {
      const getEthBaseFromLocal = localStorage.getItem(CONNECTOR_ETH_BASE)
      if (!getEthBaseFromLocal) return noAccountId
      return getEthBaseFromLocal
    }
    case MapsEnum.BTC_MAINNET: {
      const getBtcMainnetFromLocal = localStorage.getItem(CONNECTOR_BTC_MAINNET)
      if (!getBtcMainnetFromLocal) return noAccountId
      return getBtcMainnetFromLocal
    }
    default:
      return noAccountId
  }
}
