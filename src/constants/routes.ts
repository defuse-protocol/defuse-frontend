export const navigation = {
  home: "/",
  account: "/account",
  deposit: "/deposit",
  withdraw: "/withdraw",
  otc: "/otc/create-order",
  jobs: "/jobs",
  explore: "/explore",
} satisfies Record<AppRoutes, string>

export type AppRoutes =
  | "home"
  | "account"
  | "deposit"
  | "withdraw"
  | "otc"
  | "jobs"
  | "explore"
