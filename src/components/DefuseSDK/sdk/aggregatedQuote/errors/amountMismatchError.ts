import { BaseError } from "../../../errors/base"
import type { TokenValue } from "../../../types/base"
import { subtractAmounts } from "../../../utils/tokenUtils"

export class AmountMismatchError extends BaseError {
  public readonly requested: TokenValue
  public readonly fulfilled: TokenValue
  public readonly shortfall: TokenValue
  public readonly nextFulfillable: TokenValue | null
  public readonly overage: TokenValue | null

  /**
   * @param requested
   * @param fulfilled
   * @param nextFulfillable - smallest higher (or null)
   */
  constructor({
    requested,
    fulfilled,
    nextFulfillable,
  }: {
    requested: TokenValue
    fulfilled: TokenValue
    nextFulfillable: TokenValue | null
  }) {
    const parts = [
      `Requested: ${requested.amount.toString()} (decimals ${requested.decimals})`,
      `Fulfilled: ${fulfilled.amount.toString()}`,
      nextFulfillable
        ? `Next possible: ${nextFulfillable.amount.toString()}`
        : undefined,
    ].filter(Boolean) as string[]

    super("Unable to fulfill requested amount", {
      metaMessages: parts,
    })
    this.name = "AmountMismatchError"

    this.requested = requested
    this.fulfilled = fulfilled
    this.shortfall = subtractAmounts(requested, fulfilled)
    this.nextFulfillable = nextFulfillable
    this.overage = nextFulfillable
      ? subtractAmounts(nextFulfillable, requested)
      : null
  }
}
