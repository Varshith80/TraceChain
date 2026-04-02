/**
 * Supabase client for backend
 * Uses service role key for admin operations (bypasses RLS)
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }

    supabaseInstance = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    logger.info('Supabase client initialized');
  }

  return supabaseInstance;
}
