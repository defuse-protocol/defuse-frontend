/**
 * Some wallet doesnt trigger the event close, like HOT wallet so we need to resolve the promise after a timeout
 * @param operation - The operation to resolve
 * @param timeout - The timeout in milliseconds
 * @returns The result of the operation
 */
export async function withWalletInteractionTimeout<T>(
  operation: () => Promise<T>,
  timeout = 60_000
) {
  return await Promise.race([
    operation(),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Signature request timed out")),
        timeout
      )
    ),
  ])
}
