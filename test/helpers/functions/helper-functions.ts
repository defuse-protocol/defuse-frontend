import type { BrowserContext } from "playwright"

export function parseFloatWithRounding(
  str: string,
  decimalPlaces: number
): number {
  const parsed = Number.parseFloat(str)
  const factor = 10 ** decimalPlaces // 10^decimalPlaces

  return Math.round(parsed * factor) / factor
}

export async function waitForMetaMaskPage(
  context: BrowserContext,
  timeout = 10_000
) {
  const start = Date.now()

  while (Date.now() - start < timeout) {
    const extPage = context.pages().find((p) => {
      const u = p.url()

      return (
        u &&
        (u.startsWith("chrome-extension://") ||
          u.startsWith("moz-extension://"))
      )
    })

    if (extPage) {
      // eslint-disable-next-line no-await-in-loop
      await extPage.waitForLoadState("domcontentloaded")

      return extPage
    }

    // eslint-disable-next-line no-promise-executor-return, no-await-in-loop
    await new Promise((r) => setTimeout(r, 150))
  }

  throw new Error("Timed out waiting for MetaMask extension page")
}

export function truncateAddress(addr: string, startChars = 6, endChars = 5) {
  if (!addr) {
    return addr
  }

  if (addr.length <= startChars + endChars) {
    return addr
  }

  return `${addr.slice(0, startChars)}…${addr.slice(-endChars)}`
}
