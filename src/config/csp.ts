/**
 * Content Security Policy (CSP): allowlist of trusted sources for scripts, styles, images, frames, etc.
 * The browser enforces these rules and blocks loads from other origins, mitigating XSS and code injection.
 *
 * Security tradeoffs (search for "SECURITY:" in this file):
 * - script-src: 'unsafe-inline', 'unsafe-eval'
 * - style-src: 'unsafe-inline'
 * - img-src: *
 * - frame-src: data:
 * - worker-src: blob:
 * - connect-src: *.cloudfront.net (broad), http://*.herewallet.app (HTTP), GetBlock URL with API key
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
 */
const cspConfig = {
  "default-src": ["'self'"],
  "frame-src": [
    "'self'",
    "data:", // SECURITY: data: in frame-src can allow JS execution in some contexts; keep only if required for embeds
    "https://hot-labs.org",
    "https://widget.solflare.com",
    "https://verify.walletconnect.org",
    "https://connect.solflare.com",
    "https://*.peersyst.tech",
    "https://wallet.intear.tech",
    "https://vercel.live/",
  ],
  "style-src": [
    "'self'",
    "'unsafe-inline'", // SECURITY: allows inline styles; weakens CSP (e.g. style-based exfil). Prefer nonce/hash if feasible
    "https://fonts.googleapis.com",
    "https://rsms.me", // Meteor wallet iframe (Inter stylesheet)
    "https://fonts.cdnfonts.com", // Meteor wallet iframe (Cabinet Grotesk stylesheet)
  ],
  "font-src": [
    "'self'",
    "https://fonts.gstatic.com",
    "https://rsms.me", // Meteor wallet iframe (Inter font files)
    "https://fonts.cdnfonts.com", // Meteor wallet iframe (Cabinet Grotesk font files)
    "data:", // Meteor wallet iframe (inline base64 fonts)
  ],
  "img-src": ["*", "data:", "blob:"], // SECURITY: * allows images from any origin (tracking, pixel exfil); tighten to allowlist when possible
  "script-src": [
    "'self'",
    "'unsafe-inline'", // SECURITY: major XSS vector; required by many frameworks—prefer nonce-based script-src when possible
    "'unsafe-eval'", // SECURITY: allows eval/new Function; enables code injection if attacker controls input to these
    "https://www.googletagmanager.com",
    "https://beacon-v2.helpscout.net",
    "https://vercel.live",
  ],
  "worker-src": [
    "'self'",
    "blob:", // SECURITY: blob: workers can be created from same-origin; ensure no script injection path exists
    "https://*.near-intents.org",
    "https://*.solswap.org",
    "https://*.dogecoinswap.org",
    "https://*.turboswap.org",
  ],
  "connect-src": [
    "'self'",
    /** Services */
    "https://*.chaindefuser.com",
    "wss://*.chaindefuser.com",
    "https://*.google-analytics.com",
    "https://*.near-intents.org",
    "https://api.hyperunit.xyz",
    "https://region1.google-analytics.com",
    "https://as.coinbase.com/metrics",
    "https://api-js.mixpanel.com",
    "https://*.sentry.io",

    /** Stage Solver Relay and Bridge Services */
    "https://*.intents-near.org",
    "wss://*.intents-near.org",
    "https://near-intents.org",
    "wss://near-intents.org",
    "https://mainnet.api.bridge.nearone.org",
    "wss://mainnet.api.bridge.nearone.org",

    /** NEAR Mobile Signer Services */
    "https://*.peersyst.tech",

    /** Helpscout */
    "https://beaconapi.helpscout.net",
    "https://*.cloudfront.net", // SECURITY: broad wildcard—any CloudFront subdomain; narrow to specific hosts if possible

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
    "https://tc.nicegram.app",
    "https://connect.token.im",
    "https://web3-bridge.kolo.in",
    "https://ton-connect-bridge.echooo.link",
    "https://blitzwallet.cfd",

    /** HOT */
    "http://*.herewallet.app", // SECURITY: HTTP (not HTTPS)—MITM possible; prefer HTTPS or document exception
    "https://raw.githubusercontent.com",
    "https://wallet.intear.tech/near-selector.js",

    /** Stellar Wallets */
    "https://api.web3modal.org",
    "https://cca-lite.coinbase.com",
    "https://mainnet.sorobanrpc.com",

    /** RPCs */
    "https://*.aurora-cloud.dev",
    "https://*.aurora.dev",
    "https://*.quiknode.pro",
    "https://*.solana.com",
    "https://near-rpc.defuse.org",
    "https://veriee-t2i7nw-fast-mainnet.helius-rpc.com",
    "https://eth-mainnet.public.blastapi.io",
    "https://mainnet.base.org",
    "https://arb1.arbitrum.io/rpc",
    "https://mainnet.bitcoin.org",
    "https://go.getblock.io/5f7f5fba970e4f7a907fcd2c5f4c38a2", // SECURITY: API key in URL—exposed in CSP, logs, referrers; use env/server-side or key in header
    "https://mainnet.aurora.dev",
    "https://xrplcluster.com",
    "https://mainnet.lightwalletd.com",
    "https://rpc.gnosischain.com",
    "https://rpc.berachain.com",
    "https://rpc.mainnet.near.org/",
    "https://free.rpc.fastnear.com/",
    "https://1rpc.io/matic",
    "https://gasstation.polygon.technology",
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
    "https://api.trongrid.io",
    "https://fullnode.mainnet.aptoslabs.com",
    "https://litecoinspace.org/api",
    "https://rpc.monad.xyz",
    "https://rpc.xlayer.tech",
    "https://rpc.adifoundation.ai",
    "https://svc.blockdaemon.com/bitcoincash/mainnet/native",
    "https://starknet-rpc.publicnode.com",
    "https://rpc.plasma.to",
    "https://rpc.scroll.io",
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
