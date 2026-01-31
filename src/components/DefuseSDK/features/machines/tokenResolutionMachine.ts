import { assign, setup } from "xstate"
import type { TokenUsdPriceData } from "../../hooks/useTokensUsdPrices"
import type { SupportedChainName, TokenInfo } from "../../types/base"
import {
  getDefuseAssetId,
  isBaseToken,
  isNativeToken,
  isUnifiedToken,
} from "../../utils/token"
import { computeTotalBalanceDifferentDecimals } from "../../utils/tokenUtils"
import type { BalanceMapping } from "./depositedBalanceMachine"

export type Presets = {
  network: SupportedChainName | "near_intents" | null
  tokenSymbol: string | null
}

type Context = {
  tokenList: TokenInfo[]
  currentToken: TokenInfo
  presets: Presets
  balances: BalanceMapping | null
  prices: TokenUsdPriceData | null
}

type Input = {
  tokenList: TokenInfo[]
  initialToken: TokenInfo
  presets: Presets
  initialPrices: TokenUsdPriceData | null
}

type Events = { type: "BALANCES_RECEIVED"; balances: BalanceMapping }

type Output = { token: TokenInfo }

export const tokenResolutionMachine = setup({
  types: {
    input: {} as Input,
    context: {} as Context,
    events: {} as Events,
    output: {} as Output,
  },
  guards: {
    canResolve: ({ context }) => {
      if (!context.balances) return false
      if (context.presets.network) return true
      return context.prices != null
    },
  },
  actions: {
    storeBalances: assign({
      balances: (_, params: { balances: BalanceMapping }) => params.balances,
    }),
  },
}).createMachine({
  id: "tokenResolution",
  context: ({ input }) => ({
    tokenList: input.tokenList,
    currentToken: input.initialToken,
    presets: input.presets,
    balances: null,
    prices: input.initialPrices,
  }),
  initial: "waiting",
  states: {
    waiting: {
      on: {
        BALANCES_RECEIVED: {
          actions: {
            type: "storeBalances",
            params: ({ event }) => ({ balances: event.balances }),
          },
        },
      },
      always: {
        guard: "canResolve",
        target: "resolved",
      },
    },
    resolved: { type: "final" },
  },
  output: ({ context }) => ({
    token: resolveOptimalToken(context),
  }),
})

function tokenSupportsNetwork(
  token: TokenInfo,
  network: SupportedChainName | "near_intents"
): boolean {
  if (network === "near_intents") return true

  if (isBaseToken(token)) {
    return token.deployments.some((d) => d.chainName === network)
  }
  if (isUnifiedToken(token)) {
    return token.groupedTokens.some((t) =>
      t.deployments.some((d) => d.chainName === network)
    )
  }
  return false
}

function isNativeForNetwork(
  token: TokenInfo,
  network: SupportedChainName
): boolean {
  if (isBaseToken(token)) {
    return token.deployments.some(
      (d) => d.chainName === network && isNativeToken(d)
    )
  }
  if (isUnifiedToken(token)) {
    return token.groupedTokens.some((gt) =>
      gt.deployments.some((d) => d.chainName === network && isNativeToken(d))
    )
  }
  return false
}

function getTokenUsdValue(
  token: TokenInfo,
  balances: BalanceMapping,
  prices: TokenUsdPriceData
): number {
  const balance = computeTotalBalanceDifferentDecimals(token, balances, {
    strict: false,
  })
  if (!balance || balance.amount === 0n) return 0

  const priceInfo = prices[getDefuseAssetId(token)]
  if (!priceInfo) return 0

  return (
    (Number(balance.amount) / 10 ** balance.decimals) *
    Number(priceInfo.price ?? 0)
  )
}

function hasBalance(token: TokenInfo, balances: BalanceMapping): boolean {
  const balance = computeTotalBalanceDifferentDecimals(token, balances, {
    strict: false,
  })
  return balance != null && balance.amount > 0n
}

/**
 * Resolution priority:
 * 1. Preset token symbol (prefer with balance)
 * 2. Native token with balance (when network preset, skip for near_intents)
 * 3. Highest USD value token
 * 4. Current token (default)
 */
// Export for reuse in WithdrawWidget initial validation
export { tokenSupportsNetwork }

function resolveOptimalToken(context: Context): TokenInfo {
  const { tokenList, currentToken, presets, balances, prices } = context

  if (!balances) return currentToken

  const { network } = presets
  const candidates =
    network != null
      ? tokenList.filter((t) => tokenSupportsNetwork(t, network))
      : tokenList

  if (candidates.length === 0) return currentToken

  if (presets.tokenSymbol != null) {
    const symbolLower = presets.tokenSymbol.toLowerCase()
    const matching = candidates.filter(
      (t) => t.symbol.toLowerCase() === symbolLower
    )
    const found = matching.find((t) => hasBalance(t, balances)) ?? matching[0]
    if (found) return found
  }

  if (network != null && network !== "near_intents") {
    const native = candidates.find(
      (t) => isNativeForNetwork(t, network) && hasBalance(t, balances)
    )
    if (native) return native
  }

  if (prices) {
    const ranked = candidates
      .filter((t) => hasBalance(t, balances))
      .map((t) => ({ token: t, usd: getTokenUsdValue(t, balances, prices) }))
      .filter((x) => x.usd > 0)
      .sort((a, b) => b.usd - a.usd)

    if (ranked.length > 0) return ranked[0].token
  }

  // When network is preset, always return a network-compatible token (first candidate)
  // even if user has no balance - this keeps the network locked
  if (network != null && candidates.length > 0) {
    return candidates[0]
  }

  return currentToken
}
