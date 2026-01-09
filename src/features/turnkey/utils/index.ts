import type { WalletAccount } from "@turnkey/react-wallet-kit"
import { serializeSignature } from "viem"

type SignMessageFn = (params: {
  message: string
  walletAccount: WalletAccount
  addEthereumPrefix?: boolean
}) => Promise<{ r: string; s: string; v: string }>

/**
 * Signs a message using Turnkey and returns an ERC-191 compatible signature.
 */
export async function signWithTurnkey(
  message: string,
  signMessage: SignMessageFn,
  account: WalletAccount
): Promise<`0x${string}`> {
  const { r, s, v } = await signMessage({
    message,
    walletAccount: account,
    addEthereumPrefix: true,
  })

  // Turnkey returns v as "00" or "01" (recovery param), convert to yParity
  const vNum = Number.parseInt(v, 16)
  const yParity = vNum < 2 ? vNum : vNum - 27

  return serializeSignature({
    r: `0x${r}` as `0x${string}`,
    s: `0x${s}` as `0x${string}`,
    yParity: yParity as 0 | 1,
  })
}
