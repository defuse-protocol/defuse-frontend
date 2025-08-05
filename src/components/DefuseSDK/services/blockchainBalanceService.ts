import { AccountLayout } from "@solana/spl-token"
import { Connection, PublicKey } from "@solana/web3.js"
import { Address as TonAddress, beginCell } from "@ton/ton"
import * as v from "valibot"
import { http, type Address, createPublicClient, erc20Abi } from "viem"
import { nearClient } from "../constants/nearClient"
import { logger } from "../logger"
import { decodeQueryResult } from "../utils/near"
import { createTonClient } from "./tonJettonService"

export const RESERVED_NEAR_BALANCE = 100000000000000000000000n // 0.1 NEAR reserved for transaction fees and storage

export const getNearNativeBalance = async ({
  accountId,
}: {
  accountId: string
}): Promise<bigint | null> => {
  try {
    const response = await nearClient.query({
      request_type: "view_account",
      finality: "final",
      account_id: accountId,
    })

    const parsed = v.parse(v.object({ amount: v.string() }), response)

    const balance = BigInt(parsed.amount)
    return balance < RESERVED_NEAR_BALANCE
      ? 0n
      : balance - RESERVED_NEAR_BALANCE
  } catch (err: unknown) {
    logger.error(
      new Error("error fetching near native balance", { cause: err })
    )
    return null
  }
}

export const getNearNep141Balance = async ({
  tokenAddress,
  accountId,
}: {
  tokenAddress: string
  accountId: string
}): Promise<bigint | null> => {
  try {
    const args = { account_id: accountId }
    const argsBase64 = Buffer.from(JSON.stringify(args)).toString("base64")

    const response = await nearClient.query({
      request_type: "call_function",
      method_name: "ft_balance_of",
      account_id: tokenAddress,
      args_base64: argsBase64,
      finality: "optimistic",
    })

    const result = decodeQueryResult(response, v.string())
    const balance = BigInt(result)
    return balance
  } catch (err: unknown) {
    logger.error(
      new Error("error fetching near nep141 balance", { cause: err })
    )
    return null
  }
}

export const getEvmNativeBalance = async ({
  userAddress,
  rpcUrl,
}: {
  userAddress: Address
  rpcUrl: string
}): Promise<bigint | null> => {
  try {
    const client = createPublicClient({
      transport: http(rpcUrl),
    })
    const balance = await client.getBalance({ address: userAddress })
    return BigInt(balance)
  } catch (err: unknown) {
    throw new Error("Error fetching balances", { cause: err })
  }
}

export const getEvmErc20Balance = async ({
  tokenAddress,
  userAddress,
  rpcUrl,
}: {
  tokenAddress: Address
  userAddress: Address
  rpcUrl: string
}): Promise<bigint | null> => {
  try {
    const client = createPublicClient({
      transport: http(rpcUrl),
    })
    const data = await client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [userAddress],
    })
    return BigInt(data)
  } catch (err: unknown) {
    logger.error(new Error("error fetching evm erc20 balance", { cause: err }))
    return null
  }
}

export const getSolanaNativeBalance = async ({
  userAddress,
  rpcUrl,
}: {
  userAddress: string
  rpcUrl: string
}): Promise<bigint | null> => {
  try {
    const connection = new Connection(rpcUrl, "confirmed")
    const publicKey = new PublicKey(userAddress)
    const balance = await connection.getBalance(publicKey)
    return BigInt(balance)
  } catch (err: unknown) {
    logger.error(
      new Error("error fetching Solana native balance", { cause: err })
    )
    return null
  }
}

export const getSolanaSplBalance = async ({
  userAddress,
  tokenAddress,
  rpcUrl,
}: {
  userAddress: string
  tokenAddress: string
  rpcUrl: string
}): Promise<bigint | null> => {
  try {
    const connection = new Connection(rpcUrl, "confirmed")
    const publicKey = new PublicKey(userAddress)
    const tokenPublicKey = new PublicKey(tokenAddress)

    const accounts = await connection.getTokenAccountsByOwner(publicKey, {
      mint: tokenPublicKey,
    })

    // Sum up all token accounts' balances (usually there's just one)
    const balance = accounts.value.reduce((total, accountInfo) => {
      const decoded = AccountLayout.decode(accountInfo.account.data)
      return total + BigInt(decoded.amount.toString())
    }, 0n)

    return balance
  } catch (err: unknown) {
    logger.error(
      new Error("error fetching Solana SPL token balance", { cause: err })
    )
    return null
  }
}

export const getTonNativeBalance = async ({
  userAddress,
  rpcUrl,
}: {
  userAddress: string
  rpcUrl: string
}): Promise<bigint | null> => {
  try {
    const client = createTonClient(rpcUrl)
    const balance = await client.getBalance(TonAddress.parse(userAddress))

    return BigInt(balance)
  } catch (err: unknown) {
    logger.error(new Error("error fetching TON native balance", { cause: err }))
    return null
  }
}

export const getTonJettonBalance = async ({
  tokenAddress,
  userAddress,
  rpcUrl,
}: {
  tokenAddress: string
  userAddress: string
  rpcUrl: string
}): Promise<bigint | null> => {
  try {
    const client = createTonClient(rpcUrl)
    const userTonAddress = TonAddress.parse(userAddress)
    const userAddressCell = beginCell().storeAddress(userTonAddress).endCell()

    const getWalletAddressResult = await client.runMethod(
      TonAddress.parse(tokenAddress),
      "get_wallet_address",
      [{ type: "slice", cell: userAddressCell }]
    )
    const jettonWalletAddress = getWalletAddressResult.stack.readAddress()

    const walletDataResult = await client.runMethod(
      jettonWalletAddress,
      "get_wallet_data"
    )
    const balance = walletDataResult.stack.readBigNumber()
    return balance
  } catch (err: unknown) {
    logger.error(new Error("error fetching TON Tep74 balance", { cause: err }))
    return null
  }
}
