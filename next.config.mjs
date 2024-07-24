import { withSentryConfig } from "@sentry/nextjs"
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve = {
      ...config.resolve,
      fallback: {
        fs: false,
        path: false,
        os: false,
      },
    }
    return config
  },
  env: {
    nearChainId: process.env.NEAR_CAHIN_ID,
    nearNodeUrl: process.env.NEAR_NODE_URL,
    ethChainId: process.env.ETH_CHAIN_ID,
    baseChainId: process.env.BASE_CHAIN_ID,
    environment: process.env.ENVIRONMENT,
    turnOffApps: process.env.NEXT_PUBLIC_TURN_OFF_APPS,
    turnOffLanding: process.env.NEXT_PUBLIC_TURN_OFF_LANDING,
    solverRelay: process.env.NEXT_PUBLIC_SOLVER_RELAY_API,
    coingeckoApiKey: process.env.COINGECKO_API_KEY,
    walletConnectProjectId: process.env.WALLET_CONNECT_PROJECT_ID,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    nearExplorer: process.env.NEXT_PUBLIC_NEAR_EXPLORER,
    publicMail: process.env.NEXT_PUBLIC_PUBLIC_MAIL,
    socialX: process.env.NEXT_PUBLIC_LINK_X,
    socialDiscord: process.env.NEXT_PUBLIC_LINK_DISCORD,
    socialDocs: process.env.NEXT_PUBLIC_LINK_DOCS,
    // Specific [Keys] has to be below.
    NEAR_ENV: process.env.NEAR_ENV,
    SOLVER_RELAY_0_URL: process.env.SOLVER_RELAY_0_URL,
    REFERRAL_ACCOUNT: process.env.REFERRAL_ACCOUNT,
    nearChainIdEthWallets: process.env.NEAR_CHAIN_ID_ETH_WALLETS,
    explorerUrlEthWallets: process.env.EXPLORER_URL_ETH_WALLETS,
    walletExplorerUrlEthWallets: process.env.WALLET_EXPLORER_URL_ETH_WALLETS,
    rpcEthWallets: process.env.RPC_ETH_WALLETS,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.coingecko.com",
        port: "",
        pathname: "/coins/images/**",
      },
      {
        protocol: "https",
        hostname: "solver-relay.chaindefuser.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pro-api.coingecko.com",
        port: "",
        pathname: "/api/**",
      },
    ],
  },
}

const sentryConfig = {
  org: "aurora-k2",
  project: "defuse",
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
}

export default withSentryConfig(nextConfig, sentryConfig)
