import type { TokenResponse } from "@defuse-protocol/one-click-sdk-typescript"
import { ONE_CS_CHAIN_TO_SUPPORTED_CHAIN_NAME } from "@src/components/DefuseSDK/constants/blockchains"
import type { Input } from "@src/components/DefuseSDK/features/machines/depositMachine"
import { logger } from "@src/components/DefuseSDK/logger"
import {
  FT_TRANSFER_GAS,
  checkSolanaATARequired1cs,
  createDepositEVMERC20Transaction,
  createDepositEVMNativeTransaction,
  createDepositSolanaTransaction1cs,
  createDepositTonTransaction1cs,
  waitEVMTransaction,
} from "@src/components/DefuseSDK/services/depositService"
import type { Transaction } from "@src/components/DefuseSDK/types/deposit"
import { assert } from "@src/components/DefuseSDK/utils/assert"
import { getEVMChainId } from "@src/components/DefuseSDK/utils/evmChainId"
import { ChainType, type useConnectWallet } from "@src/hooks/useConnectWallet"
import type { Hash } from "viem"

type Input1cs = Omit<
  Input,
  | "derivedToken"
  | "chainName"
  | "userWalletAddress"
  | "memo"
  | "type"
  | "storageDepositRequired"
  | "solanaATACreationRequired"
  | "tonJettonWalletCreationRequired"
> & {
  token: TokenResponse
}

function signAndSendTransactionsNear(
  sendTransactionNear: (tx: Transaction["NEAR"][]) => Promise<string | null>
) {
  return async ({ token, amount, depositAddress, balance }: Input1cs) => {
    const address = token.contractAddress ? token.contractAddress : null

    assert(address != null, "Address is not defined")
    assert(depositAddress != null, "Deposit address is not defined")

    // Additional validation: check if user has sufficient balance
    if (balance && balance < amount) {
      throw new Error(`Insufficient balance: ${balance} < ${amount}`)
    }

    // For all NEAR tokens (including wrap.near), use ft_transfer_call on the token contract
    const tx: Transaction["NEAR"][] = [
      {
        receiverId: address,
        actions: [
          {
            type: "FunctionCall" as const,
            params: {
              methodName: "ft_transfer_call",
              args: {
                receiver_id: depositAddress,
                amount: amount.toString(),
                msg: "",
              },
              gas: FT_TRANSFER_GAS,
              deposit: "1",
            },
          },
        ],
      },
    ]

    const txHash = await sendTransactionNear(tx)
    assert(txHash != null, "Transaction failed")
    return txHash
  }
}

function signAndSendTransactionsEVM(
  sendTransactionEVM: (tx: Transaction["EVM"]) => Promise<Hash | null>
) {
  return async ({ token, amount, depositAddress, userAddress }: Input1cs) => {
    const chainName = ONE_CS_CHAIN_TO_SUPPORTED_CHAIN_NAME[token.blockchain]
    const chainId = getEVMChainId(chainName)

    assert(depositAddress != null, "Deposit address is not defined")

    let tx: Transaction["EVM"]
    if (!token.contractAddress) {
      tx = createDepositEVMNativeTransaction(
        userAddress,
        depositAddress,
        amount,
        chainId
      )
    } else {
      tx = createDepositEVMERC20Transaction(
        userAddress,
        token.contractAddress,
        depositAddress,
        amount,
        chainId
      )
    }

    logger.verbose("Sending transfer EVM transaction")
    const txHash = await sendTransactionEVM(tx)
    assert(txHash != null, "Tx hash is not defined")

    logger.verbose("Waiting for transfer EVM transaction", {
      txHash,
    })
    const receipt = await waitEVMTransaction({ txHash, chainName })
    if (receipt.status === "reverted") {
      throw new Error("Transfer EVM transaction reverted")
    }

    return txHash
  }
}

function signAndSendTransactionsSolana(
  sendTransactionSolana: (tx: Transaction["Solana"]) => Promise<string | null>
) {
  return async ({ token, amount, depositAddress, userAddress }: Input1cs) => {
    assert(depositAddress != null, "Deposit address is not defined")

    const solanaATACreationRequired = await checkSolanaATARequired1cs(
      token,
      depositAddress
    )

    const tx = createDepositSolanaTransaction1cs({
      userAddress,
      depositAddress,
      amount,
      token,
      ataExists: !solanaATACreationRequired,
    })

    const txHash = await sendTransactionSolana(tx)
    assert(txHash != null, "Tx hash is not defined")

    return txHash
  }
}

function signAndSendTransactionsTon(
  sendTransactionTon: (tx: Transaction["TON"]) => Promise<string | null>
) {
  return async ({ amount, token, depositAddress, userAddress }: Input1cs) => {
    assert(depositAddress != null, "Deposit address is not defined")

    const tx = await createDepositTonTransaction1cs(
      userAddress,
      depositAddress,
      amount,
      token
    )

    const txHash = await sendTransactionTon(tx)
    assert(txHash != null, "Transaction failed")
    logger.verbose("Waiting for deposit TON transaction", {
      txHash,
    })

    return txHash
  }
}

async function unsupportedBlockchain({ token }: Input1cs): Promise<never> {
  throw new Error(`Unsupported blockchain: ${token.blockchain}`)
}

export function getSendTx(
  sendTransaction: ReturnType<typeof useConnectWallet>["sendTransaction"]
): Record<TokenResponse.blockchain, (input: Input1cs) => Promise<string>> {
  async function sendTransactionNear(tx: Transaction["NEAR"][]) {
    const result = await sendTransaction({
      id: ChainType.Near,
      tx,
    })
    return Array.isArray(result) ? result[0].transaction.hash : result
  }

  async function sendTransactionEVM({ from, ...tx }: Transaction["EVM"]) {
    const result = await sendTransaction({
      id: ChainType.EVM,
      tx: {
        ...tx,
        account: from,
      },
    })
    return Array.isArray(result) ? result[0].transaction.hash : result
  }

  async function sendTransactionSolana(tx: Transaction["Solana"]) {
    const result = await sendTransaction({
      id: ChainType.Solana,
      tx,
    })
    return Array.isArray(result) ? result[0].transaction.hash : result
  }

  async function sendTransactionTon(tx: Transaction["TON"]) {
    const result = await sendTransaction({
      id: ChainType.Ton,
      tx,
    })
    return Array.isArray(result) ? result[0].transaction.hash : result
  }

  return {
    // Near
    near: signAndSendTransactionsNear(sendTransactionNear),
    // EVM
    eth: signAndSendTransactionsEVM(sendTransactionEVM),
    base: signAndSendTransactionsEVM(sendTransactionEVM),
    arb: signAndSendTransactionsEVM(sendTransactionEVM),
    gnosis: signAndSendTransactionsEVM(sendTransactionEVM),
    bera: signAndSendTransactionsEVM(sendTransactionEVM),
    pol: signAndSendTransactionsEVM(sendTransactionEVM),
    bsc: signAndSendTransactionsEVM(sendTransactionEVM),
    op: signAndSendTransactionsEVM(sendTransactionEVM),
    avax: signAndSendTransactionsEVM(sendTransactionEVM),
    // Solana
    sol: signAndSendTransactionsSolana(sendTransactionSolana),
    // TON
    ton: signAndSendTransactionsTon(sendTransactionTon),
    // Unsupported blockchains
    doge: unsupportedBlockchain,
    btc: unsupportedBlockchain,
    xrp: unsupportedBlockchain,
    zec: unsupportedBlockchain,
    tron: unsupportedBlockchain,
    sui: unsupportedBlockchain,
    cardano: unsupportedBlockchain,
  }
}
