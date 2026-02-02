import { BlockchainEnum } from "@defuse-protocol/internal-utils"
import { describe, expect, it } from "vitest"
import type {
  BaseTokenInfo,
  TokenInfo,
  UnifiedTokenInfo,
} from "../../../types/base"
import type { Holding } from "../../account/types/sharedTypes"
import { buildContactTransferUrl } from "./buildContactTransferUrl"

function createBaseToken(
  symbol: string,
  chainName: string,
  defuseAssetId: string
): BaseTokenInfo {
  return {
    defuseAssetId,
    symbol,
    name: `${symbol} Token`,
    decimals: 6,
    icon: "icon.png",
    originChainName: chainName,
    deployments: [
      {
        chainName,
        bridge: "poa",
        decimals: 6,
        address: "0x123",
      },
    ],
  }
}

function createUnifiedToken(
  symbol: string,
  chainNames: string[]
): UnifiedTokenInfo {
  return {
    unifiedAssetId: `unified:${symbol.toLowerCase()}`,
    symbol,
    name: `${symbol} Token`,
    icon: "icon.png",
    groupedTokens: chainNames.map((chainName, i) =>
      createBaseToken(
        symbol,
        chainName,
        `nep141:${symbol.toLowerCase()}.${chainName}.token${i}`
      )
    ),
  }
}

function createHolding(token: UnifiedTokenInfo, usdValue: number): Holding {
  return {
    token,
    value: { amount: 1000000n, decimals: 6 },
    usdValue,
    transitValue: undefined,
    transitUsdValue: undefined,
  }
}

function createContact(blockchain: BlockchainEnum) {
  return {
    id: "123",
    contactId: "contact-uuid-123",
    accountId: "account-1",
    address: "0xABC123",
    name: "Test Contact",
    blockchain,
  }
}

describe("buildContactTransferUrl", () => {
  const defaultTokenList: TokenInfo[] = [
    createUnifiedToken("USDC", ["eth", "base", "solana"]),
    createUnifiedToken("ZEC", ["zcash"]),
    createUnifiedToken("BTC", ["bitcoin"]),
  ]

  it("returns highest-value token from holdings when available on network", () => {
    const contact = createContact(BlockchainEnum.ETHEREUM)
    const holdings: Holding[] = [
      createHolding(createUnifiedToken("USDC", ["eth", "base"]), 500),
      createHolding(createUnifiedToken("USDT", ["eth", "base"]), 200),
    ]

    const url = buildContactTransferUrl(contact, holdings, defaultTokenList)

    expect(url).toContain("token=USDC")
    expect(url).toContain("network=eth")
    expect(url).toContain("recipient=0xABC123")
    expect(url).toContain("contactId=contact-uuid-123")
  })

  it("falls back to token list when no holdings match the network", () => {
    const contact = createContact(BlockchainEnum.ZCASH)
    const holdings: Holding[] = [
      createHolding(createUnifiedToken("USDC", ["eth"]), 1000),
    ]

    const url = buildContactTransferUrl(contact, holdings, defaultTokenList)

    expect(url).toContain("token=ZEC")
    expect(url).toContain("network=zcash")
  })

  it("finds correct token for native networks without holdings", () => {
    const contact = createContact(BlockchainEnum.BITCOIN)

    const url = buildContactTransferUrl(contact, [], defaultTokenList)

    expect(url).toContain("token=BTC")
    expect(url).toContain("network=bitcoin")
  })

  it("omits token param when no token supports the network", () => {
    const contact = createContact(BlockchainEnum.DOGECOIN)
    const tokenListWithoutDoge: TokenInfo[] = [
      createUnifiedToken("USDC", ["eth"]),
    ]

    const url = buildContactTransferUrl(contact, [], tokenListWithoutDoge)

    expect(url).not.toContain("token=")
    expect(url).toContain("network=dogecoin")
  })
})
