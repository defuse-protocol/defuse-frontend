export enum Navigation {
  HOME = "/",
  DEPOSIT = "/deposit",
  WITHDRAW = "/withdraw",
  JOBS = "/jobs",
}

export type NavigationLinks = {
  action?: () => void
  href?: Navigation
  label: string
  comingSoon?: true
}

export const LINKS_HEADER: NavigationLinks[] = [
  { href: Navigation.DEPOSIT, label: "Deposit" },
  { href: Navigation.HOME, label: "Swap" },
  { href: Navigation.WITHDRAW, label: "Withdraw" },
]
