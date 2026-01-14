export const navigation = {
  home: "/",
  account: "/account",
  deposit: "/deposit",
  withdraw: "/withdraw",
  otc: "/deals",
  jobs: "/jobs",
} satisfies Record<AppRoutes, string>

export type AppRoutes =
  | "home"
  | "account"
  | "deposit"
  | "withdraw"
  | "otc"
  | "jobs"
