import { describe, expect, it } from "vitest"
import { authHandleToIntentsUserId } from "./authIdentity"

describe("authHandleToIntentsUserId", () => {
  it("returns lowercased Near account ID for 'near' chain type", () => {
    const result = authHandleToIntentsUserId("Bob.Near", "near")
    expect(result).toBe("bob.near")
  })

  it("returns lowercased Ethereum address for 'evm' chain type", () => {
    const result = authHandleToIntentsUserId(
      "0xc0ffee254729296a45a3885639AC7E10F9d54979",
      "evm"
    )
    expect(result).toBe("0xc0ffee254729296a45a3885639ac7e10f9d54979")
  })

  it("returns hex encoded Solana address for 'solana' chain type", () => {
    const result = authHandleToIntentsUserId(
      "3yAnWiDUbv2Ckjptk1D1HAwYHgqZKoqbR755ckY3n9oV",
      "solana"
    )
    expect(result).toBe(
      "2c1af676c3580b2ecde77673a38886cc16429b4b17744da5985a25152843a570"
    )
  })

  it("returns derived address for 'webauthn' chain type with P-256 curve", () => {
    const result = authHandleToIntentsUserId(
      "p256:3NSY8SFTWoPFMrTGdLVqPogirCyt3kMnUajXoDQuVeCsA6wzkMMp5whBqymAPM7xFiBthDKueiUv1zVAj7GDT8rQ",
      "webauthn"
    )
    expect(result).toBe("0xf54df4d2598c83e2293c616384442a70335e7859")
  })

  it("returns hex encoded public key for 'webauthn' chain type with Ed25519 curve", () => {
    const result = authHandleToIntentsUserId(
      "ed25519:Gz9STDrgGWdt2fh1g91v2n6SUsy5QKHbx86Nrjy2kFz5",
      "webauthn"
    )
    expect(result).toBe(
      "ed82f3aaf32b8825b67d23d1581edee4f90240ee57a2963c46f529c93d6ce5ae"
    )
  })

  it("throws if incorrect curve is provided", () => {
    expect(() =>
      authHandleToIntentsUserId(
        "foo:Gz9STDrgGWdt2fh1g91v2n6SUsy5QKHbx86Nrjy2kFz5",
        "webauthn"
      )
    ).toThrow()
  })
})
