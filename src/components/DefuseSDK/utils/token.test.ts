import { describe, expect, it } from "vitest"
import { getTokenAid } from "./token"

describe("getTokenAid()", () => {
  it("extracts aid from tags", () => {
    expect(
      getTokenAid({
        tags: ["mc:1", "aid:public"],
      })
    ).toEqual("public")
  })

  it("returns null if no aid tag found", () => {
    expect(
      getTokenAid({
        tags: ["mc:1"],
      })
    ).toEqual(null)
  })
})
