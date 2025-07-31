import { describe, expect, it } from "vitest"
import { extractRawSignature } from "./webAuthn"

describe("extractRawSignature()", () => {
  it("should return signature for ed25519 curve", () => {
    const signature = new Uint8Array([0, 1, 2, 3])
    expect(extractRawSignature(signature, "ed25519")).toEqual(signature)
  })

  it.each([
    {
      input:
        "304402200b858e8d13abdf3ed76bf3cf952d334010ed758e215d1db07d3a33e637d6caf1022051571f169a8ee96d083be9d13a12cf81923d6f3df87023ee5f3aa84f807af84a",
      expected:
        "0b858e8d13abdf3ed76bf3cf952d334010ed758e215d1db07d3a33e637d6caf151571f169a8ee96d083be9d13a12cf81923d6f3df87023ee5f3aa84f807af84a",
    },
    {
      input:
        "3045022100832953e1d9f09ca0896c735c8c6123e81cc2cf4935d31447010fa335703b71740220196fd6811317997dd6b570a8cf84cadd53ec3f7fe6f32080f55d2753f618e8a0",
      expected:
        "832953e1d9f09ca0896c735c8c6123e81cc2cf4935d31447010fa335703b7174196fd6811317997dd6b570a8cf84cadd53ec3f7fe6f32080f55d2753f618e8a0",
    },
    {
      input:
        "3045022001c42949178201fd9bcddff0415d4f0323431e1d02ed71d09a98882cb2bf3a4d022100aef1075c0c4d06e9879fef30169e107677e31efe2e653e00deefa11527df9b2c",
      expected:
        "01c42949178201fd9bcddff0415d4f0323431e1d02ed71d09a98882cb2bf3a4d510ef8a2f3b2f917786010cfe961ef894503dbaf78b2608414ca29add4838a25",
    },
    {
      input:
        "3046022100dc21f05d647d510ea22e9c7246a80331eae727255c3664f1473abfd83c3ee112022100f3f6b66ecd94148a01b36a2664e77b08a442d0041a05a7ae12b1147190ec356b",
      expected:
        "dc21f05d647d510ea22e9c7246a80331eae727255c3664f1473abfd83c3ee1120c094990326beb76fe4c95d99b1884f718a42aa98d11f6d6e108b6516b76efe6",
    },
  ])("should return signature for p256 curve", ({ input, expected }) => {
    const signature = Buffer.from(input, "hex")
    expect(extractRawSignature(signature, "p256")).toEqual(
      new Uint8Array(Buffer.from(expected, "hex"))
    )
  })
})
