import { describe, expect, it } from "vitest"
import { formatTokenValue } from "./format"

describe("formatTokenValue()", () => {
  it.each`
    number           | decimals | fractionDigits | min          | result
    ${123}           | ${0}     | ${0}           | ${undefined} | ${"123"}
    ${123}           | ${1}     | ${0}           | ${undefined} | ${"12"}
    ${123}           | ${1}     | ${1}           | ${undefined} | ${"12.3"}
    ${123}           | ${0}     | ${1}           | ${undefined} | ${"123"}
    ${123}           | ${9}     | ${3}           | ${undefined} | ${"0"}
    ${123}           | ${9}     | ${9}           | ${undefined} | ${"0.000000123"}
    ${1_000_000_000} | ${9}     | ${9}           | ${undefined} | ${"1"}
    ${1_000_000_001} | ${9}     | ${9}           | ${undefined} | ${"1.000000001"}
    ${1_000_000}     | ${9}     | ${9}           | ${undefined} | ${"0.001"}
    ${1_002}         | ${3}     | ${undefined}   | ${undefined} | ${"1.002"}
    ${1234}          | ${2}     | ${3}           | ${undefined} | ${"12.34"}
    ${1234}          | ${2}     | ${1}           | ${undefined} | ${"12.3"}
    ${1234}          | ${2}     | ${undefined}   | ${1000}      | ${"< 1000"}
    ${123}           | ${3}     | ${1}           | ${0.1}       | ${"0.1"}
    ${123}           | ${3}     | ${2}           | ${0.1}       | ${"0.12"}
    ${123}           | ${4}     | ${2}           | ${0.1}       | ${"< 0.1"}
    ${1234}          | ${4}     | ${undefined}   | ${0.01}      | ${"0.1234"}
    ${1234}          | ${4}     | ${2}           | ${0.01}      | ${"0.12"}
    ${-1234}         | ${4}     | ${2}           | ${0.01}      | ${"-0.12"}
    ${-123}          | ${4}     | ${2}           | ${0.1}       | ${"< -0.1"}
  `(
    "formats token value",
    ({ number, decimals, fractionDigits, min, result }) => {
      expect(
        formatTokenValue(number, decimals, { fractionDigits, min })
      ).toEqual(result)
    }
  )
})
