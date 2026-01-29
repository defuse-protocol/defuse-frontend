import Button from "@src/components/Button"

const PLACEHOLDER_VAULTS = [
  {
    token: "USDC",
    icon: "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
    apr: "8.2%",
    balance: "0.00",
  },
  {
    token: "ETH",
    icon: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    apr: "4.5%",
    balance: "0.00",
  },
  {
    token: "BTC",
    icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    apr: "2.1%",
    balance: "0.00",
  },
  {
    token: "NEAR",
    icon: "https://assets.coingecko.com/coins/images/10365/large/near.jpg",
    apr: "6.8%",
    balance: "0.00",
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

      <div className="flex gap-2 mt-auto">
        <Button variant="primary" size="md" fullWidth>
          Deposit
        </Button>
        <Button variant="outline" size="md" fullWidth>
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

      <div className="mt-6 relative">
        {/* Coming Soon Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-2xl">
          <div className="text-center px-6 py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Coming Soon
            </h2>
            <p className="text-gray-600 max-w-sm">
              Earn yield on your crypto assets by depositing into vaults.
              Multiple strategies, competitive rates.
            </p>
          </div>
        </div>

        {/* Dimmed Vault Cards Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-50 pointer-events-none select-none">
          {PLACEHOLDER_VAULTS.map((vault) => (
            <VaultCard key={vault.token} {...vault} />
          ))}
        </div>
      </div>
    </>
  )
}
