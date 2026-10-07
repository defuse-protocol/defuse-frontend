import { beforeEach, describe, expect, it, vi } from "vitest"
import { isAccountBanned } from "./bannedAccounts"

const getMock = vi.fn()
vi.mock("@vercel/edge-config", () => ({
  get: (...args: unknown[]) => getMock(...args),
}))

describe("bannedAccounts", () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it("returns true for accounts in the Edge Config list", async () => {
    getMock.mockResolvedValue(["banned.near", "0xabc"])

    expect(await isAccountBanned("banned.near")).toBe(true)
    expect(await isAccountBanned("clean.near")).toBe(false)
    expect(getMock).toHaveBeenCalledWith("bannedAccountIds")
  })

  it("returns false when the Edge Config key is unset", async () => {
    getMock.mockResolvedValue(undefined)

    expect(await isAccountBanned("anyone.near")).toBe(false)
  })

  it("fails closed when get throws", async () => {
    getMock.mockRejectedValue(new Error("edge config outage"))

    expect(await isAccountBanned("anyone.near")).toBe(true)
  })

  it("fails closed when the stored value is not a string array", async () => {
    getMock.mockResolvedValue({ not: "an array" })

    expect(await isAccountBanned("anyone.near")).toBe(true)
  })

  it("fails closed when the array contains non-string entries", async () => {
    getMock.mockResolvedValue(["ok.near", 42])

    expect(await isAccountBanned("ok.near")).toBe(true)
  })
})
