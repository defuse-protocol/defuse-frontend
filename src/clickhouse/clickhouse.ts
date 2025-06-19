import { createClient } from "@clickhouse/client"

export const clickHouseClient = createClient({
  url: process.env.CLICK_HOUSE_URL,
  username: process.env.CLICK_HOUSE_USERNAME,
  password: process.env.CLICK_HOUSE_PASSWORD,
})
