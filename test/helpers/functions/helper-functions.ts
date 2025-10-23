import type { BrowserContext } from "playwright"
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
      await extPage.waitForLoadState("domcontentloaded")

      return extPage
    }

    await new Promise((r) => setTimeout(r, 150))
  }

  throw new Error("Timed out waiting for MetaMask extension page")
}

export async function waitForMetaMaskPageClosed(
  context: BrowserContext,
  timeout = 30_000
) {
  const start = Date.now()

  while (Date.now() - start < timeout) {
    const allPages = context.pages()

    const extPages = allPages.filter((p) => {
      try {
        const u = p.url()
        return (
          u &&
          (u.startsWith("chrome-extension://") ||
            u.startsWith("moz-extension://"))
        )
      } catch {
        // Page is closed if we can't access it
        return false
      }
    })

    // Check if any extension pages are still visible/active
    const visibleExtPages = extPages.filter((page) => {
      try {
        return !page.isClosed()
      } catch {
        // Page is closed if we can't access it
        return false
      }
    })

    // MetaMask always keeps one extension page open when initialized
    // We consider MetaMask "closed" when only the persistent page remains
    if (visibleExtPages.length <= 1) {
      return true
    }

    // eslint-disable-next-line no-promise-executor-return, no-await-in-loop
    await new Promise((r) => setTimeout(r, 150))
  }

  throw new Error("Timed out waiting for MetaMask extension page to close")
}
