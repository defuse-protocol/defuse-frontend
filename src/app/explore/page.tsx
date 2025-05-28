"use client"

import Pill from "@src/components/Pill"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useTokenList } from "@src/hooks/useTokenList"
import Image from "next/image"

const tdClassNames = "py-4 px-6 text-center text-sm text-gray-12 font-medium"

const Page = () => {
  const tokenList = useTokenList(LIST_TOKENS)

  // Patch with mock change values for demo
  const mockPrices = [
    5432.12, 8765.43, 12345.67, 9876.54, 15432.1, 7654.32, 11234.56, 6543.21,
    14321.09, 10123.45,
  ]
  const mockChanges = [0.13, -9.2, 2.5, -1.1, 0, 3.7, -0.5, 4.2, -2.3, 1.8]
  const mockMindshare = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]
  const mockMarketCap = [
    45600000000, 98700000000, 12300000000, 67800000000, 34500000000,
    89100000000, 23400000000, 78900000000, 56700000000, 91200000000,
  ]
  const mockVolume = [
    34200000000, 87600000000, 15900000000, 56700000000, 29400000000,
    78300000000, 43200000000, 92100000000, 67500000000, 19800000000,
  ]
  const patchedTokenList = tokenList.map((token, idx) => ({
    ...token,
    price: mockPrices[idx % mockPrices.length],
    change: mockChanges[idx % mockChanges.length],
    mindshare: mockMindshare[idx % mockMindshare.length],
    marketCap: mockMarketCap[idx % mockMarketCap.length],
    volume: mockVolume[idx % mockVolume.length],
  }))

  console.log("tokenList", patchedTokenList)

  return (
    <div className="w-full flex flex-col mx-auto mt-[24px] md:mt-[64px] pl-[5%] pr-[5%] max-w-7xl gap-12">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row items-center gap-4">
          <h1 className="text-4xl font-extrabold tracking-tight">Explore</h1>
          <Pill>{patchedTokenList.length} assets</Pill>
        </div>
        <div className="flex flex-row items-center gap-4">
          <input
            type="text"
            placeholder="Search"
            className="rounded-md border border-gray-3 bg-gray-3 p-4 text-sm text-gray-11 dark:border-gray-7 dark:bg-gray-8 dark:text-white placeholder:text-gray-12 font-bold"
          />
          <select className="rounded-md border border-gray-3 font-bold bg-gray-3 p-4 pr-8 text-sm text-gray-12 dark:border-gray-7 dark:bg-gray-8 dark:text-white">
            <option value="1d">1 day</option>
            <option value="7d">7 days</option>
            <option value="1m">1 month</option>
            <option value="3m">3 months</option>
            <option value="6m">6 months</option>
            <option value="1y">1 year</option>
          </select>
        </div>
      </div>
      <table className="w-full shadow-2xl rounded-md bg-white dark:bg-gray-4">
        <thead className="sticky top-0 z-10">
          <tr className="text-left text-xs text-gray-11 dark:text-gray-12 py-4 px-6 bg-white dark:bg-gray-4">
            <th className="py-4 px-6">Token</th>
            <th className="py-4 px-6 text-center">Price</th>
            <th className="py-4 px-6 text-center">Change</th>
            <th className="py-4 px-6 text-center">Mindshare</th>
            <th className="py-4 px-6 text-center">Market Cap</th>
            <th className="py-4 px-6 text-center">Volume</th>
          </tr>
        </thead>
        <tbody className="max-h-[500px] overflow-y-auto">
          {patchedTokenList.map((token) => (
            <tr
              key={
                ("unifiedAssetId" in token && token.unifiedAssetId) ||
                ("defuseAssetId" in token && token.defuseAssetId) ||
                token.symbol +
                  ("chainName" in token ? token.chainName : "unified")
              }
              className="text-left text-xs text-gray-11 dark:text-gray-12 py-4 px-6 hover:bg-gray-3 dark:hover:bg-gray-3"
            >
              <td className="py-4 px-6">
                <div className="flex flex-row items-center gap-2">
                  <div className="relative overflow-hidden size-7 flex justify-center items-center rounded-full z-0">
                    <img
                      src={token.icon}
                      alt={token.name || "Coin Logo"}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <h1 className="text-sm font-bold text-gray-12">
                      {token.name}
                    </h1>
                    <p className="text-xs text-gray-11 dark:text-gray-12">
                      {token.symbol}
                    </p>
                  </div>
                </div>
              </td>
              <td className={tdClassNames}>${token.price.toFixed(2)}</td>
              <td className="py-4 px-6">
                <div className="flex flex-row justify-center items-center gap-2 text-sm text-gray-12 font-medium">
                  {typeof token.change === "number" && (
                    <>
                      <span
                        className={
                          token.change > 0
                            ? "text-green-600 font-medium"
                            : token.change < 0
                              ? "text-red-600 font-medium"
                              : "text-gray-11 font-medium"
                        }
                      >
                        {Math.abs(token.change).toFixed(2)}%
                      </span>
                      {token.change > 0 ? (
                        <svg
                          className="w-3 h-3 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <title>Up arrow</title>
                          <path d="M12 8L19 15H5L12 8Z" />
                        </svg>
                      ) : token.change < 0 ? (
                        <svg
                          className="w-3 h-3 text-red-600"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <title>Down arrow</title>
                          <path d="M12 16L19 9H5L12 16Z" />
                        </svg>
                      ) : null}
                    </>
                  )}
                </div>
              </td>
              <td className={tdClassNames}>{token.mindshare}%</td>
              <td className={tdClassNames}>
                {`$${(token.marketCap / 1e9).toFixed(1)}B`}
              </td>
              <td className={tdClassNames}>
                {`$${(token.volume / 1e9).toFixed(1)}B`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Page
