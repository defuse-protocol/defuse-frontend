export function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  let pointer = 0
  const totalLength = arrays.reduce((prev, curr) => prev + curr.length, 0)

  const toReturn = new Uint8Array(totalLength)

  for (const arr of arrays) {
    toReturn.set(arr, pointer)
    pointer += arr.length
  }

  return toReturn
}
