import { AuthMethod, type authHandle } from "@defuse-protocol/internal-utils"
import { authIdentity } from "@defuse-protocol/internal-utils"
import { computeAppFeeBps } from "@src/components/DefuseSDK/utils/appFee"
import { APP_FEE_BPS, APP_FEE_RECIPIENT } from "@src/utils/environment"
import { logger } from "@src/utils/logger"
import type { providers } from "near-api-js"
import {
  type ActorRefFrom,
  assertEvent,
  assign,
  emit,
  sendTo,
  setup,
  spawnChild,
} from "xstate"
import type { QuoteResult } from "../../services/quoteService"
import type { BaseTokenInfo, TokenValue } from "../../types/base"
import type { TokenInfo } from "../../types/base"
import { assert } from "../../utils/assert"
import { parseUnits } from "../../utils/parse"
import {
  computeTotalDeltaDifferentDecimals,
  getAnyBaseTokenInfo,
  getTokenMaxDecimals,
  getUnderlyingBaseTokenInfos,
} from "../../utils/tokenUtils"
import {
  type Events as Background1csQuoterEvents,
  type ParentEvents as Background1csQuoterParentEvents,
  background1csQuoterMachine,
} from "./background1csQuoterMachine"
import {
  type Events as BackgroundQuoterEvents,
  type ParentEvents as BackgroundQuoterParentEvents,
  backgroundQuoterMachine,
} from "./backgroundQuoterMachine"

import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { isBaseToken } from "@src/components/DefuseSDK/utils/token"
import { formatUnits } from "viem"
import {
  type BalanceMapping,
  type Events as DepositedBalanceEvents,
  balancesSelector,
  depositedBalanceMachine,
} from "./depositedBalanceMachine"
import { intentStatusMachine } from "./intentStatusMachine"
import { oneClickStatusMachine } from "./oneClickStatusMachine"
import {
  type Output as SwapIntent1csMachineOutput,
  swapIntent1csMachine,
} from "./swapIntent1csMachine"
import {
  type Output as SwapIntentMachineOutput,
  swapIntentMachine,
} from "./swapIntentMachine"

function getTokenDecimals(token: TokenInfo) {
  return isBaseToken(token) ? token.decimals : token.groupedTokens[0].decimals
}

export type Context = {
  user: null | authHandle.AuthHandle
  error: Error | null
  quote: QuoteResult | null
  quote1csError: string | null
  formValues: {
    tokenIn: TokenInfo
    tokenOut: TokenInfo
    amountIn: string
    amountOut: string
    swapType: QuoteRequest.swapType | null
  }
  parsedFormValues: {
    tokenIn: BaseTokenInfo
    tokenOut: BaseTokenInfo
    amountIn: TokenValue | null
    amountOut: TokenValue | null
  }
  intentCreationResult:
    | SwapIntentMachineOutput
    | SwapIntent1csMachineOutput
    | null
  intentRefs: (
    | ActorRefFrom<typeof intentStatusMachine>
    | ActorRefFrom<typeof oneClickStatusMachine>
  )[]
  tokenList: TokenInfo[]
  referral?: string
  slippageBasisPoints: number
  is1cs: boolean
  priceChangeDialog: null | {
    pendingNewOppositeAmount: { amount: bigint; decimals: number }
    previousOppositeAmount: { amount: bigint; decimals: number }
  }
}

type PassthroughEvent =
  | {
      type: "INTENT_SETTLED"
      data: {
        intentHash: string
        txHash: string
        tokenIn: TokenInfo
        tokenOut: TokenInfo
      }
    }
  | {
      type: "ONE_CLICK_SETTLED"
      data: {
        depositAddress: string
        status: string
        tokenIn: TokenInfo
        tokenOut: TokenInfo
      }
    }

type EmittedEvents = PassthroughEvent | { type: "INTENT_PUBLISHED" }

export const ONE_CLICK_PREFIX = "oneclick-"

export const swapUIMachine = setup({
  types: {
    input: {} as {
      tokenIn: TokenInfo
      tokenOut: TokenInfo
      tokenList: TokenInfo[]
      referral?: string
      is1cs: boolean
    },
    context: {} as Context,
    events: {} as
      | {
          type: "input"
          params: Partial<{
            tokenIn: TokenInfo
            tokenOut: TokenInfo
            amountIn: string
            amountOut: string
            swapType: QuoteRequest.swapType
          }>
        }
      | {
          type: "submit"
          params: {
            userAddress: string
            userChainType: AuthMethod
            nearClient: providers.Provider
          }
        }
      | {
          type: "BALANCE_CHANGED"
          params: {
            changedBalanceMapping: BalanceMapping
          }
        }
      | {
          type: "NEW_1CS_QUOTE"
          params: {
            result:
              | {
                  ok: {
                    quote: {
                      amountIn: string
                      amountOut: string
                      deadline?: string
                    }
                    appFee: [string, bigint][]
                  }
                }
              | { err: string }
            tokenInAssetId: string
            tokenOutAssetId: string
          }
        }
      | BackgroundQuoterParentEvents
      | Background1csQuoterParentEvents
      | DepositedBalanceEvents
      | {
          type: "PRICE_CHANGE_CONFIRMATION_REQUEST"
          params: {
            newOppositeAmount: { amount: bigint; decimals: number }
            previousOppositeAmount: { amount: bigint; decimals: number }
          }
        }
      | { type: "PRICE_CHANGE_CONFIRMED" }
      | { type: "PRICE_CHANGE_CANCELLED" }
      | PassthroughEvent,

    emitted: {} as EmittedEvents,

    children: {} as {
      depositedBalanceRef: "depositedBalanceActor"
      backgroundQuoterRef: "backgroundQuoterActor"
      background1csQuoterRef: "background1csQuoterActor"
      swapRef: "swapActor"
      swapRef1cs: "swap1csActor"
    },
  },
  actors: {
    backgroundQuoterActor: backgroundQuoterMachine,
    background1csQuoterActor: background1csQuoterMachine,
    depositedBalanceActor: depositedBalanceMachine,
    swapActor: swapIntentMachine,
    swap1csActor: swapIntent1csMachine,
    intentStatusActor: intentStatusMachine,
    oneClickStatusActor: oneClickStatusMachine,
  },
  actions: {
    setUser: assign({
      user: (_, v: Context["user"]) => v,
    }),
    setFormValues: assign({
      formValues: (
        { context },
        {
          data,
        }: {
          data: Partial<{
            tokenIn: TokenInfo
            tokenOut: TokenInfo
            amountIn: string
            amountOut: string
          }>
        }
      ) => {
        return {
          ...context.formValues,
          ...data,
        }
      },
    }),
    resetFormValueAmounts: assign({
      formValues: ({ context }) => {
        return {
          ...context.formValues,
          ...{
            amountIn: "",
            amountOut: "",
          },
        }
      },
    }),
    resetParsedFormValueAmounts: assign({
      parsedFormValues: ({ context }) => {
        return {
          ...context.parsedFormValues,
          ...{
            amountIn: null,
            amountOut: null,
          },
        }
      },
    }),
    parseFormValues: assign({
      parsedFormValues: ({ context }) => {
        const tokenIn = getAnyBaseTokenInfo(context.formValues.tokenIn)
        const tokenOut = getAnyBaseTokenInfo(context.formValues.tokenOut)

        try {
          const decimalsIn = context.is1cs
            ? getTokenDecimals(context.formValues.tokenIn)
            : getTokenMaxDecimals(context.formValues.tokenIn)
          const decimalsOut = context.is1cs
            ? getTokenDecimals(context.formValues.tokenOut)
            : getTokenMaxDecimals(context.formValues.tokenOut)
          return {
            tokenIn,
            tokenOut,
            amountIn:
              context.formValues.amountIn === "" ||
              Number.isNaN(+context.formValues.amountIn)
                ? null
                : {
                    amount: parseUnits(context.formValues.amountIn, decimalsIn),
                    decimals: decimalsIn,
                  },
            amountOut:
              context.formValues.amountOut === "" ||
              Number.isNaN(+context.formValues.amountOut)
                ? null
                : {
                    amount: parseUnits(
                      context.formValues.amountOut,
                      decimalsOut
                    ),
                    decimals: decimalsOut,
                  },
          }
        } catch {
          return {
            tokenIn,
            tokenOut,
            amountIn: null,
            amountOut: null,
          }
        }
      },
    }),
    updateFormValuesWithQuoteData: assign({
      formValues: ({ context }) => {
        const quote = context.quote
        if (quote === null || quote.tag === "err") return context.formValues
        const exactOutQuote =
          context.formValues.swapType === QuoteRequest.swapType.EXACT_OUTPUT
        const fieldNameToUpdate = exactOutQuote ? "amountIn" : "amountOut"
        const totalAmount = computeTotalDeltaDifferentDecimals(
          [
            exactOutQuote
              ? context.parsedFormValues.tokenIn
              : context.parsedFormValues.tokenOut,
          ],
          quote.value.tokenDeltas
        )
        return {
          ...context.formValues,
          ...{
            [fieldNameToUpdate]: formatUnits(
              totalAmount.amount < 0n
                ? -totalAmount.amount
                : totalAmount.amount,
              totalAmount.decimals
            ),
          },
        }
      },
    }),
    updateUIAmount: () => {
      throw new Error("not implemented")
    },
    setQuote: assign({
      quote: ({ context }, newQuote: QuoteResult) => {
        const prevQuote = context.quote
        if (
          newQuote.tag === "ok" ||
          prevQuote == null ||
          prevQuote.tag === "err"
        ) {
          return newQuote
        }
        return prevQuote
      },
    }),
    clearQuote: assign({ quote: null }),
    clearError: assign({ error: null }),
    clear1csError: assign({ quote1csError: null }),
    setIntentCreationResult: assign({
      intentCreationResult: (
        _,
        value: SwapIntentMachineOutput | SwapIntent1csMachineOutput
      ) => value,
    }),
    clearIntentCreationResult: assign({ intentCreationResult: null }),
    openPriceChangeDialog: assign({
      priceChangeDialog: (
        _,
        params: {
          newOppositeAmount: { amount: bigint; decimals: number }
          previousOppositeAmount: { amount: bigint; decimals: number }
        }
      ) => ({
        pendingNewOppositeAmount: params.newOppositeAmount,
        previousOppositeAmount: params.previousOppositeAmount,
      }),
    }),
    closePriceChangeDialog: assign({ priceChangeDialog: null }),
    sendToSwapRef1csConfirm: sendTo("swapRef1cs", () => ({
      type: "PRICE_CHANGE_CONFIRMED",
    })),
    sendToSwapRef1csCancel: sendTo("swapRef1cs", () => ({
      type: "PRICE_CHANGE_CANCELLED",
    })),
    passthroughEvent: emit((_, event: PassthroughEvent) => event),
    spawnBackgroundQuoterRef: spawnChild("backgroundQuoterActor", {
      id: "backgroundQuoterRef",
      input: ({ self }) => ({ parentRef: self }),
    }),
    spawnBackground1csQuoterRef: spawnChild("background1csQuoterActor", {
      id: "background1csQuoterRef",
      input: ({ self }) => ({ parentRef: self }),
    }),
    // Warning: This cannot be properly typed, so you can send an incorrect event
    sendToBackgroundQuoterRefNewQuoteInput: sendTo(
      "backgroundQuoterRef",
      ({ context, self }): BackgroundQuoterEvents => {
        const snapshot = self.getSnapshot()

        // However knows how to access the child's state, please update this
        const depositedBalanceRef:
          | ActorRefFrom<typeof depositedBalanceMachine>
          | undefined = snapshot.children.depositedBalanceRef
        const balances = balancesSelector(depositedBalanceRef?.getSnapshot())

        assert(context.parsedFormValues.amountIn != null, "amountIn is not set")

        return {
          type: "NEW_QUOTE_INPUT",
          params: {
            tokenIn: context.formValues.tokenIn,
            tokenOut: context.parsedFormValues.tokenOut,
            amountIn: context.parsedFormValues.amountIn,
            balances: balances ?? {},
            appFeeBps: computeAppFeeBps(
              APP_FEE_BPS,
              context.formValues.tokenIn,
              context.formValues.tokenOut,
              APP_FEE_RECIPIENT,
              context.user
            ),
          },
        }
      }
    ),
    // Warning: This cannot be properly typed, so you can send an incorrect event
    sendToBackgroundQuoterRefPause: sendTo("backgroundQuoterRef", {
      type: "PAUSE",
    }),
    sendToBackground1csQuoterRefNewQuoteInput: sendTo(
      "background1csQuoterRef",
      ({ context }): Background1csQuoterEvents => {
        assert(context.formValues.swapType !== null, "swap type not set")
        const amount =
          context.formValues.swapType === QuoteRequest.swapType.EXACT_INPUT
            ? context.parsedFormValues.amountIn
            : context.parsedFormValues.amountOut

        assert(amount !== null, "amount not set")

        const user =
          context.user ??
          ({ identifier: "check-price", method: AuthMethod.Near } as const)

        return {
          type: "NEW_QUOTE_INPUT",
          params: {
            tokenIn: context.parsedFormValues.tokenIn,
            tokenOut: context.parsedFormValues.tokenOut,
            amount,
            swapType: context.formValues.swapType,
            slippageBasisPoints: context.slippageBasisPoints,
            defuseUserId: authIdentity.authHandleToIntentsUserId(
              user.identifier,
              user.method
            ),
            deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            userAddress: user.identifier,
            userChainType: user.method,
          },
        }
      }
    ),
    sendToBackground1csQuoterRefPause: sendTo("background1csQuoterRef", {
      type: "PAUSE",
    }),

    spawnDepositedBalanceRef: spawnChild("depositedBalanceActor", {
      id: "depositedBalanceRef",
      input: ({ self, context }) => ({
        parentRef: self,
        tokenList: context.tokenList,
      }),
    }),
    relayToDepositedBalanceRef: sendTo(
      "depositedBalanceRef",
      (_, event: DepositedBalanceEvents) => event
    ),
    sendToDepositedBalanceRefRefresh: sendTo("depositedBalanceRef", (_) => ({
      type: "REQUEST_BALANCE_REFRESH",
    })),

    sendToDepositedBalanceRefRemoveAccount: sendTo(
      "depositedBalanceRef",
      (_, params: { depositAddress: string }) => ({
        type: "REMOVE_ACCOUNT",
        params: {
          accountId: authIdentity.authHandleToIntentsUserId(
            params.depositAddress,
            "near"
          ),
        },
      })
    ),

    // Warning: This cannot be properly typed, so you can send an incorrect event
    sendToSwapRefNewQuote: sendTo(
      "swapRef",
      (_, event: BackgroundQuoterParentEvents) => event
    ),

    spawnIntentStatusActor: assign({
      intentRefs: (
        { context, spawn, self },
        output: SwapIntentMachineOutput | SwapIntent1csMachineOutput
      ) => {
        if (output.tag !== "ok") return context.intentRefs

        if (context.is1cs && "depositAddress" in output.value) {
          const swapDescription = output.value.intentDescription as Extract<
            typeof output.value.intentDescription,
            { type: "swap" }
          >
          const oneClickRef = spawn("oneClickStatusActor", {
            id: `${ONE_CLICK_PREFIX}${output.value.depositAddress}`,
            input: {
              parentRef: self,
              intentHash: output.value.intentHash,
              depositAddress: output.value.depositAddress,
              tokenIn: context.formValues.tokenIn,
              tokenOut: context.formValues.tokenOut,
              totalAmountIn: swapDescription.totalAmountIn,
              totalAmountOut: swapDescription.totalAmountOut,
            },
          })

          return [oneClickRef, ...context.intentRefs]
        }

        const intentRef = spawn("intentStatusActor", {
          id: `intent-${output.value.intentHash}`,
          input: {
            parentRef: self,
            intentHash: output.value.intentHash,
            tokenIn: context.formValues.tokenIn,
            tokenOut: context.formValues.tokenOut,
            intentDescription: output.value.intentDescription,
          },
        })

        return [intentRef, ...context.intentRefs]
      },
    }),

    emitEventIntentPublished: emit(() => ({
      type: "INTENT_PUBLISHED" as const,
    })),

    process1csQuote: assign({
      quote: ({ event }) => {
        if (event.type !== "NEW_1CS_QUOTE") {
          return null
        }

        const { result, tokenInAssetId, tokenOutAssetId } = event.params

        if ("ok" in result) {
          const quote: QuoteResult = {
            tag: "ok",
            value: {
              quoteHashes: [],
              // dry run doesn't have expiration time
              expirationTime: new Date(0).toISOString(),
              tokenDeltas: [
                [tokenInAssetId, -BigInt(result.ok.quote.amountIn)],
                [tokenOutAssetId, BigInt(result.ok.quote.amountOut)],
              ],
              appFee: result.ok.appFee,
            },
          }

          return quote
        }

        const errorQuote: QuoteResult = {
          tag: "err",
          value: {
            reason: "ERR_NO_QUOTES_1CS" as const,
          },
        }
        return errorQuote
      },
      quote1csError: ({ event }) => {
        if (event.type !== "NEW_1CS_QUOTE") {
          return null
        }

        const { result } = event.params
        return "ok" in result ? null : result.err
      },
    }),
  },
  guards: {
    isQuoteValidAndNot1cs: ({ context }) => {
      return (
        !context.is1cs && context.quote != null && context.quote.tag === "ok"
      )
    },

    isOk: (_, a: { tag: "err" | "ok" }) => a.tag === "ok",

    isFormValidAndNot1cs: ({ context }) => {
      return (
        context.parsedFormValues.amountIn != null &&
        context.parsedFormValues.amountIn.amount > 0n &&
        !context.is1cs
      )
    },
    isFormValidAnd1cs: ({ context }) => {
      if (context.is1cs === false) return false
      if (context.formValues.swapType === null) return false
      const amount =
        context.formValues.swapType === QuoteRequest.swapType.EXACT_INPUT
          ? context.parsedFormValues.amountIn
          : context.parsedFormValues.amountOut

      return amount !== null && amount.amount > 0n
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwO4EMAOBaArgSwGIBJAOQBUBRcgfQGUKyyAZCgEQG0AGAXUVAwD2sPABc8AgHZ8QAD0RYArAoAcAOgCMAdgWcALJ04BOZZoBMCgDQgAnvMO7Nq5ac6b1B07oWfDAX19WqJi4hADyJBTUAMJMRFEA0nQMzGxcvEgggsJiktJyCOqmhgDMGsXlxQBs9pqGhuq6VrYIWIaaapWemsXenJXq9er+gejY+AQAQgCCTFMkUZFRABJzAOKpPNJZouJSGfnFuqXKnAqFuvp9CkdNdqaVqoYKVVXeJZpuwyBBY4TTs-NFisSOsOOp0vwhDtcvtEOozqpKppOMVlDVlAN1LcWpViuonHV3B8epU0covj8QgQmKFVqQ0lsoTk9qB8riCQ17kddFojJpsa1dIZVMU3MpxTVilcKaMqTTVqEAKpkBkZbbMvLyUzqB4NIzmbXKBSaSqkgX2YWi9TitEOKWVBQy4LjAAKACU4kC1otwgAxIhugCyUzIRHC1DdFAAioqKLQVZs1UzdpqCpUDIj6uV2uodcbGjZ5OpSm1jKLOLmvEp4U7fgR3Z7osD1tE-QHAxsIZlkzDWXDrqZVNX0-0kbpTGjsUVhUjCrjvJ5XKZirWqQ2Fk3vdE5gsmCwOInIdkU7CCgpSUOjmYLoc+j1scX8ZxTC5lDzlEjyqv8KpIDsJFABCwDgABGAC2oiqke0IsrIcJaKotR6A69TIsoxSGA+GZ6IcL4OmYhikro354L+ED-oBwHgZB4KMsevZwQUz6qM+uhovcWiot0BbNFg+hPhOzzoa49hvo6ATfLKP5-mIAEEHgEgYDgIhQd29GwfkWDmA81SGHohQYWizwCocDwnL07hZkilQkWRFEEBEADq1AxqElCqeqJ59i0dqPCUzzGEh+jFAKlReBo2lhd41omEMEmUtJ5GyYBTnUOoUS0C5ipuRQHk9hpWrFqoPIYfcE71NcmGFji4WFOeUWGrFtkyQpUCqAAbmgAA2eAQGgyUEHl6mplgxSeI8z4NOKDoGNmU7tIiQposYbElBhNnxVJpEtQBHXdb1-WtYNtFJsNp58UVnSitUpIqMW-LVfCajdAYCiEW4L7Pium3OttSWtXtPV9QN7CmF2nkMZpPSDpwJx4ToJJPNiCh+YRRz9LDubtKczX-bt6AUdQACOOACCIYAORQzmue5h5qTBI16Y4b0ThWZhcaiJkIjymLpqKeLeLjFGqATyXE6T5OU856WZTTuV0xDBUtDoDz6CzSImM4ljVVprgaG4uZjSYk0bSMv2qFREEiANECSGAqgKe1AgANb2z8bpgAAZkNDOntUg7aLUuFtEahECsug63e4HHaBU4lm78FugVbNt2w7EhO67FujB73sndBGqnhh+JHMYE4vPonSVAKH6PD0JpnAaPRjbZluiANYAAE6dwIneqBgXX9Z7vdgdnmC5z7hfeV4jjuDd-RGum2u8dOjzdNczhaA01zET9idt9bR2pXLk9eYxzhqIJ7Qb20WjKKFzGku946eMWsOt8n7etWlADGsAELbCQ9tHYuzdjnL26g-6n0hogZEOlKyaF0P0dot9sT6EcLiI4RhRT1HMMaD+1FD4AV-v-QBwCM6gLHhgXOkDYDsHzvTKejFUT4lKsYISz5xRaGRhWIcpxrT6HLsiUUBCU7f1oQQLuPc+4DyHiPKhNCoEK3yqmI4g56gnHLKiN6KIHxPEQgZWKRRjRmHjpJc2B8xYSNSjLLKOVoFKyeMKARbFTSuE5NXHW44RQ6kIlyG8phtCiK-sQiR64vQgh9CQf0QZOx0V9t5XMtdxRmEXpWF899HonEeEaD8Oh4TImMMEohUASH1g9BuZYW4og7goHuOJp0EmMRqD460iDPCuIGNiKUugnAfHnEoIUbhCL+AkhIAQEA4DSASngeJTDNLuBREOQwrMtDLhMJzHW6F8SdHquOJQTU94hDsslOZZ9NJPBRizE4ayOaZN4mxFGgx7CFCxmxckRzErC16l1MAZyYE+WNMVI23g8QrNqA9FeelVDakMuYEqFwShC2SoDA6pzGnzKLCYEUbEXxtBeOYPQAprjFQdC4B0mDtT1FNuYxOO02qi2-iTMmfyMXnPkKSUo90PzLiODcyFiAkQinsDyHQ7RXFvWKeigu7KECkk4CxZaK0Mm4ixF4klLClAvjOCsqV4i-7-KVqSNQhxnBjTGsaCs9z4KsNQlUVmBgtDiX8EAA */
  id: "swap-ui",

  context: ({ input }) => ({
    user: null,
    error: null,
    quote: null,
    quote1csError: null,
    formValues: {
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      amountIn: "",
      amountOut: "",
      swapType: null,
    },
    parsedFormValues: {
      tokenIn: getAnyBaseTokenInfo(input.tokenIn),
      tokenOut: getAnyBaseTokenInfo(input.tokenOut),
      amountIn: null,
      amountOut: null,
    },
    intentCreationResult: null,
    intentRefs: [],
    tokenList: input.tokenList,
    referral: input.referral,
    slippageBasisPoints: 10_000, // 1%
    is1cs: input.is1cs,
    priceChangeDialog: null,
  }),

  entry: [
    "spawnBackgroundQuoterRef",
    "spawnBackground1csQuoterRef",
    "spawnDepositedBalanceRef",
  ],

  on: {
    INTENT_SETTLED: {
      actions: [
        {
          type: "passthroughEvent",
          params: ({ event }) => event,
        },
        "sendToDepositedBalanceRefRefresh",
      ],
    },

    ONE_CLICK_SETTLED: {
      actions: [
        {
          type: "passthroughEvent",
          params: ({ event }) => event,
        },
        "sendToDepositedBalanceRefRefresh",
        {
          type: "sendToDepositedBalanceRefRemoveAccount",
          params: ({ event }) => ({
            depositAddress: event.data.depositAddress,
          }),
        },
      ],
    },

    BALANCE_CHANGED: [
      {
        guard: "isFormValidAndNot1cs",
        actions: "sendToBackgroundQuoterRefNewQuoteInput",
      },
      {
        guard: "isFormValidAnd1cs",
        actions: "sendToBackground1csQuoterRefNewQuoteInput",
      },
    ],

    LOGIN: {
      actions: [
        {
          type: "relayToDepositedBalanceRef",
          params: ({ event }) => event,
        },
        {
          type: "setUser",
          params: ({ event }) => ({
            identifier: event.params.userAddress,
            method: event.params.userChainType,
          }),
        },
      ],
    },
    LOGOUT: {
      actions: [
        {
          type: "relayToDepositedBalanceRef",
          params: ({ event }) => event,
        },
        { type: "setUser", params: null },
      ],
    },

    PRICE_CHANGE_CONFIRMATION_REQUEST: {
      actions: {
        type: "openPriceChangeDialog",
        params: ({ event }) => ({
          newOppositeAmount: event.params.newOppositeAmount,
          previousOppositeAmount: event.params.previousOppositeAmount,
        }),
      },
    },
    PRICE_CHANGE_CONFIRMED: {
      actions: [
        { type: "closePriceChangeDialog" },
        { type: "sendToSwapRef1csConfirm" },
      ],
    },
    PRICE_CHANGE_CANCELLED: {
      actions: [
        { type: "closePriceChangeDialog" },
        { type: "sendToSwapRef1csCancel" },
      ],
    },
  },

  states: {
    editing: {
      on: {
        submit: [
          {
            target: "submitting_1cs",
            guard: "isFormValidAnd1cs",
            actions: [
              "parseFormValues",
              "clearIntentCreationResult",
              "sendToBackground1csQuoterRefPause",
            ],
          },
          {
            target: "submitting",
            guard: "isQuoteValidAndNot1cs",
            actions: [
              "clearIntentCreationResult",
              "sendToBackgroundQuoterRefPause",
            ],
          },
        ],

        input: {
          target: ".validating",
          actions: [
            "sendToBackgroundQuoterRefPause",
            "sendToBackground1csQuoterRefPause",
            "clearQuote",
            "clearError",
            "clear1csError",
            {
              type: "setFormValues",
              params: ({ event }) => ({ data: event.params }),
            },
            "parseFormValues",
          ],
        },

        NEW_QUOTE: {
          actions: [
            {
              type: "setQuote",
              params: ({ event }) => event.params.quote,
            },
            "updateFormValuesWithQuoteData",
            "updateUIAmount",
          ],
        },

        NEW_1CS_QUOTE: {
          actions: [
            "process1csQuote",
            "updateFormValuesWithQuoteData",
            "parseFormValues",
            "updateUIAmount",
          ],
        },
      },

      states: {
        idle: {},

        validating: {
          always: [
            {
              target: "waiting_quote",
              guard: "isFormValidAndNot1cs",
              actions: "sendToBackgroundQuoterRefNewQuoteInput",
            },
            {
              target: "waiting_quote",
              guard: "isFormValidAnd1cs",
              actions: "sendToBackground1csQuoterRefNewQuoteInput",
            },
            "idle",
          ],
        },

        waiting_quote: {
          on: {
            NEW_QUOTE: {
              target: "idle",
              actions: [
                {
                  type: "setQuote",
                  params: ({ event }) => event.params.quote,
                },
                "updateFormValuesWithQuoteData",
                "updateUIAmount",
              ],
              description: `should do the same as NEW_QUOTE on "editing" itself`,
            },
            NEW_1CS_QUOTE: {
              target: "idle",
              actions: [
                "process1csQuote",
                "updateFormValuesWithQuoteData",
                "parseFormValues",
                "updateUIAmount",
              ],
            },
          },
        },
      },

      initial: "idle",
    },

    submitting: {
      invoke: {
        id: "swapRef",
        src: "swapActor",

        input: ({ context, event }) => {
          assertEvent(event, "submit")

          const quote = context.quote
          assert(quote !== null, "non valid quote")
          assert(quote.tag === "ok", "non valid quote")
          return {
            userAddress: event.params.userAddress,
            userChainType: event.params.userChainType,
            defuseUserId: authIdentity.authHandleToIntentsUserId(
              event.params.userAddress,
              event.params.userChainType
            ),
            referral: context.referral,
            slippageBasisPoints: context.slippageBasisPoints,
            nearClient: event.params.nearClient,
            intentOperationParams: {
              type: "swap" as const,
              tokensIn: getUnderlyingBaseTokenInfos(context.formValues.tokenIn),
              tokenOut: context.parsedFormValues.tokenOut,
              quote: quote.value,
            },
          }
        },

        onDone: [
          {
            target: "editing",
            guard: { type: "isOk", params: ({ event }) => event.output },

            actions: [
              "resetParsedFormValueAmounts",
              "resetFormValueAmounts",
              {
                type: "spawnIntentStatusActor",
                params: ({ event }) => event.output,
              },
              {
                type: "setIntentCreationResult",
                params: ({ event }) => event.output,
              },
              "emitEventIntentPublished",
            ],
          },
          {
            target: "editing",

            actions: [
              {
                type: "setIntentCreationResult",
                params: ({ event }) => event.output,
              },
            ],
          },
        ],

        onError: {
          target: "editing",

          actions: ({ event }) => {
            logger.error(event.error)
          },
        },
      },

      on: {
        NEW_QUOTE: {
          guard: {
            type: "isOk",
            params: ({ event }) => event.params.quote,
          },
          actions: [
            {
              type: "setQuote",
              params: ({ event }) => event.params.quote,
            },
            {
              type: "sendToSwapRefNewQuote",
              params: ({ event }) => event,
            },
          ],
        },
      },
    },

    submitting_1cs: {
      invoke: {
        id: "swapRef1cs",
        src: "swap1csActor",

        input: ({ context, event, self }) => {
          assertEvent(event, "submit")

          assert(
            context.parsedFormValues.amountIn != null &&
              context.parsedFormValues.amountIn.amount > 0n &&
              context.parsedFormValues.amountOut != null &&
              context.parsedFormValues.amountOut.amount > 0n &&
              context.is1cs &&
              context.formValues.swapType !== null &&
              context.quote &&
              context.quote.tag === "ok",
            "Invalid input for submitting_1cs"
          )
          assert(context.user?.identifier != null, "user address is not set")
          assert(context.user?.method != null, "user chain type is not set")
          const isExactInput =
            context.formValues.swapType === QuoteRequest.swapType.EXACT_INPUT
          // However knows how to access the child's state, please update this
          const snapshot = self.getSnapshot()
          const depositedBalanceRef:
            | ActorRefFrom<typeof depositedBalanceMachine>
            | undefined = snapshot.children.depositedBalanceRef
          const balances = balancesSelector(depositedBalanceRef?.getSnapshot())

          assert(
            context.parsedFormValues.amountIn != null,
            "amountIn is not set"
          )
          return {
            tokenIn: context.parsedFormValues.tokenIn,
            tokenOut: context.parsedFormValues.tokenOut,
            amountIn: context.parsedFormValues.amountIn,
            amountOut: context.parsedFormValues.amountOut,
            amountInTokenBalance:
              balances[context.parsedFormValues.tokenIn.defuseAssetId],
            swapType: context.formValues.swapType,
            slippageBasisPoints: context.slippageBasisPoints,
            defuseUserId: authIdentity.authHandleToIntentsUserId(
              context.user.identifier,
              context.user.method
            ),
            deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            referral: context.referral,
            userAddress: event.params.userAddress,
            userChainType: event.params.userChainType,
            nearClient: event.params.nearClient,
            previousOppositeAmount: {
              amount: BigInt(
                isExactInput
                  ? context.quote.value.tokenDeltas[1][1]
                  : -context.quote.value.tokenDeltas[0][1]
              ),
              decimals: isExactInput
                ? context.parsedFormValues.tokenOut.decimals
                : context.parsedFormValues.tokenIn.decimals,
            },
            parentRef: self,
          }
        },

        onDone: [
          {
            target: "editing",
            guard: { type: "isOk", params: ({ event }) => event.output },

            actions: [
              "resetParsedFormValueAmounts",
              "resetFormValueAmounts",
              {
                type: "spawnIntentStatusActor",
                params: ({ event }) => event.output,
              },
              {
                type: "setIntentCreationResult",
                params: ({ event }) => event.output,
              },
              sendTo("depositedBalanceRef", ({ event }) => {
                assert(event.output.tag === "ok")
                if (event.output.value.depositAddress != null) {
                  return {
                    type: "ADD_ACCOUNT",
                    params: {
                      accountId: authIdentity.authHandleToIntentsUserId(
                        event.output.value.depositAddress,
                        "near"
                      ),
                    },
                  }
                }
              }),
              "emitEventIntentPublished",
            ],
          },
          {
            target: "editing",

            actions: [
              {
                type: "setIntentCreationResult",
                params: ({ event }) => event.output,
              },
            ],
          },
        ],

        onError: {
          target: "editing",

          actions: [
            ({ event }) => {
              logger.error(event.error)
            },
          ],
        },
      },

      on: {
        NEW_1CS_QUOTE: {
          actions: [
            "process1csQuote",
            "updateFormValuesWithQuoteData",
            "updateUIAmount",
          ],
        },
      },
    },
  },

  initial: "editing",
})
