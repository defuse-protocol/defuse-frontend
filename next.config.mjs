import { withSentryConfig } from "@sentry/nextjs"
import { DedupePlugin } from "@tinkoff/webpack-dedupe-plugin"

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: process.env.VERCEL_ENV === 'production',
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  webpack: (config) => {
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
        events: "events",
      },
    }

    // "false" tells webpack "don't attempt to bundle sodium-native at all"
    config.resolve.alias["sodium-native"] = false

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

/** @type {import('@sentry/nextjs').SentryBuildOptions} */
const sentryConfig = {
  org: "defuse-labs-ltd",
  project: "frontend",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  tunnelRoute: "/monitoring",
  automaticVercelMonitors: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true, 
  },
}

export default process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true' ? withSentryConfig(nextConfig, sentryConfig) : nextConfig

