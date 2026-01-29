import { ChartBarIcon } from "@heroicons/react/24/outline"
import Button from "@src/components/Button"

const PLACEHOLDER_VAULTS = [
  {
    token: "USDC",
    icon: "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
    apr: "8.2%",
    balance: "12,300",
  },
  {
    token: "ETH",
    icon: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    apr: "4.5%",
    balance: "4.2",
  },
  {
    token: "BTC",
    icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    apr: "2.1%",
    balance: "0.54",
  },
  {
    token: "NEAR",
    icon: "https://assets.coingecko.com/coins/images/10365/large/near.jpg",
    apr: "6.8%",
    balance: "4,200",
  },
]

function VaultCard({
  token,
  icon,
  apr,
  balance,
}: {
  token: string
  icon: string
  apr: string
  balance: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
          <img src={icon} alt={token} className="size-full object-contain" />
        </div>
        <div>
          <div className="text-base font-semibold text-gray-900">{token}</div>
          <div className="text-sm text-gray-500">Vault</div>
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-sm text-gray-500">APR</span>
        <span className="text-2xl font-bold text-green-600">{apr}</span>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-sm text-gray-500">Your balance</span>
        <span className="text-sm font-medium text-gray-900">
          {balance} {token}
        </span>
      </div>

      <div className="flex flex-col gap-2 mt-auto pt-2">
        <Button variant="primary" size="sm" fullWidth>
          Deposit
        </Button>
        <Button variant="outline" size="sm" fullWidth>
          Withdraw
        </Button>
      </div>
    </div>
  )
}

export default function EarnPage() {
  return (
    <>
      <h1 className="text-gray-900 text-xl font-bold tracking-tight">Earn</h1>

      {/* Coming Soon Banner */}
      <div className="mt-6 mb-4 text-center py-6 px-4 bg-gradient-to-b from-brand/10 to-white rounded-2xl border border-brand/20">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ChartBarIcon className="size-6 text-brand" />
          <h2 className="text-xl font-bold text-gray-900">Coming Soon</h2>
        </div>
        <p className="text-gray-600 text-sm">
          Put your idle assets to work. No lockups. Withdraw anytime.
        </p>
      </div>

      {/* Dimmed Vault Cards Preview */}
      <div className="relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-40 pointer-events-none select-none">
          {PLACEHOLDER_VAULTS.map((vault) => (
            <VaultCard key={vault.token} {...vault} />
          ))}
        </div>
      </div>
    </>
  )
}
