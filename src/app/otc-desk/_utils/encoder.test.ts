import { ENCRYPTION_KEY } from "@src/utils/environment"
import { describe, expect, it } from "vitest"
import { decodeAES256Order, encodeAES256Order } from "./encoder"

describe("encoder", () => {
  const makerMultiPayload = {
    payload:
      '{\n  "signer_id": "0xsucke9c9029ef5172c0a0f58ea6e7205a82a24e1",\n  "verifying_contract": "intents.near",\n  "deadline": "2025-05-13T10:47:06.528Z",\n  "nonce": "MabxnXcg2XmKJflJyvUELj1u5uLqjbbmx4lZuS+YLmk=",\n  "intents": [\n    {\n      "intent": "token_diff",\n      "diff": {\n        "nep141:wrap.near": "-177353300864365114070857",\n        "nep141:eth-0xa35923162c49cf95e6bf26623385eb431ad920d3.omft.near": "2493000000000000000"\n      },\n      "referral": "near-intents.intents-referral.near",\n      "memo": "OTC_CREATE"\n    }\n  ]\n}',
    signature:
      "secp256k1:CKUPsyCGCcTstHRvPR2sTU2LQFC5Rv3CbbSr3udUxPkB7amBhrzb1M4SZepeq1jyJLFjvFHZ3KycbD8iDsqgPsDk4",
    standard: "erc191",
  }

  it("should verify encryption/decryption with environment key", () => {
    const encrypted = encodeAES256Order(makerMultiPayload, ENCRYPTION_KEY)
    const decrypted = decodeAES256Order(encrypted, ENCRYPTION_KEY)
    expect(decrypted).toEqual(makerMultiPayload)
  })
})
