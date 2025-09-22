import { getTokenId } from "@src/components/DefuseSDK/utils/token"
import { createStore } from "zustand/vanilla"
import type { TokenInfo } from "../types/base"

export type TokensState = {
  tokens: TokenInfo[]
}

export type TokensActions = {
  updateTokens: (tokens: TokenInfo[]) => void
}

export type TokensStore = TokensState & TokensActions

export const initTokensStore = (): TokensState => {
  return { tokens: [] }
}

export const defaultInitState: TokensState = { tokens: [] }

export const createTokensStore = (
  initState: TokensState = defaultInitState
) => {
  return createStore<TokensStore>()((set) => ({
    ...initState,
    updateTokens: (tokens: TokenInfo[]) =>
      set(() => {
        const updatedTokens = new Map<string, TokenInfo>()
        for (const item of tokens) {
          const tokenId = getTokenId(item)

          // Unified tokens may contain multiple tokens with the same defuseAssetId,
          // we take only the first one.
          if (!updatedTokens.has(tokenId)) {
            updatedTokens.set(tokenId, item)
          }
        }
        return { tokens: [...updatedTokens.values()] }
      }),
  }))
}
