import type { VirtualChains } from "../types/base"

/**
 * SiloToSilo addresses on blockchains within Aurora Engine
 */
export const siloToSiloAddress: Record<VirtualChains, string> = {
  aurora: "0x055707c67977e8217F98f19cFa8aca18B2282D0C",
  aurora_devnet: "0xA50fFd8a0953B3965E70C4F7F880B00BcdB9A313",
  turbochain: "0x8a4Bf14C51e1092581F1392810eE38c5A20f83da",
  tuxappchain: "0xA50fFd8a0953B3965E70C4F7F880B00BcdB9A313",
  vertex: "0xA50fFd8a0953B3965E70C4F7F880B00BcdB9A313",
  optima: "0xA50fFd8a0953B3965E70C4F7F880B00BcdB9A313",
  easychain: "0xA50fFd8a0953B3965E70C4F7F880B00BcdB9A313",
}

/**
 * Account ids on Near of Aurora Engine powered blockchains
 * Mapping: ChainName -> AccountId
 */
export const auroraEngineContractId: Record<VirtualChains, string> = {
  aurora: "aurora",
  aurora_devnet: "0x4e45426a.c.aurora",
  turbochain: "0x4e45415f.c.aurora",
  tuxappchain: "0x4e454165.c.aurora",
  vertex: "0x4e454173.c.aurora",
  optima: "0x4e454161.c.aurora",
  easychain: "0x4e454218.c.aurora",
}

export function getAuroraEngineContractId(chainName: string) {
  if (!(chainName in auroraEngineContractId)) {
    throw new Error(`Unsupported virtual chain = ${chainName}`)
  }

  return auroraEngineContractId[
    chainName as keyof typeof auroraEngineContractId
  ]
}
