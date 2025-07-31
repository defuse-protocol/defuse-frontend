import type { SupportedBridge } from "../../../types/base"

export function isCexIncompatible({ bridge }: { bridge: SupportedBridge }) {
  // These bridges may not be compatible with CEXs like Bybit, because
  // transfers are executed from a smart-contract account.
  const incompatibleBridges: SupportedBridge[] = ["direct", "hot_omni"]

  return incompatibleBridges.includes(bridge)
}
