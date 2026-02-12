const BankingPromo = () => {
  return (
    <div className="relative mt-9 bg-gray-800 rounded-3xl grid grid-cols-3 gap-4 group overflow-hidden">
      <div className="col-span-2 relative p-5 z-20">
        <div className="bg-green-500/20 text-green-500 text-xs rounded-lg px-2 py-1 inline-block uppercase font-bold">
          Coming soon
        </div>
        <div className="mt-4 mb-1">
          <h3 className="text-xl/6 font-bold text-white tracking-tight">
            Deposit via bank transfer
          </h3>
        </div>
        <p className="text-gray-400 text-sm text-balance font-medium">
          Send USD or EUR from your bank and receive stablecoins
        </p>
      </div>

      <div className="relative" aria-hidden="true">
        <div className="absolute size-32 -bottom-16 -right-16 rounded-full bg-green-500/80 blur-[75px] pointer-events-none" />
      </div>
    </div>
  )
}

export default BankingPromo
