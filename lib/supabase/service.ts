import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * Service role client for server-side operations that need to bypass RLS
 * Used for cron jobs, admin operations, and automated tasks
 * 
 * WARNING: This client bypasses all RLS policies. Only use for trusted operations.
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}