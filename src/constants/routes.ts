export const navigation = {
  home: "/",
  account: "/account",
  deposit: "/deposit",
  withdraw: "/withdraw",
  jobs: "/jobs",
} as const

export type NavigationLinks = {
  href: (typeof navigation)[keyof typeof navigation]
  label: string
  comingSoon?: true
}

export type AppRoutes = "account" | "deposit" | "swap" | "withdraw"

export const appRoutes: Record<AppRoutes, NavigationLinks> = {
  account: { href: navigation.account, label: "Account" },
  deposit: { href: navigation.deposit, label: "Deposit" },
  swap: { href: navigation.home, label: "Swap" },
  withdraw: { href: navigation.withdraw, label: "Withdraw" },
}
