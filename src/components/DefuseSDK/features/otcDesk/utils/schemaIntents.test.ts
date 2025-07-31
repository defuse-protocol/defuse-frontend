import * as v from "valibot"
import { describe, expect, it } from "vitest"
import { IntentSchema } from "./schemaIntents"

describe("IntentSchema", () => {
  it.each([
    {
      intent: "token_diff",
      diff: { "nep141:token": "100", "nep141:token2": "-200" },
    },
    {
      intent: "token_diff",
      diff: { "nep141:token": "100" },
      memo: "some plain text",
      referral: "foo-referral.near",
    },
  ])("valid token_diff", (intent) => {
    expect(() => v.parse(IntentSchema, intent)).not.toThrow()
  })

  it.each([
    {
      intent: "token_diff",
      diff: { token: "100" },
    },
    {
      intent: "token_diff",
      diff: { "nep141:invalid-token-": "100" },
    },
    {
      intent: "token_diff",
      diff: { "nep141:wrap.near": 100 },
    },
    {
      intent: "token_diff",
      diff: { "nep141:token": "100" },
      memo: null,
      referral: null,
    },
  ])("invalid token_diff", (intent) => {
    expect(() => v.parse(IntentSchema, intent)).toThrow()
  })

  it.each([
    {
      intent: "native_withdraw",
      receiver_id: "user.near",
      amount: "100",
    },
  ])("valid native_withdraw", (intent) => {
    expect(() => v.parse(IntentSchema, intent)).not.toThrow()
  })

  it.each([
    {
      intent: "native_withdraw",
      receiver_id: "user-",
      amount: "100",
    },
    {
      intent: "native_withdraw",
      receiver_id: "user-",
      amount: 100,
    },
  ])("invalid native_withdraw", (intent) => {
    expect(() => v.parse(IntentSchema, intent)).toThrow()
  })

  it.each([
    {
      // Regular withdraw to Near blockchain, user.near already has this token on their balance
      intent: "ft_withdraw",
      token: "usdt.tether-token.near",
      receiver_id: "user.near",
      amount: "100",
    },
    {
      // Regular withdraw to Near blockchain, user.near has never had this token on their balance
      intent: "ft_withdraw",
      token: "usdt.tether-token.near",
      receiver_id: "user.near",
      amount: "100",
      storage_deposit: "1250000000000000000000",
    },
    {
      // Withdraw to Aurora blockchain
      intent: "ft_withdraw",
      token: "usdt.tether-token.near",
      receiver_id: "aurora",
      amount: "100",
      msg: "beefcbe1c63ae6573c934bc433e3ccd6d0b52a8e",
    },
    {
      // Withdraw USDT@Arbitrum (USDT from Arbitrum bridged using POA Bridge)
      intent: "ft_withdraw",
      token: "arb-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9.omft.near",
      receiver_id: "arb-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9.omft.near",
      amount: "100",
      memo: "WITHDRAW_TO:0xBEEFcBe1C63ae6573c934Bc433e3cCD6D0b52a8E",
    },
    {
      // `memo` and `msg` can be arbitrary strings, they don't need to have a specific format
      intent: "ft_withdraw",
      token: "arb-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9.omft.near",
      receiver_id: "arb-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9.omft.near",
      amount: "100",
      memo: "",
      msg: "",
    },
  ])("valid ft_withdraw", (intent) => {
    expect(() => v.parse(IntentSchema, intent)).not.toThrow()
  })

  it.each([
    {
      intent: "ft_withdraw",
      token: "usdt.tether-token.near",
      receiver_id: "incorrect-account-id-",
      amount: "100",
    },
    {
      intent: "ft_withdraw",
      token: "nep141:usdt.tether-token.near",
      receiver_id: "user.near",
      amount: "100",
    },
    {
      intent: "ft_withdraw",
      token: "usdt.tether-token.near",
      receiver_id: "user.near",
      amount: 100,
    },
    {
      intent: "ft_withdraw",
      token: "usdt.tether-token.near",
      receiver_id: "user.near",
      amount: "100",
      memo: null,
      msg: null,
    },
  ])("invalid ft_withdraw", (intent) => {
    expect(() => v.parse(IntentSchema, intent)).toThrow()
  })

  it.each([
    {
      intent: "transfer",
      tokens: { "usdt.tether-token.near": "100" },
      receiver_id: "user.near",
    },
  ])("valid transfer", (intent) => {
    expect(() => v.parse(IntentSchema, intent)).not.toThrow()
  })
})
