import { type SnapshotFromStore, createStore } from "@xstate/store"
import type { TokenInfo, TokenValue } from "../../../types/base"
import { parseUnits } from "../../../utils/parse"
import { getTokenMaxDecimals } from "../../../utils/tokenUtils"
import type { GiftMakerFormValuesState } from "./giftMakerFormValuesStore"

type State = {
  token: null | TokenInfo
  amount: null | TokenValue
  message: string
  expiresAt: number | null
}

export const createGiftMakerFormParsedValuesStore = () =>
  createStore({
    context: {
      amount: null,
      token: null,
      message: "",
      expiresAt: null,
    } as State,
    emits: {
      valuesParsed: (_: { context: State }) => {},
    },
    on: {
      parseValues: (
        context,
        { formValues }: { formValues: GiftMakerFormValuesState },
        enqueue
      ) => {
        const newContext = {
          ...context,
          amount: parseTokenValue(formValues.token, formValues.amount),
          token: formValues.token,
          message: formValues.message,
          expiresAt: formValues.expiresAt,
        }
        enqueue.emit.valuesParsed({ context: newContext })
        return newContext
      },
    },
  })

function parseTokenValue(
  token: null | TokenInfo,
  value: string
): TokenValue | null {
  if (token == null) return null
  const decimals = getTokenMaxDecimals(token)
  try {
    return {
      amount: parseUnits(value, decimals),
      decimals,
    }
  } catch {
    return null
  }
}

export function allSetSelector(
  s: SnapshotFromStore<ReturnType<typeof createGiftMakerFormParsedValuesStore>>
) {
  return s.context.token != null && s.context.amount != null
}
