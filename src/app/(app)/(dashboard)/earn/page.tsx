"use client"

import Button from "@src/components/Button"
import {
  formatTokenValue,
  formatUsdAmount,
} from "@src/components/DefuseSDK/utils/format"
import EarnDepositDialog from "@src/components/Earn/EarnDepositDialog"
import EarnWithdrawDialog from "@src/components/Earn/EarnWithdrawDialog"
import VaultCard from "@src/components/Earn/VaultCard"
import type { Vault } from "@src/components/Earn/types"
import { VAULT_METADATA } from "@src/constants/earn"
import { useEarnTokens } from "@src/hooks/useEarnTokens"
import { useState } from "react"

const VAULT: Vault = VAULT_METADATA

export default function EarnPage() {
  const [selected, setSelected] = useState<Vault | null>(null)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const { holdings, isConnected } = useEarnTokens()

  const smUsdcHolding = holdings?.[0]
  const smUsdcValue = smUsdcHolding?.value
  const hasPosition = smUsdcValue && smUsdcValue.amount > 0n

  return (
    <>
      <h1 className="text-gray-900 text-xl font-bold tracking-tight">Earn</h1>
      <p className="text-gray-500 text-sm mt-1">
        Deposit assets into vaults to earn yield
      </p>

      {/* User Position Card */}
      {isConnected && hasPosition && smUsdcValue && (
        <div className="mt-6 bg-white border border-gray-200 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                Your Position
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {formatTokenValue(smUsdcValue.amount, smUsdcValue.decimals, {
                  fractionDigits: 2,
                })}{" "}
                smUSDC
              </div>
              {smUsdcHolding?.usdValue !== undefined && (
                <div className="text-sm text-gray-500 mt-0.5">
                  {formatUsdAmount(smUsdcHolding.usdValue)}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 font-medium">Earning</div>
              <div className="text-lg font-bold text-green-600">
                {VAULT.apy}% APY
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setWithdrawOpen(true)}
              className="flex-1"
            >
              Withdraw
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setSelected(VAULT)}
              className="flex-1"
            >
              Deposit More
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <VaultCard vault={VAULT} onClick={() => setSelected(VAULT)} />
      </div>

      {selected && (
        <EarnDepositDialog
          open={!!selected}
          onClose={() => setSelected(null)}
          vault={selected}
        />
      )}

      <EarnWithdrawDialog
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        smUsdcBalance={smUsdcHolding?.value ?? null}
      />
    </>
  )
}
