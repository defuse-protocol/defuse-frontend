"use client"

import EarnDepositDialog from "@src/components/Earn/EarnDepositDialog"
import VaultCard from "@src/components/Earn/VaultCard"
import type { Vault } from "@src/components/Earn/types"
import { useState } from "react"

const VAULT: Vault = {
  address: "0x616a4e1db48e22028f6bbf20444cd3b8e3273738",
  name: "Seamless USDC Vault",
  token: "USDC",
  apy: 3.85,
  liquidity: "$26.44M",
  curator: "Gauntlet",
}

export default function EarnPage() {
  const [selected, setSelected] = useState<Vault | null>(null)

  return (
    <>
      <h1 className="text-gray-900 text-xl font-bold tracking-tight">Earn</h1>
      <p className="text-gray-500 text-sm mt-1">
        Deposit assets into vaults to earn yield
      </p>

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
    </>
  )
}
