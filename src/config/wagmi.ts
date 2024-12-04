"use client"

import { http, createConfig } from "wagmi"
import { arbitrum, base, mainnet } from "wagmi/chains"
import {
  coinbaseWallet,
  injected,
  metaMask,
  walletConnect,
} from "wagmi/connectors"

const PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID

export const config = createConfig({
  chains: [mainnet, base, arbitrum],
  connectors: [
    injected(),
    metaMask(),
    PROJECT_ID != null &&
      walletConnect({
        projectId: PROJECT_ID,
        showQrModal: true,
      }),
    coinbaseWallet({ appName: "Near Intents" }),
  ].filter((a): a is Exclude<typeof a, boolean> => !!a),
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
  },
})
