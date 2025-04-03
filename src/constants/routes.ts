export const navigation = {
  home: "/",
  account: "/account",
  deposit: "/deposit",
  withdraw: "/withdraw",
  otc: "/otc-desk/create-order",
  jobs: "/jobs",
} satisfies Record<AppRoutes, string>

export type AppRoutes =
  | "home"
  | "account"
  | "deposit"
  | "withdraw"
  | "otc"
  | "jobs"

export type NavigationLinks = {
  href: (typeof navigation)[keyof typeof navigation]
  label: string
  comingSoon?: true
}

/**
 * @deprecated Use navigation object directly instead of appRoutes
 */
export const appRoutes: Record<AppRoutes, NavigationLinks> = {
  account: { href: navigation.account, label: "Account" },
  deposit: { href: navigation.deposit, label: "Deposit" },
  home: { href: navigation.home, label: "Swap" },
  otc: { href: navigation.otc, label: "OTC" },
  withdraw: { href: navigation.withdraw, label: "Withdraw" },
  jobs: { href: navigation.jobs, label: "Jobs" },
}
