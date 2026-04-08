import { Err, Ok, type Result } from "@thames/monads"
import type {
  ParsedPublishErrors,
  SerializedPublishError,
  SerializedResult,
} from "./utils/parseFailedPublishError"
import { mapPublishError } from "./utils/parseFailedPublishError"

export type PublishIntentsOk = string[]
export type PublishIntentsErr =
  | ParsedPublishErrors
  | { reason: "RELAY_PUBLISH_NETWORK_ERROR" }

export function convertPublishIntentsToLegacyFormat(
  result: SerializedResult<string[], SerializedPublishError>
): Promise<Result<PublishIntentsOk, PublishIntentsErr>> {
  if ("ok" in result) {
    return Promise.resolve(Ok(result.ok))
  }

  return Promise.resolve(Err(mapPublishError(result.err)))
}
