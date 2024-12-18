"use client"

import { injected } from "@wagmi/core"
import type { Chain } from "viem"
import { http, createConfig } from "wagmi"
import { arbitrum, aurora, base, mainnet } from "wagmi/chains"
import { coinbaseWallet, walletConnect } from "wagmi/connectors"

const PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID

export const turbo = {
  id: 1313161567,
  name: "TurboChain",
  nativeCurrency: { name: "Turbo", symbol: "TURBO", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc-0x4e45415f.aurora-cloud.dev"] },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://explorer.turbo.aurora.dev" },
  },
} as const satisfies Chain

export const config = createConfig({
  chains: [mainnet, base, arbitrum, turbo, aurora],
  connectors: [
    PROJECT_ID != null &&
      walletConnect({
        projectId: PROJECT_ID,
        showQrModal: true,
      }),
    coinbaseWallet({ appName: "Near Intents" }),
    injected(),
  ].filter((a): a is Exclude<typeof a, boolean> => !!a),
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [turbo.id]: http(),
    [aurora.id]: http(),
  },
})
