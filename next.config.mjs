import { withSentryConfig } from "@sentry/nextjs"
import { DedupePlugin } from "@tinkoff/webpack-dedupe-plugin"

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  eslint: {
    // We check the code quality in the CI pipeline
    ignoreDuringBuilds: true,
  },
  webpack: (config, context) => {
    // Suppress warnings from libraries trying to load optional dependencies
    config.externals.push(
      // `pino` wants `pino-pretty`
      "pino-pretty",
      // `@metamask/sdk` wants `encoding`
      "encoding"
    )

    config.resolve = {
      ...config.resolve,
      fallback: {
        fs: false,
        path: false,
        os: false,
      },
    }

    /**
     * Setup SVG (just copy-paste from the official documentation https://react-svgr.com/docs/next/)
     */

    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg")
    )

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: ["@svgr/webpack"],
      }
    )

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i

    /**
     * Setup DedupePlugin
     */
    config.plugins.push(
      new DedupePlugin({ strategy: "equality", showLogs: false })
    )

    return config
  },
  env: {
    nearChainId: process.env.NEAR_CAHIN_ID,
    contractId: process.env.NEAR_CONTRACT_ID,
    nearNodeUrl: process.env.NEAR_NODE_URL,
    ethChainId: process.env.ETH_CHAIN_ID,
    baseChainId: process.env.BASE_CHAIN_ID,
    environment: process.env.ENVIRONMENT,
    turnOffApps: process.env.NEXT_PUBLIC_TURN_OFF_APPS,
    turnOffLanding: process.env.NEXT_PUBLIC_TURN_OFF_LANDING,
    solverRelay: process.env.NEXT_PUBLIC_SOLVER_RELAY_API,
    coingeckoApiKey: process.env.COINGECKO_API_KEY,
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    nearExplorer: process.env.NEXT_PUBLIC_NEAR_EXPLORER,
    baseExplorer: process.env.NEXT_PUBLIC_BASE_EXPLORER,
    bitcoinExplorer: process.env.NEXT_PUBLIC_BITCOIN_EXPLORER,
    publicMail: process.env.NEXT_PUBLIC_PUBLIC_MAIL,
    socialX: process.env.NEXT_PUBLIC_LINK_X,
    socialDiscord: process.env.NEXT_PUBLIC_LINK_DISCORD,
    socialDocs: process.env.NEXT_PUBLIC_LINK_DOCS,
    // Specific [Keys] has to be below.
    NEAR_ENV: process.env.NEAR_ENV,
    SOLVER_RELAY_0_URL: process.env.SOLVER_RELAY_0_URL,
    REFERRAL_ACCOUNT: process.env.REFERRAL_ACCOUNT,
    BASE_RPC: process.env.BASE_QUICKNODE_URL,
    BITCOIN_INFO_URL: process.env.BITCOIN_INFO_URL,
    COINGECKO_API_URL: process.env.COINGECKO_API_URL,
    SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
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
  hideSourceMaps: false,
  disableLogger: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  tunnelRoute: "/monitoring",
  automaticVercelMonitors: true,
}

export default withSentryConfig(nextConfig, sentryConfig)
