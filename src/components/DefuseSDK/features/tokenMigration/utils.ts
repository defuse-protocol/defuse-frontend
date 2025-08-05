export function getTokenAccountId(tokenId: string) {
  if (tokenId.startsWith("nep141:")) {
    return tokenId.slice(7)
  }
  throw new Error("Invalid token ID")
}
