/**
 * Hot Wallet Iframe Handler
 *
 * This utility handles hot-close events from the Hot Wallet.
 * When a hot-close event is received, it means the user has cancelled
 * the operation in the Hot Wallet interface.
 *
 * @returns {Promise<never>} A promise that rejects when hot-close is received
 */
export function createHotWalletCloseObserver(): Promise<never> {
  let rejectPromise: (reason: Error) => void

  const handleHotClose = (event: MessageEvent) => {
    if (event.data === "hot-close") {
      window.removeEventListener("message", handleHotClose)
      rejectPromise(new Error("User cancelled the operation"))
    }
  }

  const promise = new Promise<never>((_, reject) => {
    rejectPromise = reject
    window.addEventListener("message", handleHotClose)
  })

  return promise.finally(() => {
    window.removeEventListener("message", handleHotClose)
  })
}

export function raceFirst<T>(...asyncTasks: Array<Promise<T>>): Promise<T> {
  return Promise.race(asyncTasks)
}
