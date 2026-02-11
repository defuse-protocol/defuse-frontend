/**
 * Maps over items with limited concurrency.
 * Similar to Promise.all but limits how many promises run simultaneously.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = []
  let index = 0

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++
      const item = items[currentIndex]
      if (item !== undefined) {
        results[currentIndex] = await fn(item)
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
  return results
}
