export const navigation = {
  home: "/",
  account: "/account",
  history: "/history",
  deposit: "/deposit",
  withdraw: "/withdraw",
  otc: "/deals",
  jobs: "/jobs",
} satisfies Record<AppRoutes, string>

export type AppRoutes =
  | "home"
  | "account"
  | "history"
  | "deposit"
  | "withdraw"
  | "otc"
  | "jobs"
