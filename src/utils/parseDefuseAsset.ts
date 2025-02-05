import { logger } from "@src/utils/logger"

export type ParseDefuseAssetResult = {
  blockchain: string
  network: string
  contractId: string
} | null

export default function parseDefuseAsset(
  defuseAssetId: string
): ParseDefuseAssetResult {
  try {
    const [blockchain, network, contractId] = defuseAssetId.split(":")
    return {
      blockchain,
      network,
      contractId,
    }
  } catch (e) {
    logger.error(e)
    return null
  }
}
