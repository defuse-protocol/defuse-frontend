import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  type OutputFrom,
  SimulatedClock,
  type StateValue,
  createActor,
  fromPromise,
  getNextSnapshot,
} from "xstate"
import { wait } from "../../utils/wait"
import type { swapIntentMachine } from "./swapIntentMachine"
import { swapUIMachine } from "./swapUIMachine"

describe.skip("swapUIMachine", () => {
  const defaultActorImpls = {
    formValidation: vi.fn(async (): Promise<boolean> => {
      return true
    }),
    queryQuote: vi.fn(async (): Promise<unknown> => {
      return {}
    }),
    swap: async (): Promise<OutputFrom<typeof swapIntentMachine>> => {
      // @ts-expect-error
      return {}
    },
  }

  const defaultActors = {
    formValidation: fromPromise(defaultActorImpls.formValidation),
    queryQuote: fromPromise(defaultActorImpls.queryQuote),
    swap: fromPromise(defaultActorImpls.swap),
  }

  const defaultActions = {
    updateUIAmountOut: vi.fn(),
  }

  const defaultGuards = {
    isQuoteRelevant: vi.fn(),
  }

  const defaultContext = {
    error: null,
    quote: null,
    outcome: null,
  }

  let actors: typeof defaultActors
  let actions: typeof defaultActions
  let guards: typeof defaultGuards
  let simulatedClock: SimulatedClock

  function populateMachine() {
    // @ts-expect-error
    return swapUIMachine.provide({ actors, actions, guards })
  }

  function interpret() {
    // @ts-expect-error
    return createActor(populateMachine(), { clock: simulatedClock })
  }

  beforeEach(() => {
    actors = { ...defaultActors }
    actions = { ...defaultActions }
    guards = { ...defaultGuards }
    simulatedClock = new SimulatedClock()
  })

  it.each`
    initialState      | expectedState           | event      | guards  | context
    ${"editing.idle"} | ${"editing.validating"} | ${"input"} | ${null} | ${null}
  `(
    'should reach "$expectedState" given "$initialState" when the "$event" event occurs',
    ({ initialState, expectedState, event, guards, context }) => {
      const machine = swapUIMachine.provide({
        guards: { ...defaultGuards, ...guards },
      })

      const actualState = getNextSnapshot(
        machine,
        machine.resolveState({
          value: parseDotNotation(initialState) as StateValue,
          context: context ?? defaultContext,
        }),
        { type: event, params: {} }
      )

      expect(actualState.matches(expectedState)).toBeTruthy()
    }
  )

  it("should start in the editing state", () => {
    const service = interpret().start()
    expect(service.getSnapshot().value).toEqual({ editing: "idle" })
  })

  it("should set and reset the quote querying error", async () => {
    // arrange
    const err = new Error("Something went wrong")
    defaultActorImpls.queryQuote
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce({})
    const service = interpret().start()

    // act
    // @ts-expect-error
    service.send({ type: "input" })
    simulatedClock.increment(10000)
    // give some time for machine to transition
    await wait(0)

    // assert
    expect(service.getSnapshot().context.error).toBe(err)

    service.send({ type: "input", params: {} })
    expect(service.getSnapshot().context.error).toBeNull()
  })
})

/**
 * This helper function to parse state paths in dot notation ("a.b.c" = {a: {b: c}})
 */
function parseDotNotation(str: string): object | string {
  const keys = str.split(".")
  const lastKey = keys.pop()

  if (lastKey === undefined) {
    throw new Error("lastKey is undefined")
  }

  return keys.reduceRight<string | object>((acc, key) => {
    return { [key]: acc }
  }, lastKey)
}
