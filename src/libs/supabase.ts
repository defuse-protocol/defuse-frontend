import { createClient } from "@supabase/supabase-js"

import type { Database } from "@src/types/database-generated"

if (!process.env.SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL")
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")
}

export const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
