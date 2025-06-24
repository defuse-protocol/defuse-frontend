import { createClient } from "@clickhouse/client"

export const clickHouseClient = createClient({
  url: process.env.CLICK_HOUSE_URL,
  username: process.env.CLICK_HOUSE_USERNAME,
  password: process.env.CLICK_HOUSE_PASSWORD,
})

/**
 * Helper to run a ClickHouse query and return typed rows.
 */
export async function chQuery<T>(
  query: string,
  query_params?: Record<string, unknown>
): Promise<T[]> {
  const { data } = await clickHouseClient
    .query({ query, ...(query_params ? { query_params } : {}) })
    .then((res) => res.json<T>())

  return data
}

/**
 * Same as {@link chQuery} but returns only the first row (or undefined).
 */
export async function chQueryFirst<T>(
  query: string,
  query_params?: Record<string, unknown>
): Promise<T | undefined> {
  const rows = await chQuery<T>(query, query_params)
  return rows[0]
}
