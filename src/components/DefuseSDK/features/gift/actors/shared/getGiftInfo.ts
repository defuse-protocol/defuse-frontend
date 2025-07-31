import type { KeyPairString } from "near-api-js/lib/utils"
import { fromPromise } from "xstate"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../../../../types/base"
import { determineGiftToken } from "../../utils/determineGiftToken"
import {
  type GiftSecretError,
  parseGiftSecret,
} from "../../utils/parseGiftSecret"

export type GiftOpenSecretActorInput = {
  payload: string
  tokenList: (BaseTokenInfo | UnifiedTokenInfo)[]
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
  token: BaseTokenInfo | UnifiedTokenInfo
  secretKey: KeyPairString
  accountId: string
  message: string
}

export type GiftInfoErr =
  | {
      reason: "NO_TOKEN_OR_GIFT_HAS_BEEN_CLAIMED"
    }
  | GiftSecretError

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
