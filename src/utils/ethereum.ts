import { Contract, ethers } from "ethers"

import { Erc20Abi } from "@src/abis/erc20"
import { logger } from "@src/utils/logger"

export async function ethereumNativeBalance(
  accountId: string,
  rpc: string
): Promise<string | null> {
  try {
    const provider = ethers.getDefaultProvider(rpc)
    const balance = await provider.getBalance(accountId)
    return balance.toString()
  } catch (e) {
    logger.error("Failed to check native balance")
    return null
  }
}

export async function ethereumERC20Balance(
  accountId: string,
  contractId: string,
  rpc: string
): Promise<string | null> {
  try {
    const provider = ethers.getDefaultProvider(rpc)
    const contract = new Contract(contractId, Erc20Abi, provider)
    const balance = await contract.balanceOf(accountId)
    return balance.toString()
  } catch (e) {
    // biome-ignore lint/style/useTemplate: <explanation>
    logger.error("Failed to check ERC-20 balance " + contractId)
    return null
  }
}
