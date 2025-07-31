import { assert } from "./assert"

type Comparator<T> = (a: T, b: T) => number

export class PriorityQueue<T> {
  private heap: T[]
  private comparator: Comparator<T>

  constructor(comparator: Comparator<T>) {
    this.heap = []
    this.comparator = comparator
  }

  isEmpty(): boolean {
    return this.heap.length === 0
  }

  size(): number {
    return this.heap.length
  }

  clear(): void {
    this.heap = []
  }

  peek(): T {
    if (this.isEmpty()) {
      throw new Error("PriorityQueue is empty")
    }
    const top = this.heap[0]
    assert(top !== undefined)
    return top
  }

  enqueue(item: T): void {
    this.heap.push(item)
    this.bubbleUp()
  }

  dequeue(): T {
    if (this.isEmpty()) {
      throw new Error("PriorityQueue is empty")
    }
    const top = this.heap[0]
    assert(top !== undefined)
    const bottom = this.heap.pop()
    if (this.heap.length > 0 && bottom !== undefined) {
      this.heap[0] = bottom
      this.bubbleDown()
    }
    return top
  }

  private bubbleUp(): void {
    let index = this.heap.length - 1
    const item = this.heap[index]
    assert(item !== undefined)

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)
      const parent = this.heap[parentIndex]
      assert(parent !== undefined)

      if (this.comparator(item, parent) >= 0) break

      this.heap[index] = parent
      index = parentIndex
    }

    this.heap[index] = item
  }

  private bubbleDown(): void {
    let index = 0
    const length = this.heap.length
    const item = this.heap[index]
    assert(item !== undefined)

    let leftChild: T | undefined
    let rightChild: T | undefined

    while (true) {
      const leftChildIndex = 2 * index + 1
      const rightChildIndex = 2 * index + 2
      let swapIndex = -1

      if (leftChildIndex < length) {
        leftChild = this.heap[leftChildIndex]
        assert(leftChild !== undefined)

        if (this.comparator(leftChild, item) < 0) {
          swapIndex = leftChildIndex
        }
      }

      if (rightChildIndex < length) {
        rightChild = this.heap[rightChildIndex]
        assert(rightChild !== undefined)
        assert(leftChild !== undefined)

        if (
          (this.comparator(rightChild, item) < 0 && swapIndex === -1) ||
          (swapIndex !== -1 && this.comparator(rightChild, leftChild) < 0)
        ) {
          swapIndex = rightChildIndex
        }
      }

      if (swapIndex === -1) break

      // biome-ignore lint/style/noNonNullAssertion: `swapIndex` is within bounds
      this.heap[index] = this.heap[swapIndex]!
      index = swapIndex
    }

    this.heap[index] = item
  }
}
