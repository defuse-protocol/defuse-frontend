import { Address as TonAddress } from "@ton/ton"

export function parseTonAddress(address: string): string {
  const parsedAddress = TonAddress.parse(address)
  return parsedAddress.toString({
    urlSafe: true,
    bounceable: false,
    testOnly: false,
  })
}
