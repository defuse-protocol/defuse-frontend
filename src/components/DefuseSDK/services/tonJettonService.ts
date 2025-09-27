import { Address, TonClient, beginCell } from "@ton/ton"
import axios from "axios"
import type { TokenDeployment } from "../types/base"
import { isNativeToken } from "../utils/token"

export interface JettonInfo {
  address: string
  decimals: number
}

export interface JettonWalletData {
  balance: bigint
  ownerAddress: Address
  adminAddress: Address | null
}

/**
 * Creates a TonClient instance with a custom httpAdapter configuration
 * to address CORS issues in the client environment.
 */
export function createTonClient(endpoint: string): TonClient {
  return new TonClient({
    endpoint,
    httpAdapter: (request) => {
      request.headers.delete("X-Ton-Client-Version")
      return axios.post(endpoint, request.data, {
        headers: request.headers,
      })
    },
  })
}

export function createTransferMessage(
  amount: bigint,
  destinationAddress: string,
  responseDestinationAddress: string
): string {
  const transferMessage = beginCell()
    .storeUint(0xf8a7ea5, 32) // opcode for jetton transfer
    .storeUint(0, 64) // query_id
    .storeCoins(amount)
    .storeAddress(Address.parse(destinationAddress)) // destination - where to send the tokens
    .storeAddress(Address.parse(responseDestinationAddress)) // response_destination - where to send response
    .storeUint(0, 1) // custom_payload: null (0 = no custom payload)
    .storeCoins(1) // forward_ton_amount - 0.000000001 TON for gas (as per TON docs)
    .storeUint(0, 1) // forward_payload: null (0 = no forward payload)
    .endCell()

  return transferMessage.toBoc().toString("base64")
}

export async function getUserJettonWalletAddress(
  client: TonClient,
  userWalletAddress: string,
  jettonMasterAddress: string
): Promise<string> {
  const userTonAddress = Address.parse(userWalletAddress)
  const userAddressCell = beginCell().storeAddress(userTonAddress).endCell()

  const getWalletAddressResult = await client.runMethod(
    Address.parse(jettonMasterAddress),
    "get_wallet_address",
    [{ type: "slice", cell: userAddressCell }]
  )
  const jettonWalletAddress = getWalletAddressResult.stack.readAddress()

  if (!jettonWalletAddress) {
    throw new Error("Jetton wallet address not found")
  }

  return jettonWalletAddress.toString()
}

export async function getJettonWalletData(
  client: TonClient,
  jettonWalletAddress: string
): Promise<JettonWalletData> {
  const walletDataResult = await client.runMethod(
    Address.parse(jettonWalletAddress),
    "get_wallet_data"
  )

  const balance = walletDataResult.stack.readBigNumber()
  const ownerAddress = walletDataResult.stack.readAddress()
  const adminAddress = walletDataResult.stack.readAddressOpt()

  return {
    balance,
    ownerAddress,
    adminAddress,
  }
}

export async function checkJettonWalletExists(
  client: TonClient,
  jettonWalletAddress: Address
): Promise<boolean> {
  try {
    await client.runMethod(jettonWalletAddress, "get_wallet_data")
    return true
  } catch {
    return false
  }
}

export async function checkTonJettonWalletRequired(
  client: TonClient,
  token: TokenDeployment,
  userWalletAddress: string | null
): Promise<boolean> {
  if (
    token.chainName !== "ton" ||
    isNativeToken(token) ||
    userWalletAddress === null
  ) {
    return false
  }

  try {
    const jettonWalletAddress = await getUserJettonWalletAddress(
      client,
      userWalletAddress,
      token.address
    )

    const walletExists = await checkJettonWalletExists(
      client,
      Address.parse(jettonWalletAddress)
    )
    return !walletExists
  } catch {
    return true
  }
}
