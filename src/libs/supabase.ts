import { createClient } from "@supabase/supabase-js"

import type { Database } from "@src/types/database-generated"
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@src/utils/environment"

if (!SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL")
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")
}

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
)
