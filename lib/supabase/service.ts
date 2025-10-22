import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { env } from "@/env";

/**
 * Service role client for server-side operations that need to bypass RLS
 * Used for cron jobs, admin operations, and automated tasks
 *
 * WARNING: This client bypasses all RLS policies. Only use for trusted operations.
 */
export function createServiceClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
