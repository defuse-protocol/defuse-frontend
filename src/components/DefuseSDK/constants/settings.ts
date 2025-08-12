import type { SupportedChainName } from "../types/base"

interface Settings {
  swapExpirySec: number
  quoteMinDeadlineMs: number
  maxQuoteMinDeadlineMs: number
  rpcUrls: {
    [key in SupportedChainName]: string
  }
}

export const settings: Settings = {
  swapExpirySec: 600, // 10 minutes
  /**
   * Minimum deadline for a quote.
   * The server will return quotes with at least this much time remaining.
   */
  quoteMinDeadlineMs: 60_000,
  /**
   * Max value of minimum deadline for a quote.
   * The server will return quotes with at least this much time remaining.
   */
  maxQuoteMinDeadlineMs: 600_000,
  /**
   * RPC URLs for different blockchains.
   * Ensure these URLs are valid and accessible.
   */
  rpcUrls: {
    near: "https://relmn.aurora.dev",
    eth: "https://eth-mainnet.public.blastapi.io",
    base: "https://mainnet.base.org",
    arbitrum: "https://arb1.arbitrum.io/rpc",
    bitcoin: "https://mainnet.bitcoin.org",
    solana: "https://veriee-t2i7nw-fast-mainnet.helius-rpc.com",
    dogecoin: "https://go.getblock.io/5f7f5fba970e4f7a907fcd2c5f4c38a2",
    turbochain: "https://rpc-0x4e45415f.aurora-cloud.dev",
    tuxappchain: "https://rpc-0x4e454165.aurora-cloud.dev",
    vertex: "https://rpc-0x4e454173.aurora-cloud.dev",
    optima: "https://rpc-0x4e454161.aurora-cloud.dev",
    easychain: "https://0x4e454218.rpc.aurora-cloud.dev",
    aurora: "https://mainnet.aurora.dev",
    aurora_devnet: "https://0x4e45426a.rpc.aurora-cloud.dev",
    xrpledger: "https://xrplcluster.com",
    zcash: "https://mainnet.lightwalletd.com",
    gnosis: "https://rpc.gnosischain.com",
    berachain: "https://rpc.berachain.com",
    tron: "",
    polygon: "https://polygon-rpc.com",
    bsc: "https://bsc-dataseed.bnbchain.org",
    hyperliquid: "https://rpc.hyperliquid.xyz/evm",
    ton: "https://nameless-stylish-surf.ton-mainnet.quiknode.pro/8541c7f9b1ffdac8652ffdd74a762607b922627d/jsonRPC", // Use locally one of these RPCs https://ton.api.onfinality.io/public or https://toncenter.com/api/v2/jsonRPC
    optimism: "https://mainnet.optimism.io",
    avalanche: "https://api.avax.network/ext/bc/C/rpc",
    sui: "https://fullnode.mainnet.sui.io:443",
    stellar: "https://horizon.stellar.org",
    aptos: "https://fullnode.mainnet.aptoslabs.com",
    cardano: "",
  },
}
