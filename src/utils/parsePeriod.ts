export const parsePeriod = (period: string): string => {
  switch (period) {
    case "1d":
      return "1"
    case "7d":
      return "7"
    case "1m":
      return "30"
    case "3m":
      return "90"
  }
}
