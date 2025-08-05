/**
 * Content Security Policy (CSP) directives define which sources the browser can load resources from (scripts, images, styles, etc.).
 * This helps prevent XSS and other code injection attacks.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
 */
const cspConfig = {
  "default-src": ["'self'"],
  "frame-src": [
    "'self'",
    "https://hot-labs.org",
    "https://widget.solflare.com",
    "https://verify.walletconnect.org",
    "https://connect.solflare.com",
  ],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "img-src": ["*", "data:", "blob:"],
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://www.googletagmanager.com",
    "https://beacon-v2.helpscout.net",
  ],
  "worker-src": [
    "'self'",
    "blob:",
    "https://*.near-intents.org",
    "https://*.solswap.org",
    "https://*.dogecoinswap.org",
    "https://*.turboswap.org",
  ],
  "connect-src": [
    "'self'",
    /** Services */
    "https://*.chaindefuser.com",
    "https://*.google-analytics.com",
    "https://*.near-intents.org",
    "https://api.hyperunit.xyz",
    "https://region1.google-analytics.com",
    "https://as.coinbase.com/metrics",
    "https://api-js.mixpanel.com",

    /** Stage Solver Relay and Bridge Services */
    "https://*.intents-near.org",
    "https://near-intents.org",

    /** Helpscout */
    "https://beaconapi.helpscout.net",
    "https://*.cloudfront.net",

    /** Wallets */
    "https://*.walletconnect.org",
    "https://*.walletconnect.com",
    "wss://*.walletconnect.org",
    "wss://*.walletconnect.com",
    "https://*.walletlink.org",
    "wss://*.walletlink.org",
    "https://h4n.app",
    "https://logout-bridge-service.intear.tech",
    "wss://logout-bridge-service.intear.tech",

    /** TON Wallets */
    "https://tonconnect.tonkeeper.com/wallets-v2.json",
    "https://walletbot.me",
    "https://bridge.tonapi.io",
    "https://bridge.tonapi.io",
    "https://connect.tonhubapi.com",
    "https://ton-connect-bridge.bgwapi.io",
    "https://www.okx.com",
    "https://wallet.binance.com",
    "https://wallet-bridge.fintopio.com",
    "https://sse-bridge.hot-labs.org",
    "https://tonconnectbridge.mytonwallet.org",
    "https://api-node.bybit.com",
    "https://bridge.dewallet.pro",
    "https://ton-bridge.safepal.com",
    "https://dapp.gateio.services",
    "https://ton-bridge.tobiwallet.app",
    "https://go-bridge.tomo.inc",
    "https://bridge.mirai.app",
    "https://tc.architecton.su",
    "https://ton-connect.mytokenpocket.vip",
    "https://bridge.uxuy.me",

    /** HOT */
    "http://*.herewallet.app",

    /** Stellar Wallets */
    "https://api.web3modal.org",
    "https://cca-lite.coinbase.com",

    /** RPCs */
    "https://*.aurora-cloud.dev",
    "https://*.aurora.dev",
    "https://*.quiknode.pro",
    "https://veriee-t2i7nw-fast-mainnet.helius-rpc.com",
    "https://eth-mainnet.public.blastapi.io",
    "https://mainnet.base.org",
    "https://arb1.arbitrum.io/rpc",
    "https://mainnet.bitcoin.org",
    "https://go.getblock.io/5f7f5fba970e4f7a907fcd2c5f4c38a2",
    "https://mainnet.aurora.dev",
    "https://xrplcluster.com",
    "https://mainnet.lightwalletd.com",
    "https://rpc.gnosischain.com",
    "https://rpc.berachain.com",
    "https://rpc.mainnet.near.org/",
    "https://free.rpc.fastnear.com/",
    "https://polygon-rpc.com",
    "https://bsc-dataseed.bnbchain.org",
    "https://ton.api.onfinality.io",
    "https://ton.api.onfinality.io/public",
    "https://toncenter.com/api/v2/jsonRPC",
    "https://fullnode.mainnet.sui.io:443",
    "https://horizon.stellar.org",
    "https://mainnet.optimism.io",
    "https://api.avax.network/ext/bc/C/rpc",
    "https://c1.rpc.fastnear.com",
    "https://rpc.near.org",
    "https://rpc.mainnet.pagoda.co",
  ],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
}

export const csp = () => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")

  const contentSecurityPolicyHeaderValue = Object.entries(cspConfig)
    .map(([key, value]) => `${key} ${value.join(" ")}`)
    .join("; ")

  // This is a special top-level (value-less) directive that instructs the browser
  // to upgrade HTTP requests to HTTPS
  // TODO: Uncomment this when we have HTTPS for stage
  // contentSecurityPolicyHeaderValue += "; upgrade-insecure-requests"

  return {
    nonce,
    contentSecurityPolicyHeaderValue,
  }
}
