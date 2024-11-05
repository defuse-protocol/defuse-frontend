import type { InfrastructureProps } from "@src/app/landing/Table/TableInfrastructure"

export const infrastructureData: InfrastructureProps[] = [
  {
    featureDesc: "Control",
    featureIcon: "/static/logos/Eye.svg",
    dexDesc: "Decentralized",
    cexDesc: "Centralized",
    defuseDesc: "Decentralized",
  },
  {
    featureDesc: "Speed",
    featureIcon: "/static/logos/Gauge.svg",
    dexDesc: "Depends on network constraints",
    cexDesc: "Generally fast",
    defuseDesc: "Fast, independent of asset chain",
  },
  {
    featureDesc: "Security",
    featureIcon: "/static/logos/ShieldCheck.svg",
    dexDesc: "Dependant on smart contract robustness",
    cexDesc: "Dependant on humans",
    defuseDesc: "Dependant on smart contract robustness",
  },
  {
    featureDesc: "Liquidity",
    featureIcon: "/static/logos/HandCoins.svg",
    dexDesc: "Shallow liquidity, constrained by chain",
    cexDesc: "Deep liquidity",
    defuseDesc: "Combined liquidity across chains, CEXes and outside crypto",
  },
  {
    featureDesc: "Range of assets",
    featureIcon: "/static/logos/Coins.svg",
    dexDesc: "Limited to assets on a single chain",
    cexDesc:
      "Wide range, limited by listing policies and speed of integration of new networks / token standards",
    defuseDesc:
      "Extensive, includes FTs, NFTs, non-transferable assets or any other form of value on any chain",
  },
  {
    featureDesc: "Innovation",
    featureIcon: "/static/logos/LightbulbFilament.svg",
    dexDesc: "Innovation controlled by protocol governance",
    cexDesc: "Controlled by the platform",
    defuseDesc: "Innovation controlled by protocol governance",
  },
  {
    featureDesc: "Fees",
    featureIcon: "/static/logos/Percent.svg",
    dexDesc: "Volume based",
    cexDesc: "Adaptable, volume based",
    defuseDesc: "Low constant fees",
  },
  {
    featureDesc: "Compliance",
    featureIcon: "/static/logos/ClipboardText.svg",
    dexDesc: "Generally less regulated",
    cexDesc: "Compliant, subject to regulatory constraints",
    defuseDesc: "Determined by the transacting parties",
  },
  {
    featureDesc: "Interoperability",
    featureIcon: "/static/logos/TreeStructure.svg",
    dexDesc: "Limited to single blockchain",
    cexDesc: "Limited, usually single platform",
    defuseDesc: "Cross-chain interoperability",
  },
  {
    featureDesc: "P2P Transfers",
    featureIcon: "/static/logos/Users.svg",
    dexDesc: "Direct, but limited to one chain",
    cexDesc: "Not usually direct, involves platform mediation",
    defuseDesc:
      "Direct, fast and cheap for any assets,  even on expensive or slow chains",
  },
]
