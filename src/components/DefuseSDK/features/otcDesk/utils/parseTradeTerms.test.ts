import { authIdentity } from "@defuse-protocol/internal-utils"
import { logger } from "@src/utils/logger"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  type SignerCredentials,
  formatSignedIntent,
} from "../../../core/formatters"
import {
  createEmptyIntentMessage,
  createSwapIntentMessage,
} from "../../../core/messages"
import { parseTradeTerms } from "./parseTradeTerms"

vi.mock("@src/utils/logger", () => ({
  logger: { error: vi.fn(), trace: vi.fn() },
}))

describe("parseTradeTerms", () => {
  const trader1: SignerCredentials = {
    credential: "joe.near",
    credentialType: "near",
  }
  const trade1Id = authIdentity.authHandleToIntentsUserId(
    trader1.credential,
    trader1.credentialType
  )
  const date1 = new Date("2025-02-23T10:00:00.000Z").getTime()

  // USDC
  const token1 =
    "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near"
  const token2 =
    "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1"

  // ETH
  const token3 = "nep141:eth.omft.near"
  const token4 = "nep141:aurora"

  const correctDiffs: Array<[[string, bigint][]]> = [
    [
      [
        [token1, 3n],
        [token3, -5n],
      ],
    ],
    [
      [
        [token1, 3n],
        [token2, 5n],
        [token3, -7n],
        [token4, -11n],
      ],
    ],
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each(correctDiffs)(
    "extracts diff and deadline from multipayload",
    async (inputDiff) => {
      const walletMessage = createSwapIntentMessage(inputDiff, {
        signerId: trade1Id,
        deadlineTimestamp: date1,
      })

      const keypair = privateKeyToAccount(generatePrivateKey())

      const multiPayload = formatSignedIntent(
        {
          type: "ERC191",
          signedData: walletMessage.ERC191,
          signatureData: await keypair.signMessage(walletMessage.ERC191),
        },
        trader1
      )

      expect(parseTradeTerms(JSON.stringify(multiPayload)).unwrap()).toEqual(
        expect.objectContaining({
          tokenDiff: Object.fromEntries(inputDiff),
          deadline: new Date(date1).toISOString(),
        })
      )
    }
  )

  it("returns null if multipayload does not contain any diffs", async () => {
    const walletMessage = createEmptyIntentMessage({
      signerId: trade1Id,
      deadlineTimestamp: date1,
    })

    const keypair = privateKeyToAccount(generatePrivateKey())

    const multiPayload = formatSignedIntent(
      {
        type: "ERC191",
        signedData: walletMessage.ERC191,
        signatureData: await keypair.signMessage(walletMessage.ERC191),
      },
      trader1
    )

    expect(parseTradeTerms(JSON.stringify(multiPayload)).unwrapErr()).toEqual(
      "NO_TOKEN_DIFF_INTENT"
    )
  })

  it("returns null if multipayload is malformed", () => {
    expect(parseTradeTerms("").unwrapErr()).toEqual("CANNOT_PARSE_MULTIPAYLOAD")
    expect(logger.trace).toHaveBeenCalledOnce()
  })
})
