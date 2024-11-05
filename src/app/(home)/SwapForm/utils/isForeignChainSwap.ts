import parseDefuseAsset from "@src/utils/parseDefuseAsset"

export default function isForeignChainSwap(
  defuseTokenIdIn: string,
  defuseTokenIdOut: string
) {
  return (
    parseDefuseAsset(defuseTokenIdIn)?.blockchain !== "near" ||
    parseDefuseAsset(defuseTokenIdOut)?.blockchain !== "near"
  )
}
