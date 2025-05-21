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
  ],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "img-src": [
    "'self'",
    "data:",
    "https://s2.coinmarketcap.com",
    "https://*.walletconnect.org",
    "https://*.walletconnect.com",
    "https://storage.herewallet.app",
  ],
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://www.googletagmanager.com",
  ],
  "connect-src": [
    "'self'",
    /** Services */
    "https://*.chaindefuser.com",
    "https://*.google-analytics.com",
    "https://region1.google-analytics.com",
    "https://as.coinbase.com/metrics",

    /** Wallets */
    "https://*.walletconnect.org",
    "https://*.walletconnect.com",
    "wss://*.walletconnect.org",
    "https://*.walletlink.org",
    "wss://*.walletlink.org",
    "https://h4n.app",

    /** RPCs */
    "https://*.aurora-cloud.dev",
    "https://*.aurora.dev",
    "https://veriee-t2i7nw-fast-mainnet.helius-rpc.com",
    "https://eth.llamarpc.com",
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
  ],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
}

export const csp = () => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")

  let contentSecurityPolicyHeaderValue = Object.entries(cspConfig)
    .map(([key, value]) => `${key} ${value.join(" ")}`)
    .join("; ")

  // This is a special top-level (value-less) directive that instructs the browser
  // to upgrade HTTP requests to HTTPS
  contentSecurityPolicyHeaderValue += "; upgrade-insecure-requests"

  return {
    nonce,
    contentSecurityPolicyHeaderValue,
  }
}
