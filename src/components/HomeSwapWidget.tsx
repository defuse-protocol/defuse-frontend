"use client"

import assert from "node:assert"
import { ChevronDownIcon } from "@heroicons/react/16/solid"
import Button from "@src/components/Button"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import type {
  BaseTokenInfo,
  TokenInfo,
} from "@src/components/DefuseSDK/types/base"
import { isBaseToken } from "@src/components/DefuseSDK/utils/token"
import { SimpleTokenSelectModal } from "@src/components/SimpleTokenSelectModal"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useSimpleQuote } from "@src/hooks/useSimpleQuote"
import clsx from "clsx"
import { useState } from "react"

function getBaseToken(token: TokenInfo): BaseTokenInfo {
  if (isBaseToken(token)) return token
  const base = token.groupedTokens[0]
  assert(base, "Unified token has no grouped tokens")
  return base
}

function findTokenBySymbol(symbol: string): TokenInfo {
  const token = LIST_TOKENS.find((t) => t.symbol === symbol)
  assert(token, `${symbol} not found in token list`)
  return token
}

const DEFAULT_TOKEN_IN = findTokenBySymbol("USDC")
const DEFAULT_TOKEN_OUT = findTokenBySymbol("NEAR")

type ModalTarget = "tokenIn" | "tokenOut" | null

export function HomeSwapWidget() {
  const [amountIn, setAmountIn] = useState("")
  const [tokenIn, setTokenIn] = useState<TokenInfo>(DEFAULT_TOKEN_IN)
  const [tokenOut, setTokenOut] = useState<TokenInfo>(DEFAULT_TOKEN_OUT)
  const [modalOpen, setModalOpen] = useState<ModalTarget>(null)

  const baseTokenIn = getBaseToken(tokenIn)
  const baseTokenOut = getBaseToken(tokenOut)

  const { amountOut, loading } = useSimpleQuote({
    tokenIn: baseTokenIn,
    tokenOut: baseTokenOut,
    amountIn,
  })

  const handleSelectToken = (token: TokenInfo) => {
    const baseToken = getBaseToken(token)
    if (modalOpen === "tokenIn") {
      if (baseToken.defuseAssetId === baseTokenOut.defuseAssetId) {
        setTokenOut(tokenIn)
      }
      setTokenIn(token)
    } else if (modalOpen === "tokenOut") {
      if (baseToken.defuseAssetId === baseTokenIn.defuseAssetId) {
        setTokenIn(tokenOut)
      }
      setTokenOut(token)
    }
  }

  return (
    <div className="relative">
      <div className="bg-gray-100 rounded-[27px] p-2 border border-gray-200 flex flex-col gap-2">
        <div className="p-6 rounded-3xl bg-white border border-gray-200 flex flex-col gap-4">
          <label htmlFor="sell">Sell</label>
          <div className="flex items-center justify-between gap-4">
            <input
              id="sell"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              autoComplete="off"
              placeholder="0"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              className="relative p-0 outline-hidden border-0 bg-transparent outline-none focus:ring-0 font-bold text-gray-900 text-4xl tracking-tight placeholder:text-gray-400 w-full font-sans"
            />
            <button
              type="button"
              onClick={() => setModalOpen("tokenIn")}
              className="rounded-full border border-gray-900/10 flex items-center gap-1.5 p-1 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-gray-900"
            >
              <AssetComboIcon icon={baseTokenIn.icon} sizeClassName="size-7" />
              <span className="text-base text-gray-900 font-semibold leading-none">
                {baseTokenIn.symbol}
              </span>
              <ChevronDownIcon className="size-4 text-gray-700" />
            </button>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-gray-200 flex flex-col gap-4">
          <label htmlFor="buy">Buy</label>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <input
                id="buy"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.]?[0-9]*"
                autoComplete="off"
                placeholder="0"
                value={amountOut}
                readOnly
                className={clsx(
                  "relative p-0 outline-hidden border-0 bg-transparent outline-none focus:ring-0 font-bold text-gray-900 text-4xl tracking-tight placeholder:text-gray-400 w-full",
                  {
                    "animate-pulse": loading,
                  }
                )}
              />
            </div>
            <button
              type="button"
              onClick={() => setModalOpen("tokenOut")}
              className="rounded-full border border-gray-900/10 flex items-center gap-1.5 p-1 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-gray-900"
            >
              <AssetComboIcon icon={baseTokenOut.icon} sizeClassName="size-7" />
              <span className="text-base text-gray-900 font-semibold leading-none">
                {baseTokenOut.symbol}
              </span>
              <ChevronDownIcon className="size-4 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      <Button
        size="xl"
        fullWidth
        className="mt-4"
        href="/login"
        loading={loading}
        disabled={loading}
      >
        Get started
      </Button>

      <SimpleTokenSelectModal
        open={modalOpen !== null}
        onClose={() => setModalOpen(null)}
        onSelect={handleSelectToken}
        selectedTokenId={
          modalOpen === "tokenIn"
            ? baseTokenIn.defuseAssetId
            : modalOpen === "tokenOut"
              ? baseTokenOut.defuseAssetId
              : undefined
        }
      />
    </div>
  )
}
