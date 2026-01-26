"use client"

import { ChevronRightIcon } from "@heroicons/react/20/solid"
import { UsdcIcon } from "@src/icons"
import type { Vault } from "./types"

export default function VaultCard({
  vault,
  onClick,
}: {
  vault: Vault
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-white border border-gray-200 rounded-3xl p-5 hover:border-gray-300 hover:shadow-sm transition-all text-left"
    >
      <div className="flex items-center gap-4">
        <div className="size-14 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
          <UsdcIcon className="size-10" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-lg font-semibold text-gray-900">
            {vault.name}
          </div>
          <div className="text-sm text-gray-500 mt-0.5">
            {vault.liquidity} liquidity
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xl font-bold text-green-600">{vault.apy}%</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">
              APY
            </div>
          </div>
          <ChevronRightIcon className="size-5 text-gray-400" />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Curator</span>
          <span className="font-medium text-gray-600">{vault.curator}</span>
        </div>
        <span className="text-gray-400">Powered by Morpho</span>
      </div>
    </button>
  )
}
