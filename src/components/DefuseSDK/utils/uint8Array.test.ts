import { describe, expect, it } from "vitest"
import { concatUint8Arrays } from "./uint8Array"

describe("concatUint8Arrays", () => {
  it("combines multiple uint8 arrays", () => {
    expect(
      concatUint8Arrays([new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])])
    ).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]))
  })
})
