import { describe, expect, it } from "vitest"
import { PriorityQueue } from "./priorityQueue"

describe("PriorityQueue", () => {
  // Helper to create a min heap number queue
  const createNumberQueue = () => {
    return new PriorityQueue<number>((a, b) => a - b)
  }

  it("should initialize empty", () => {
    const queue = createNumberQueue()
    expect(queue.isEmpty()).toBe(true)
  })

  it("should enqueue items correctly", () => {
    const queue = createNumberQueue()
    queue.enqueue(3)
    queue.enqueue(1)
    queue.enqueue(2)
    expect(queue.peek()).toBe(1)
  })

  it("should dequeue items in correct order", () => {
    const queue = createNumberQueue()
    queue.enqueue(3)
    queue.enqueue(1)
    queue.enqueue(4)
    queue.enqueue(2)

    expect(queue.dequeue()).toBe(1)
    expect(queue.dequeue()).toBe(2)
    expect(queue.dequeue()).toBe(3)
    expect(queue.dequeue()).toBe(4)
    expect(queue.isEmpty()).toBe(true)
  })

  it("should work with custom comparator", () => {
    const maxHeap = new PriorityQueue<number>((a, b) => b - a)
    maxHeap.enqueue(1)
    maxHeap.enqueue(3)
    maxHeap.enqueue(2)

    expect(maxHeap.dequeue()).toBe(3)
    expect(maxHeap.dequeue()).toBe(2)
    expect(maxHeap.dequeue()).toBe(1)
  })

  it("should throw error when peeking empty queue", () => {
    const queue = createNumberQueue()
    expect(() => queue.peek()).toThrow("PriorityQueue is empty")
  })

  it("should throw error when dequeuing empty queue", () => {
    const queue = createNumberQueue()
    expect(() => queue.dequeue()).toThrow("PriorityQueue is empty")
  })

  it("should handle objects with custom comparator", () => {
    interface Task {
      priority: number
      name: string
    }

    const taskQueue = new PriorityQueue<Task>((a, b) => a.priority - b.priority)

    taskQueue.enqueue({ priority: 3, name: "Low" })
    taskQueue.enqueue({ priority: 1, name: "High" })
    taskQueue.enqueue({ priority: 2, name: "Medium" })

    expect(taskQueue.dequeue().name).toBe("High")
    expect(taskQueue.dequeue().name).toBe("Medium")
    expect(taskQueue.dequeue().name).toBe("Low")
  })

  it("should maintain heap property after multiple operations", () => {
    const queue = createNumberQueue()
    const numbers = [5, 2, 8, 1, 9, 3, 7, 4, 6]

    for (const n of numbers) {
      queue.enqueue(n)
    }
    const sorted = []
    while (!queue.isEmpty()) {
      sorted.push(queue.dequeue())
    }

    expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})
