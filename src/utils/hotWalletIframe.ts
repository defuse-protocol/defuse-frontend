/**
 * Hot Wallet Iframe Handler
 *
 * This utility addresses an interaction issue that occurs when the Hot Wallet iframe
 * is opened while a Radix UI Dialog is present in the application.
 *
 * Problem:
 * - Radix UI Dialog sets `pointer-events: none` on the body when opened
 * - This affects third-party modals and iframes, including the Hot Wallet iframe
 * - As a result, users cannot interact with the Hot Wallet interface
 *
 * Context:
 * This is a known issue with Radix UI Dialogs and third-party modals/iframes.
 * See: https://github.com/radix-ui/primitives/issues/2122
 *
 * Solution:
 * - Uses MutationObserver to detect when the Hot Wallet iframe is added to the DOM
 * - Ensures pointer-events are explicitly set to 'all' for the iframe and its container
 * - This overrides the Radix UI Dialog's pointer-events restriction
 *
 * @returns {MutationObserver} A configured observer that handles Hot Wallet iframe pointer-events
 */
export function createHotWalletIframeObserver(): MutationObserver {
  return new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          // Check for the Hot Labs iframe container by its distinctive styles
          if (
            node.style.backdropFilter === "blur(24px)" &&
            node.style.zIndex === "2147483647"
          ) {
            const iframe = node.querySelector(
              'iframe[src*="hot-labs.org/hot-widget"]'
            ) as HTMLIFrameElement
            if (iframe) {
              // Override Radix UI Dialog's pointer-events restriction
              iframe.style.pointerEvents = "all"
              node.style.pointerEvents = "all"
              console.log(
                "Enabled pointer-events for Hot Labs iframe (Radix UI Dialog fix)"
              )
            }
          }
        }
      }
    }
  })
}

/**
 * Starts observing for Hot Wallet iframe changes
 * @param observer The MutationObserver instance
 * @returns {void}
 */
export function startHotWalletObserver(observer: MutationObserver): void {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

/**
 * Stops the Hot Wallet iframe observer
 * @param observer The MutationObserver instance
 * @returns {void}
 */
export function stopHotWalletObserver(observer: MutationObserver): void {
  observer.disconnect()
}
