import {
  getTokenAid,
  isUnifiedToken,
} from "@src/components/DefuseSDK/utils/token"
import { describe, expect, it } from "vitest"
import { LIST_TOKENS } from "./tokens"

describe("token list", () => {
  it("checks all unified tokens have an aid tag", () => {
    for (const t of LIST_TOKENS) {
      if (isUnifiedToken(t)) {
        const aid = getTokenAid(t)
        expect(aid).not.toEqual(null)
      }
    }
  })
})
