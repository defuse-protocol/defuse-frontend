import type { KeyPairString } from "near-api-js/lib/utils"
import { fromPromise } from "xstate"
import type { BaseTokenInfo, TokenInfo } from "../../../../types/base"
import { determineGiftToken } from "../../utils/determineGiftToken"
import {
  type GiftSecretError,
  parseGiftSecret,
} from "../../utils/parseGiftSecret"

export type GiftOpenSecretActorInput = {
  payload: string
  tokenList: TokenInfo[]
}

export type GiftOpenSecretActorOutput =
  | {
      tag: "ok"
      value: {
        giftInfo: GiftInfo
      }
    }
  | {
      tag: "err"
      value: GiftInfoErr
    }

export type GiftInfo = {
  tokenDiff: Record<BaseTokenInfo["defuseAssetId"], bigint>
  token: TokenInfo
  secretKey: KeyPairString
  accountId: string
  message: string
  expiresAt?: number | null
}

export type GiftInfoErr =
  | {
      reason: "NO_TOKEN_OR_GIFT_HAS_BEEN_CLAIMED"
    }
  | {
      reason: "GIFT_EXPIRED"
    }
  | GiftSecretError

// TODO: Decide on expired gift behavior:
// Option A: Expired gifts auto-refund to creator (requires background job)
// Option B: Expired gifts become unclaimable (funds locked until creator cancels)
// Current: Option B - creator can still cancel manually

export const getGiftInfo = fromPromise(
  async ({
    input,
  }: {
    input: GiftOpenSecretActorInput
  }): Promise<GiftOpenSecretActorOutput> => {
    const parseResult = parseGiftSecret(input.payload)
    if (parseResult.isErr()) {
      return {
        tag: "err",
        value: parseResult.unwrapErr(),
      }
    }

    const { escrowCredentials, message } = parseResult.unwrap()

    const determineResult = await determineGiftToken(
      input.tokenList,
      escrowCredentials
    )
    if (determineResult.isErr()) {
      return {
        tag: "err",
        value: { reason: "NO_TOKEN_OR_GIFT_HAS_BEEN_CLAIMED" },
      }
    }
    const { tokenDiff, token } = determineResult.unwrap()
    const accountId = escrowCredentials.credential
    const secretKey = escrowCredentials.secretKey

    return {
      tag: "ok",
      value: {
        giftInfo: {
          tokenDiff,
          token,
          secretKey,
          accountId,
          message,
        },
      },
    }
  }
)
