import { Err, Ok, type Result } from "@thames/monads"

// biome-ignore lint/complexity/noBannedTypes: `{}` is needed
type NonUndefined = {} | null

export function toResult<
  T extends NonUndefined,
  E extends NonUndefined,
  R extends { tag: "ok"; value: T } | { tag: "err"; value: E },
>(
  a: R
): Result<
  R extends { tag: "ok" } ? R["value"] : never,
  R extends { tag: "err" } ? R["value"] : never
> {
  // @ts-expect-error Somebody please fix it
  return a.tag === "ok" ? Ok(a.value) : Err(a.value)
}
