import type {
  WalletSelector,
  WalletSelectorState,
} from "@near-wallet-selector/core"
import type {
  SignMessageParams,
  SignedMessage,
} from "@near-wallet-selector/core/src/lib/wallet/wallet.types"
import { useWalletSelector } from "@src/providers/WalletSelectorProvider"
import { useEffect, useState } from "react"
import { z } from "zod"

// Define substitute types
export type SignAndSendTransactionsParams = Parameters<
  // @ts-expect-error TODO: fix this
  WalletSelector["signAndSendTransactions"]
>[0]
type TransactionHashes = string

const signedMessageSchema = z.object({
  accountId: z.string(),
  publicKey: z.string(),
  signature: z.string(),
  state: z.string().optional(),
})

const errorSchema = z.object({
  error: z.string(),
})

const signMessageSchema = z.object({
  message: z.string(),
  recipient: z.string(),
  nonce: z.instanceof(Buffer),
  callbackUrl: z.string().optional(),
  state: z.string().optional(),
})

const windowMessageSchema = z.union([
  signedMessageSchema,
  errorSchema,
  z.object({
    errorCode: z.string(),
    errorMessage: z.string(),
  }),
  z.object({
    transactionHashes: z.string(),
  }),
])

interface SignOutput {
  signatureData: SignedMessage
  signedData: SignMessageParams
}

export const signMessageInNewWindow = async ({
  params,
  signal,
}: {
  signal: AbortSignal
  params: SignMessageParams
}): Promise<SignOutput> => {
  const completeAbortCtrl = new AbortController()

  /**
   * It is important to specify callbackUrl, otherwise near wallet SDK will
   * implicitly set `callbackUrl` to the current URL. As a result, the NEP-413
   * message will be different from ours, and we won't be able to verify the
   * signature.
   */
  params = { ...params, callbackUrl: getGatewayURL() }

  const promise = new Promise<SignOutput>((resolve, reject) => {
    openWindowWithMessageHandler({
      url: makeSignUrl(params),
      onMessage: (message) => {
        const parsedMessage = windowMessageSchema.safeParse(message)

        if (!parsedMessage.success) {
          reject(new Error("Invalid message", { cause: parsedMessage.error }))
          return
        }

        switch (true) {
          case "signature" in parsedMessage.data:
            resolve({ signatureData: parsedMessage.data, signedData: params })
            return
          case "error" in parsedMessage.data:
            reject(new Error(parsedMessage.data.error))
            return
          default:
            throw new Error("exhaustive check")
        }
      },
      onClose: () => {
        reject(new Error("Window closed"))
      },
      signal: AbortSignal.any([signal, completeAbortCtrl.signal]),
    })
  })

  return abortablePromise(promise, signal).finally(() => {
    // Teardown `openWindowWithMessageHandler`
    completeAbortCtrl.abort()
  })
}

export const signAndSendTransactionsInNewWindow = async ({
  params,
  signal,
}: {
  signal: AbortSignal
  params: SignAndSendTransactionsParams
}): Promise<TransactionHashes> => {
  const completeAbortCtrl = new AbortController()

  const promise = new Promise<TransactionHashes>((resolve, reject) => {
    openWindowWithMessageHandler({
      url: makeSignAndSendTransactionsUrl(params),
      onMessage: (message) => {
        const parsedMessage = windowMessageSchema.safeParse(message)

        if (!parsedMessage.success) {
          reject(new Error("Invalid message", { cause: parsedMessage.error }))
          return
        }

        switch (true) {
          case "transactionHashes" in parsedMessage.data:
            resolve(parsedMessage.data.transactionHashes)
            return
          case "errorCode" in parsedMessage.data:
            reject(new Error(parsedMessage.data.errorMessage))
            return
          default:
            throw new Error("exhaustive check")
        }
      },
      onClose: () => {
        reject(new Error("Window closed"))
      },
      signal: AbortSignal.any([signal, completeAbortCtrl.signal]),
    })
  })

  return promise
}

function getGatewayURL() {
  return `${window.location.origin}/my-near-wallet-gateway`
}

function makeSignUrl(params: SignMessageParams) {
  const serializedParams = serializeSignMessageParams(params)
  return `${getGatewayURL()}/?action=signMessage&params=${encodeURIComponent(serializedParams)}`
}

function makeSignAndSendTransactionsUrl(params: SignAndSendTransactionsParams) {
  const serializedParams = serializeSignAndSendTransactionsParams(params)
  return `${getGatewayURL()}/?action=signAndSendTransactions&params=${encodeURIComponent(serializedParams)}`
}

export function serializeSignAndSendTransactionsParams(
  params: SignAndSendTransactionsParams
) {
  const encodedParams = {
    ...params,
  }
  return JSON.stringify(encodedParams)
}

export function deserializeSignAndSendTransactionsParams(
  params: string
): SignAndSendTransactionsParams {
  return JSON.parse(params)
}

export function serializeSignMessageParams(params: SignMessageParams) {
  const encodedParams = {
    ...params,
    nonce: params.nonce.toString("base64"),
  }
  return JSON.stringify(encodedParams)
}

export function deserializeSignMessageParams(
  params: string
): SignMessageParams {
  const obj = JSON.parse(params)
  return signMessageSchema.parse({
    ...obj,
    nonce: Buffer.from(obj.nonce, "base64"),
  })
}

function openWindowWithMessageHandler({
  url,
  onMessage,
  onClose,
  signal,
}: {
  url: string
  onMessage: (data: unknown) => void
  onClose: () => void
  signal: AbortSignal
}) {
  const width = 800
  const height = 800
  const left = window.screen.width / 2 - width / 2
  const top = window.screen.height / 2 - height / 2

  const win = window.open(
    url,
    "_blank",
    `width=${width},height=${height},top=${top},left=${left},resizable,scrollbars`
  )

  const interval = setInterval(() => {
    if (win?.closed) {
      cleanup()
      onClose?.()
    }
  }, 1000)

  const messageHandler = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return
    if (event.source !== win) return

    onMessage(event.data)
  }

  window.addEventListener("message", messageHandler, { signal })
  signal.addEventListener("abort", cleanup, { once: true })

  function cleanup() {
    clearInterval(interval)
  }
}

/**
 * Returns a promise that resolves when either the promise or the signal is aborted
 */
function abortablePromise<T>(
  promise: Promise<T>,
  signal: AbortSignal
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      if (signal.aborted) {
        return reject(signal.reason || new Error("Operation aborted"))
      }
      signal.addEventListener("abort", () => {
        reject(signal.reason || new Error("Operation aborted"))
      })
    }),
  ])
}

export interface NearAccount {
  accountId: string
  pubKey: string
}

/**
 * Hook to get current account from Near wallets.
 * It is a workaround for MyNearWallet, which doesn't provide public key in the wallet.
 */
export function useNearCurrentAccount(): null | NearAccount {
  const { selector, accountId } = useWalletSelector()
  const [currentAccount, setCurrentAccount] = useState<null | NearAccount>(null)

  if (currentAccount == null && accountId != null) {
    const state = selector.store.getState()
    const nextNearCurrentAccount = determinePubKeyAndAccountId(state)
    if (nextNearCurrentAccount) {
      setCurrentAccount(nextNearCurrentAccount)
    }
  }

  useEffect(() => {
    const sub = selector.store.observable.subscribe((state) => {
      const nextNearCurrentAccount = determinePubKeyAndAccountId(state)
      setCurrentAccount((prev) => {
        // Don't want to accidentally change a reference of the object, if fields didn't change
        if (
          prev &&
          nextNearCurrentAccount &&
          prev.accountId === nextNearCurrentAccount.accountId &&
          prev.pubKey === nextNearCurrentAccount.pubKey
        ) {
          return prev
        }

        return nextNearCurrentAccount
      })
    })

    return () => {
      sub.unsubscribe()
    }
  }, [selector])

  return currentAccount
}

export function determinePubKeyAndAccountId(
  state: Pick<WalletSelectorState, "accounts" | "selectedWalletId">
) {
  const activeAccount = state.accounts.find((acc) => {
    return acc.active
  })

  if (!activeAccount) {
    return null
  }

  // MyNearWallet sets empty string when has no info about publicKey
  if (activeAccount.publicKey != null && activeAccount.publicKey !== "") {
    return {
      accountId: activeAccount.accountId,
      pubKey: activeAccount.publicKey,
    }
  }

  if (state.selectedWalletId === "my-near-wallet") {
    const pubKey = extractPubKeyFromLocalStorage(activeAccount.accountId)
    if (pubKey != null) {
      return {
        accountId: activeAccount.accountId,
        pubKey,
      }
    }
  }

  console.warn(
    "Cannot determine public key of the account, considering user unauthorized"
  )

  return null
}

function extractPubKeyFromLocalStorage(accountId: string): string | null {
  try {
    const nearWalletAuthKeyJson = localStorage.getItem(
      "near_app_wallet_auth_key"
    )
    if (nearWalletAuthKeyJson == null) {
      throw new Error("Cannot get near_app_wallet_auth_key from localStorage")
    }
    const nearWalletAuthKey = JSON.parse(nearWalletAuthKeyJson)

    if (nearWalletAuthKey.accountId !== accountId) {
      throw new Error("AccountId missmatch")
    }

    const pubkey = nearWalletAuthKey.allKeys[0] // We don't know which is correct, but assume it is first
    if (typeof pubkey !== "string") {
      throw new Error("Retrieved pubkey is not string")
    }

    return pubkey
  } catch (err) {
    console.error(err)
  }

  return null
}
