import { createStore } from "zustand/vanilla"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../types/base"

export type TokensState = {
  data: Map<string, BaseTokenInfo | UnifiedTokenInfo>
  isLoading: boolean
  isFetched: boolean
}

export type TokensActions = {
  onLoad: () => void
  updateTokens: (data: (BaseTokenInfo | UnifiedTokenInfo)[]) => void
}

export type TokensStore = TokensState & TokensActions

export const initTokensStore = (): TokensState => {
  return {
    data: new Map(),
    isLoading: false,
    isFetched: false,
  }
}

export const defaultInitState: TokensState = {
  data: new Map(),
  isLoading: false,
  isFetched: false,
}

export const createTokensStore = (
  initState: TokensState = defaultInitState
) => {
  return createStore<TokensStore>()((set) => ({
    ...initState,
    onLoad: () => set({ isLoading: true }),
    updateTokens: (data: (BaseTokenInfo | UnifiedTokenInfo)[]) =>
      set((state) => {
        const updatedData = new Map(state.data)
        for (const item of data) {
          updatedData.set(
            "defuseAssetId" in item ? item.defuseAssetId : item.unifiedAssetId,
            item
          )
        }
        return { data: updatedData, isFetched: true, isLoading: false }
      }),
  }))
}
